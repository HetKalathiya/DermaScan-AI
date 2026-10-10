const LockedSlot = require('../models/LockedSlot');
const Doctor = require('../models/Doctor');
const Consultation = require('../models/Consultation');

const DEFAULT_SLOTS = [
    { time: '09:00 AM', period: 'morning' },
    { time: '09:30 AM', period: 'morning' },
    { time: '10:00 AM', period: 'morning' },
    { time: '10:30 AM', period: 'morning' },
    { time: '11:00 AM', period: 'morning' },
    { time: '11:30 AM', period: 'morning' },
    { time: '12:00 PM', period: 'morning' },
    { time: '02:00 PM', period: 'afternoon' },
    { time: '02:30 PM', period: 'afternoon' },
    { time: '03:00 PM', period: 'afternoon' },
    { time: '03:30 PM', period: 'afternoon' },
    { time: '04:00 PM', period: 'afternoon' },
    { time: '04:30 PM', period: 'afternoon' },
    { time: '05:00 PM', period: 'afternoon' },
];

const parseSlotToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let [_, h, m, meridiem] = match;
    let hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    if (meridiem.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return hour * 60 + minute;
};

// ─── Get Doctor Schedule (Booked & Locked Slots) ───────────────────────────
const getDoctorSchedule = async (req, res, next) => {
    try {
        const doctor = await Doctor.findOne({ user_id: req.user._id });
        if (!doctor) {
            return res.status(403).json({ success: false, error: 'Doctor profile not found' });
        }

        const dateStr = req.query.date || new Date().toISOString().split('T')[0];

        // 1. Fetch locked slots for this doctor on the date
        const lockedSlots = await LockedSlot.find({
            doctor_id: doctor._id,
            date: dateStr
        });

        const isFullDayLocked = lockedSlots.some(l => l.is_full_day);
        const fullDayLock = lockedSlots.find(l => l.is_full_day);

        const lockedTimeMap = new Map();
        lockedSlots.forEach(l => {
            if (l.time) {
                lockedTimeMap.set(l.time.trim().toUpperCase(), l);
            }
        });

        // 2. Fetch active booked appointments on the date
        const bookedAppointments = await Consultation.find({
            doctor_id: doctor._id,
            appointment_date: dateStr,
            status: { $in: ['pending_appointment', 'active', 'completed'] }
        }).populate('patient_id', 'name email phone age gender');

        const bookedMap = new Map();
        bookedAppointments.forEach(appt => {
            if (appt.appointment_time) {
                bookedMap.set(appt.appointment_time.trim().toUpperCase(), appt);
            }
        });

        // 3. Current time calculation for past slots
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        // 4. Map default slots with rich status
        const scheduleSlots = DEFAULT_SLOTS.map(slot => {
            const normalizedTime = slot.time.trim().toUpperCase();
            const bookedAppt = bookedMap.get(normalizedTime);
            const lockRecord = isFullDayLocked ? fullDayLock : lockedTimeMap.get(normalizedTime);
            const slotMinutes = parseSlotToMinutes(slot.time);
            const isPast = isToday && slotMinutes <= (nowMinutes + 15);

            let status = 'available';
            if (bookedAppt) {
                status = 'booked';
            } else if (lockRecord) {
                status = 'locked';
            } else if (isPast) {
                status = 'past';
            }

            return {
                time: slot.time,
                period: slot.period,
                status,
                isBooked: !!bookedAppt,
                isLocked: !!lockRecord,
                isPast,
                lockId: lockRecord ? lockRecord._id : null,
                lockReason: lockRecord ? (lockRecord.reason || 'Unavailable') : null,
                bookingDetails: bookedAppt ? {
                    consultationId: bookedAppt._id,
                    patientName: bookedAppt.patient_id?.name || 'Patient',
                    patientEmail: bookedAppt.patient_id?.email || '',
                    patientPhone: bookedAppt.patient_id?.phone || '',
                    status: bookedAppt.status,
                    message: bookedAppt.message || ''
                } : null
            };
        });

        res.json({
            success: true,
            date: dateStr,
            doctorId: doctor._id,
            isFullDayLocked,
            fullDayReason: fullDayLock ? fullDayLock.reason : null,
            slots: scheduleSlots,
            totalSlots: scheduleSlots.length,
            bookedCount: bookedAppointments.length,
            lockedCount: isFullDayLocked ? scheduleSlots.length : lockedSlots.filter(l => !l.is_full_day).length
        });
    } catch (err) {
        console.error('Error fetching doctor schedule:', err);
        next(err);
    }
};

