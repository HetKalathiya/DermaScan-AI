const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { cloudinary } = require('../config/cloudinary');

// ─── Patient: Book Appointment ─────────────────────────────────────────────
const bookAppointment = async (req, res, next) => {
    try {
        const { doctor_id, appointment_date, appointment_time, message, image_data,
                ai_condition, ai_confidence, ai_result } = req.body;

        // Validate appointment date is not in the past
        if (appointment_date) {
            const apptDate = new Date(`${appointment_date}T${appointment_time || '00:00'}`);
            if (apptDate < new Date()) {
                return res.status(400).json({ success: false, error: 'Appointment date cannot be in the past' });
            }
        }

        let imgData = image_data;
        if (imgData && imgData.startsWith('data:image')) {
            const uploadRes = await cloudinary.uploader.upload(imgData, { folder: 'dermascan-images' });
            imgData = uploadRes.secure_url;
        }

        const newAppointment = new Consultation({
            patient_id: req.user._id,
            doctor_id: doctor_id,
            status: 'pending_appointment',
            appointment_date,
            appointment_time,
            message,
            image_data: imgData || undefined,
            ai_condition: ai_condition || 'Unknown',
            ai_confidence: ai_confidence || 0,
            ai_result: ai_result || 'unknown',
        });
        await newAppointment.save();

        res.status(201).json({ success: true, message: 'Appointment booked successfully', id: newAppointment._id.toString() });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// ─── Doctor: Get All Consultations ────────────────────────────────────────
const getDoctorConsultations = async (req, res, next) => {
    try {
        const doctor = await Doctor.findOne({ user_id: req.user._id });
        if (!doctor) return res.status(403).json({ success: false, error: 'Not a registered doctor' });

        const consultations = await Consultation.find({
            $or: [
                { doctor_id: doctor._id },
                { claimed_by: req.user._id },
                { doctor_id: { $exists: false } },
                { doctor_id: null }
            ]
        })
            .populate('patient_id', 'name email age gender phone')
            .sort({ created_at: -1 });

        const formattedConsultations = consultations.map(c => {
            const doc = c.toJSON();
            if (c.patient_id) {
                doc.patient_name = c.patient_id.name;
                doc.patient_email = c.patient_id.email;
                doc.patient_age = c.patient_id.age || null;
                doc.patient_gender = c.patient_id.gender || null;
                doc.patient_phone = c.patient_id.phone || null;
            }
            // Backward compat: parse old-format AI data from diagnosis string if structured fields empty
            if (!doc.ai_condition || doc.ai_condition === 'Unknown') {
                const match = (c.diagnosis || '').match(/AI Analysis:\s*(.+?)\s*\((.+?)\)/);
                if (match) {
                    doc.ai_condition = match[1];
                    doc.ai_confidence = parseInt(match[2]) || 0;
                }
            }
            doc.is_claimed_by_me = c.claimed_by === req.user._id;
            return doc;
        });

        res.status(200).json(formattedConsultations);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// ─── Doctor: Claim an unassigned consultation ─────────────────────────────
const claimConsultation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const consultation = await Consultation.findById(id);
        if (!consultation) return res.status(404).json({ success: false, error: 'Consultation not found' });
        if (consultation.claimed_by) {
            return res.status(409).json({ success: false, error: 'Consultation already claimed by another doctor' });
        }
        consultation.claimed_by = req.user._id;
        consultation.status = 'active';
        await consultation.save();
        res.json({ success: true, message: 'Consultation claimed successfully' });
    } catch (err) {
        next(err);
    }
};

// ─── Doctor: Update Diagnosis ─────────────────────────────────────────────
const updateDoctorConsultation = async (req, res, next) => {
    try {
        const { diagnosis, treatment, follow_up, status } = req.body;
        const { id } = req.params;

        const updated = await Consultation.findByIdAndUpdate(id, {
            diagnosis,
            treatment,
            follow_up,
            status: status || 'completed'
        }, { new: true });

        // Notify patient via Socket.IO that their consultation has been reviewed
        try {
            const { getSocketIO } = require('../sockets');
            const io = getSocketIO();
            if (io && updated) {
                io.emit(`consultation_completed_${updated.patient_id.toString()}`, {
                    consultationId: id,
                    message: 'Your consultation has been reviewed by a doctor.',
                    diagnosis,
                    treatment,
                    follow_up
                });
            }
        } catch (_) { /* socket not critical */ }

        // Auto-create a persistent notification for the patient
        try {
            if (updated) {
                await Notification.create({
                    user_id: updated.patient_id,
                    type: 'consultation_completed',
                    title: 'Your scan has been reviewed',
                    message: 'A dermatologist has submitted a diagnosis for your consultation.',
                    link: '/my-reports'
                });
            }
        } catch (_) { /* notification not critical */ }

        res.status(200).json({ success: true, message: 'Consultation updated' });
    } catch (err) {
        next(err);
    }
};

// ─── Patient: Get My Consultations ────────────────────────────────────────
const getUserConsultations = async (req, res, next) => {
    try {
        const consultations = await Consultation.find({ patient_id: req.user._id }).sort({ created_at: -1 });
        const mapped = consultations.map(c => c.toJSON());
        res.status(200).json(mapped);
    } catch (err) {
        next(err);
    }
};

// ─── Patient: Create Consultation (from AI scan) ──────────────────────────
const createConsultation = async (req, res, next) => {
    try {
        const { image, doctor_id, ai_result: aiResultText, ai_condition, ai_confidence, ai_result } = req.body;
        if (!image) return res.status(400).json({ success: false, error: 'Image data is required' });

        let imgUrl = image;
        if (imgUrl && imgUrl.startsWith('data:image')) {
            const uploadRes = await cloudinary.uploader.upload(imgUrl, { folder: 'dermascan-images' });
            imgUrl = uploadRes.secure_url;
        }

        const newConsultation = new Consultation({
            patient_id: req.user._id,
            doctor_id: doctor_id ? doctor_id : undefined,
            image_data: imgUrl,
            status: 'pending',
            diagnosis: aiResultText ? `AI Analysis: ${aiResultText}` : null,
            ai_condition: ai_condition || 'Unknown',
            ai_confidence: ai_confidence || 0,
            ai_result: ai_result || 'unknown',
        });
        await newConsultation.save();

        res.status(201).json({ success: true, message: 'Consultation request created', id: newConsultation._id.toString() });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// ─── Get Chat Messages for a Consultation ────────────────────────────────
const getConsultationMessages = async (req, res, next) => {
    try {
        const { id } = req.params;
        const messages = await Message.find({ consultationId: id }).sort({ createdAt: 1 });
        res.json({ success: true, data: messages });
    } catch (err) {
        next(err);
    }
};

// ─── Doctor: Get Stats ────────────────────────────────────────────────────
const getDoctorStats = async (req, res, next) => {
    try {
        const doctor = await Doctor.findOne({ user_id: req.user._id });
        if (!doctor) return res.status(403).json({ success: false, error: 'Not a registered doctor' });

        const query = {
            $or: [
                { doctor_id: doctor._id },
                { claimed_by: req.user._id },
            ]
        };

        const total = await Consultation.countDocuments(query);
        const pending = await Consultation.countDocuments({ ...query, status: { $in: ['pending', 'pending_appointment'] } });
        const completed = await Consultation.countDocuments({ ...query, status: 'completed' });
        const active = await Consultation.countDocuments({ ...query, status: 'active' });

        // Monthly breakdown (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthly = await Consultation.aggregate([
            { $match: { created_at: { $gte: sixMonthsAgo }, $or: [{ doctor_id: doctor._id }, { claimed_by: req.user._id }] } },
            { $group: {
                _id: { month: { $month: '$created_at' }, year: { $year: '$created_at' } },
                count: { $sum: 1 },
                benign: { $sum: { $cond: [{ $eq: ['$ai_result', 'benign'] }, 1, 0] } },
                malignant: { $sum: { $cond: [{ $eq: ['$ai_result', 'malignant'] }, 1, 0] } },
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({ success: true, data: { total, pending, completed, active, monthly } });
    } catch (err) {
        next(err);
    }
};

// ─── Patient: Get My Appointments ────────────────────────────────────────
const getMyAppointments = async (req, res, next) => {
    try {
        const appointments = await Consultation.find({
            patient_id: req.user._id,
            status: { $in: ['pending_appointment', 'active', 'completed', 'cancelled'] },
            appointment_date: { $exists: true }
        })
        .populate('doctor_id', 'specialization hospital_name')
        .sort({ appointment_date: -1 });

        const formatted = appointments.map(a => ({
            ...a.toJSON(),
            doctor_specialization: a.doctor_id?.specialization || 'Dermatologist',
            doctor_hospital: a.doctor_id?.hospital_name || 'Unknown Hospital'
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        next(err);
    }
};

// ─── Patient: Cancel Appointment ────────────────────────────────────────
const cancelAppointment = async (req, res, next) => {
    try {
        const appt = await Consultation.findOne({
            _id: req.params.id,
            patient_id: req.user._id
        });
        if (!appt) return res.status(404).json({ success: false, error: 'Appointment not found' });
        if (appt.appointment_date && new Date(appt.appointment_date) < new Date()) {
            return res.status(400).json({ success: false, error: 'Cannot cancel past appointments' });
        }
        await Consultation.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
        res.json({ success: true, message: 'Appointment cancelled successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    bookAppointment,
    getMyAppointments,
    cancelAppointment,
    getDoctorConsultations,
    claimConsultation,
    updateDoctorConsultation,
    getUserConsultations,
    createConsultation,
    getConsultationMessages,
    getDoctorStats,
};
