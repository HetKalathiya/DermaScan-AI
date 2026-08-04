const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Consultation = require('../models/Consultation');
const { validationResult } = require('express-validator');

exports.createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { doctorId, consultationId, rating, comment } = req.body;
  const patientId = req.user.id;

  try {
    const consultation = await Consultation.findById(consultationId);
    if (!consultation || consultation.status !== 'completed') {
      return res.status(400).json({ msg: 'Can only review completed consultations.' });
    }

    if (consultation.patient_id !== patientId) {
      return res.status(403).json({ msg: 'Unauthorized to review this consultation.' });
    }

    const existingReview = await Review.findOne({ consultation: consultationId });
    if (existingReview) {
      return res.status(400).json({ msg: 'Review already exists for this consultation.' });
    }

    const review = new Review({
      patient: patientId,
      doctor: doctorId,
      consultation: consultationId,
      rating,
      comment
    });

    await review.save();

    // Update Doctor stats
    const stats = await Review.aggregate([
      { $match: { doctor: doctorId } },
      {
        $group: {
          _id: '$doctor',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await Doctor.findByIdAndUpdate(doctorId, {
        avgRating: stats[0].avgRating.toFixed(1),
        totalReviews: stats[0].totalReviews
      });
    }

    res.status(201).json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getDoctorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ doctor: req.params.doctorId })
      .populate('patient', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
