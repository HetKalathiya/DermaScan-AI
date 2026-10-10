const Scan = require('../models/Scan');
const ActivityLog = require('../models/ActivityLog');
const { getSocketIO } = require('../sockets');
const { cloudinary } = require('../config/cloudinary');
const AIService = require('../services/ai.service');

const analyzeScan = async (req, res, next) => {
  try {
    // req.validatedImage was guaranteed by imageValidator.middleware.js
    const validatedImage = req.validatedImage;
    if (!validatedImage) {
      return res.status(400).json({ success: false, error: 'Validated image data missing.' });
    }

    // Step 1: Run through AI Model microservice
    const aiResult = await AIService.predictSkinLesion(validatedImage);

    // Step 2: Upload image to Cloudinary if available
    let storedImageUrl = validatedImage.base64;
    try {
      if (cloudinary && cloudinary.uploader) {
        const uploadRes = await cloudinary.uploader.upload(validatedImage.base64, {
          folder: 'dermascan-images'
        });
        if (uploadRes && uploadRes.secure_url) {
          storedImageUrl = uploadRes.secure_url;
        }
      }
    } catch (uploadErr) {
      console.warn('Cloudinary upload fallback to base64:', uploadErr.message);
    }

    // Step 3: Determine patient ID (authenticated user or request body or fallback)
    let pid = (req.user && req.user._id) ? req.user._id.toString() : (req.body.userId || req.body.patient_id);

    let savedScan = null;
    if (pid) {
      const riskScore = aiResult.riskLevel === 'High' ? 88 : aiResult.riskLevel === 'Medium' ? 55 : 15;
      savedScan = await Scan.create({
        patient_id: pid,
        image_url: storedImageUrl,
        result: aiResult.result,
        condition: aiResult.condition,
        risk_level: riskScore,
        confidence: aiResult.confidence,
        recommendation: aiResult.recommendation,
        top_diagnosis: aiResult.top_diagnosis,
        probabilities: {
          tiers: aiResult.all_probabilities,
          fine_grained: aiResult.fine_grained_probabilities
        },
        consulted: false
      });

      const io = getSocketIO();
      if (io) {
        io.emit('new_scan', { scan: savedScan });
        if (aiResult.riskLevel === 'High' || aiResult.result === 'malignant') {
          io.emit('high_risk_alert', {
            scan: savedScan,
            message: `High risk detected for scan ${savedScan._id}: ${aiResult.condition}`
          });
          await ActivityLog.create({
            type: 'alert',
            message: `High risk detected for scan ${savedScan._id}: ${aiResult.condition} (${aiResult.confidence}%)`
          }).catch(() => {});
        }
      }

      await ActivityLog.create({
        type: 'scan',
        message: `New AI scan analyzed for patient ${pid}: ${aiResult.condition}`
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: 'Skin analysis completed successfully',
      data: {
        ai: {
          prediction: aiResult.prediction,
          condition: aiResult.condition,
          confidence: aiResult.confidence,
          confidenceFormatted: aiResult.confidenceFormatted,
          riskLevel: aiResult.riskLevel,
          result: aiResult.result,
          risk_color: aiResult.risk_color,
          recommendation: aiResult.recommendation,
          top_diagnosis: aiResult.top_diagnosis,
          all_probabilities: aiResult.all_probabilities,
          fine_grained_probabilities: aiResult.fine_grained_probabilities
        },
        scan: savedScan,
        image_url: storedImageUrl,
        image_meta: {
          width: validatedImage.width,
          height: validatedImage.height,
          mimeType: validatedImage.mimeType,
          sizeBytes: validatedImage.sizeBytes
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

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

module.exports = { analyzeScan, uploadScan, getUserScans, deleteScan };

