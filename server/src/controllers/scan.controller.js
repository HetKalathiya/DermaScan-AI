const Scan = require('../models/Scan');
const ActivityLog = require('../models/ActivityLog');
const { getSocketIO } = require('../sockets');
const { cloudinary } = require('../config/cloudinary');

const uploadScan = async (req, res, next) => {
  try {
    const { patient_id, userId, image_url, image, result, risk_level, confidence, condition, consulted } = req.body;
    
    let pid = patient_id || userId;
    if (!pid && req.user) pid = req.user._id;

    let img = image_url || image;
    if (img && img.startsWith('data:image')) {
      const uploadRes = await cloudinary.uploader.upload(img, { folder: 'dermascan-images' });
      img = uploadRes.secure_url;
    }

    // Bug #1 Fix: Normalize result to lowercase before saving so it always matches the enum
    const normalizedResult = result ? result.toLowerCase() : 'pending';

    // Bug #2 Fix: Explicitly store confidence field and map it to risk_level as well
    const confidenceValue = typeof confidence === 'number' ? confidence : (parseInt(confidence) || 0);
    const riskLevelValue = risk_level !== undefined ? risk_level : confidenceValue;

    const scan = await Scan.create({
      patient_id: pid,
      image_url: img,
      result: normalizedResult,
      risk_level: riskLevelValue,
      confidence: confidenceValue,       // Bug #2 Fix: now explicitly saved
      condition: condition || 'Unknown',
      consulted: consulted || false,     // Bug #6 Fix: now explicitly saved
    });

    const io = getSocketIO();
    if (io) {
      io.emit('new_scan', { scan });
      
      if (riskLevelValue > 80 || normalizedResult === 'malignant') {
        io.emit('high_risk_alert', { scan, message: 'High risk condition detected!' });
        await ActivityLog.create({ type: 'alert', message: `High risk detected for scan ${scan._id}` });
      }
    }
    
    await ActivityLog.create({ type: 'scan', message: `New scan uploaded via patient ${pid}` });

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
