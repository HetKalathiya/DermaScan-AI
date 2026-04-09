const Scan = require('../models/Scan');
const ActivityLog = require('../models/ActivityLog');
const { getSocketIO } = require('../sockets');

const uploadScan = async (req, res, next) => {
  try {
    const { patient_id, image_url, result, risk_level, condition } = req.body;
    
    const scan = await Scan.create({
      patient_id,
      image_url,
      result: result || 'pending',
      risk_level: risk_level || 0,
      condition: condition || 'Unknown'
    });

    const io = getSocketIO();
    if (io) {
      io.emit('new_scan', { scan });
      
      if (risk_level > 80 || result === 'malignant') {
        io.emit('high_risk_alert', { scan, message: 'High risk condition detected!' });
        await ActivityLog.create({ type: 'alert', message: `High risk detected for scan ${scan._id}` });
      }
    }
    
    await ActivityLog.create({ type: 'scan', message: `New scan uploaded via patient ${patient_id}` });

    res.status(201).json({
      success: true,
      message: 'Scan uploaded successfully',
      data: scan
    });
  } catch (error) {
    next(error);
  }
};

const getUserScans = async (req, res, next) => {
  try {
    const scans = await Scan.find({ patient_id: req.params.userId }).sort({ created_at: -1 });
    res.json({ success: true, message: 'Scans retrieved', data: scans });
  } catch (error) {
    next(error);
  }
};

const deleteScan = async (req, res, next) => {
  try {
    await Scan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Scan deleted', data: null });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadScan, getUserScans, deleteScan };
