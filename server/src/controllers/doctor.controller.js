const Doctor = require('../models/Doctor');
const ActivityLog = require('../models/ActivityLog');
const { getSocketIO } = require('../sockets');

const getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().populate('user_id', 'name email role');
    res.json({ success: true, message: 'Doctors fetched successfully', data: doctors });
  } catch (error) {
    next(error);
  }
};

const verifyDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.body.doctorId || req.params.id, 
      { verified: true }, 
      { new: true }
    );
    
    if (doctor) {
      const io = getSocketIO();
      if (io) {
        io.emit('doctor_verified', { doctor });
      }
      await ActivityLog.create({ type: 'doctor', message: `Doctor ${doctor._id} verified` });
    }

    res.json({ success: true, message: 'Doctor verified', data: doctor });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDoctors, verifyDoctor };
