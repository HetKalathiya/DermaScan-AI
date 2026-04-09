const Patient = require('../models/Patient');
const Scan = require('../models/Scan');

const getPatientHistory = async (req, res, next) => {
  try {
    const patient_id = req.params.id;
    const patient = await Patient.findById(patient_id).populate('user_id', 'name email');
    const scans = await Scan.find({ patient_id }).sort({ created_at: -1 });
    
    res.json({
      success: true,
      message: 'Patient history fetched',
      data: {
        patient,
        scans
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPatientHistory };
