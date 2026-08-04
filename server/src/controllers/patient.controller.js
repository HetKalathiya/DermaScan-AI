const Patient = require('../models/Patient');
const Scan = require('../models/Scan');
const Consultation = require('../models/Consultation');
const User = require('../models/User');

// GET /api/patients/:id/history — full medical history for a patient (by patient record ID or user ID)
const getPatientHistory = async (req, res, next) => {
  try {
    const patient_id = req.params.id;

    // Try to find patient record; fall back gracefully if not found
    let patient = null;
    let userId = patient_id;
    try {
      patient = await Patient.findById(patient_id).populate('user_id', 'name email phone age gender');
      if (patient && patient.user_id) userId = patient.user_id._id || patient.user_id;
    } catch (_) { /* not a Patient record ID — might be user ID directly */ }

    // Fetch user info directly as fallback
    let userRecord = null;
    try {
      userRecord = await User.findById(userId).select('-password');
    } catch (_) { /* ignore */ }

    const scans = await Scan.find({ patient_id }).sort({ created_at: -1 }).catch(() => []);
    const consultations = await Consultation.find({ patient_id: userId }).sort({ created_at: -1 }).catch(() => []);

    res.json({
      success: true,
      message: 'Patient history fetched',
      data: {
        patient,
        user: userRecord,
        scans,
        consultations,
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/patients/:id — fetch patient profile by user ID (doctor view)
const getPatientDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    const scans = await Scan.find({ patient_id: req.params.id }).sort({ created_at: -1 }).catch(() => []);
    const consultations = await Consultation.find({ patient_id: req.params.id }).sort({ created_at: -1 }).catch(() => []);
    res.json({ success: true, data: { user, scans, consultations } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPatientHistory, getPatientDetail };
