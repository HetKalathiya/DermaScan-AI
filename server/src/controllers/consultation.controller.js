const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');

const bookAppointment = async (req, res, next) => {
    try {
        const { doctor_id, appointment_date, appointment_time, message } = req.body;

        const newAppointment = new Consultation({
            patient_id: req.user._id,
            doctor_id: doctor_id,
            status: 'pending_appointment',
            appointment_date,
            appointment_time,
            message
        });
        await newAppointment.save();

        res.status(201).json({ success: true, message: 'Appointment booked successfully', id: newAppointment._id.toString() });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

const getDoctorConsultations = async (req, res, next) => {
    try {
        const doctor = await Doctor.findOne({ user_id: req.user._id });
        if (!doctor) return res.status(403).json({ success: false, error: 'Not a registered doctor' });

        const consultations = await Consultation.find({ 
            $or: [
                { doctor_id: doctor._id },
                { doctor_id: { $exists: false } },
                { doctor_id: null }
            ]
        })
            .populate('patient_id', 'name email')
            .sort({ created_at: -1 });

        const formattedConsultations = consultations.map(c => {
            const doc = c.toJSON();
            if (c.patient_id) {
                doc.patient_name = c.patient_id.name;
                doc.patient_email = c.patient_id.email;
            }
            return doc;
        });

        res.status(200).json(formattedConsultations);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

const updateDoctorConsultation = async (req, res, next) => {
    try {
        const { diagnosis, status } = req.body;
        const { id } = req.params;

        await Consultation.findByIdAndUpdate(id, {
            diagnosis,
            status: status || 'completed'
        });

        res.status(200).json({ success: true, message: 'Consultation updated' });
    } catch (err) {
        next(err);
    }
};

const getUserConsultations = async (req, res, next) => {
    try {
        const consultations = await Consultation.find({ patient_id: req.user._id }).sort({ created_at: -1 });
        const mapped = consultations.map(c => c.toJSON());
        res.status(200).json(mapped);
    } catch (err) {
        next(err);
    }
};

const createConsultation = async (req, res, next) => {
    try {
        const { image, doctor_id, ai_result } = req.body;
        if (!image) return res.status(400).json({ success: false, error: 'Image data is required' });

        const newConsultation = new Consultation({
            patient_id: req.user._id,
            doctor_id: doctor_id ? doctor_id : undefined,
            image_data: image,
            status: 'pending',
            diagnosis: ai_result ? `AI Analysis: ${ai_result}` : null
        });
        await newConsultation.save();

        res.status(201).json({ success: true, message: 'Consultation request created', id: newConsultation._id.toString() });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

module.exports = {
    bookAppointment,
    getDoctorConsultations,
    updateDoctorConsultation,
    getUserConsultations,
    createConsultation
};