// ─── Lock a Single Slot or Full Day ───────────────────────────────────────
const lockDoctorSlot = async (req, res, next) => {
    try {
        const doctor = await Doctor.findOne({ user_id: req.user._id });
        if (!doctor) {
            return res.status(403).json({ success: false, error: 'Doctor profile not found' });
        }

        const { date, time, reason, is_full_day } = req.body;

        if (!date) {
            return res.status(400).json({ success: false, error: 'Date is required (YYYY-MM-DD)' });
        }
        if (!is_full_day && !time) {
            return res.status(400).json({ success: false, error: 'Time slot is required when not locking full day' });
        }

        // Check if date is in past
        const lockDate = new Date(`${date}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (lockDate < today) {
            return res.status(400).json({ success: false, error: 'Cannot lock slots in the past' });
        }

        if (is_full_day) {
            // Check for existing booked appointments on this day
            const existingBookings = await Consultation.find({
                doctor_id: doctor._id,
                appointment_date: date,
                status: { $in: ['pending_appointment', 'active', 'completed'] }
            }).populate('patient_id', 'name');

            // Delete any existing individual slot locks on that day to avoid redundancy
            await LockedSlot.deleteMany({ doctor_id: doctor._id, date });

            const fullDayLock = new LockedSlot({
                doctor_id: doctor._id,
                date,
                is_full_day: true,
                reason: reason || 'Full Day Off'
            });
            await fullDayLock.save();

            let warning = null;
            if (existingBookings.length > 0) {
                warning = `Notice: You have ${existingBookings.length} existing patient consultation(s) on this date. Please review them.`;
            }

            return res.status(201).json({
                success: true,
                message: 'Full day locked successfully',
                warning,
                lockedSlot: fullDayLock
            });
        }

        // Single slot lock
        const trimmedTime = time.trim();

        // Check if this slot already has a booked appointment
        const existingBooking = await Consultation.findOne({
            doctor_id: doctor._id,
            appointment_date: date,
            appointment_time: trimmedTime,
            status: { $in: ['pending_appointment', 'active', 'completed'] }
        }).populate('patient_id', 'name');

        if (existingBooking) {
            const patientName = existingBooking.patient_id?.name || 'a patient';
            return res.status(409).json({
                success: false,
                error: `This slot is already booked by ${patientName}. Please handle or reschedule the consultation first.`
            });
        }

        // Upsert lock
        let lockedSlot = await LockedSlot.findOne({
            doctor_id: doctor._id,
            date,
            time: trimmedTime
        });

        if (lockedSlot) {
            lockedSlot.reason = reason || 'Unavailable';
            await lockedSlot.save();
        } else {
            lockedSlot = new LockedSlot({
                doctor_id: doctor._id,
                date,
                time: trimmedTime,
                reason: reason || 'Unavailable',
                is_full_day: false
            });
            await lockedSlot.save();
        }

        res.status(201).json({
            success: true,
            message: `Slot ${trimmedTime} locked successfully`,
            lockedSlot
        });
    } catch (err) {
        console.error('Error locking slot:', err);
        next(err);
    }
};

// ─── Unlock a Slot or Full Day ─────────────────────────────────────────────
const unlockDoctorSlot = async (req, res, next) => {
    try {
        const doctor = await Doctor.findOne({ user_id: req.user._id });
        if (!doctor) {
            return res.status(403).json({ success: false, error: 'Doctor profile not found' });
        }

        const { date, time, lockId, is_full_day } = req.body;

        if (lockId) {
            await LockedSlot.findOneAndDelete({ _id: lockId, doctor_id: doctor._id });
            return res.json({ success: true, message: 'Slot unlocked successfully' });
        }

        if (is_full_day || !time) {
            await LockedSlot.deleteMany({ doctor_id: doctor._id, date });
            return res.json({ success: true, message: 'All locks removed for this date' });
        }

        const trimmedTime = time.trim();
        // Remove individual slot lock
        await LockedSlot.findOneAndDelete({
            doctor_id: doctor._id,
            date,
            time: trimmedTime
        });

        // Also check if full-day lock was active; if so, convert full-day lock to individual locks on all OTHER slots
        const fullDayLock = await LockedSlot.findOne({
            doctor_id: doctor._id,
            date,
            is_full_day: true
        });

        if (fullDayLock) {
            await LockedSlot.findByIdAndDelete(fullDayLock._id);
            // Create individual locks for all slots except this unlocked one
            const remainingSlots = DEFAULT_SLOTS.filter(s => s.time.trim() !== trimmedTime);
            const newLocks = remainingSlots.map(s => ({
                doctor_id: doctor._id,
                date,
                time: s.time.trim(),
                reason: fullDayLock.reason || 'Unavailable',
                is_full_day: false
            }));
            if (newLocks.length > 0) {
                await LockedSlot.insertMany(newLocks);
            }
        }

        res.json({ success: true, message: `Slot ${trimmedTime} unlocked successfully` });
    } catch (err) {
        console.error('Error unlocking slot:', err);
        next(err);
    }
};

// ─── Bulk Lock Slots (e.g. Morning, Afternoon, or Selected Array) ──────────
const bulkLockDoctorSlots = async (req, res, next) => {
    try {
        const doctor = await Doctor.findOne({ user_id: req.user._id });
        if (!doctor) {
            return res.status(403).json({ success: false, error: 'Doctor profile not found' });
        }

        const { date, period, times, reason } = req.body;
        if (!date) {
            return res.status(400).json({ success: false, error: 'Date is required (YYYY-MM-DD)' });
        }

        let targetTimes = [];
        if (Array.isArray(times) && times.length > 0) {
            targetTimes = times;
        } else if (period === 'morning') {
            targetTimes = DEFAULT_SLOTS.filter(s => s.period === 'morning').map(s => s.time);
        } else if (period === 'afternoon') {
            targetTimes = DEFAULT_SLOTS.filter(s => s.period === 'afternoon').map(s => s.time);
        } else if (period === 'all') {
            targetTimes = DEFAULT_SLOTS.map(s => s.time);
        } else {
            return res.status(400).json({ success: false, error: 'Specify times array or period (morning/afternoon/all)' });
        }

        // Check which slots are already booked by patients
        const bookedAppointments = await Consultation.find({
            doctor_id: doctor._id,
            appointment_date: date,
            status: { $in: ['pending_appointment', 'active', 'completed'] }
        }).select('appointment_time');

        const bookedSet = new Set(bookedAppointments.map(a => (a.appointment_time || '').trim().toUpperCase()));

        let lockedCount = 0;
        let skippedBooked = 0;

        for (const timeStr of targetTimes) {
            const normalized = timeStr.trim().toUpperCase();
            if (bookedSet.has(normalized)) {
                skippedBooked++;
                continue;
            }

            await LockedSlot.findOneAndUpdate(
                { doctor_id: doctor._id, date, time: timeStr.trim() },
                { doctor_id: doctor._id, date, time: timeStr.trim(), reason: reason || 'Unavailable', is_full_day: false },
                { upsert: true, new: true }
            );
            lockedCount++;
        }

        res.json({
            success: true,
            message: `Locked ${lockedCount} slot(s).` + (skippedBooked > 0 ? ` (${skippedBooked} booked slots were preserved)` : ''),
            lockedCount,
            skippedBooked
        });
    } catch (err) {
        console.error('Error in bulkLockDoctorSlots:', err);
        next(err);
    }
};

module.exports = {
    getDoctorSchedule,
    lockDoctorSlot,
    unlockDoctorSlot,
    bulkLockDoctorSlots,
    DEFAULT_SLOTS
};
