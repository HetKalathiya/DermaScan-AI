const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth.middleware');
const { check } = require('express-validator');

router.post(
  '/',
  [
    protect,
    [
      check('doctorId', 'Doctor ID is required').not().isEmpty(),
      check('consultationId', 'Consultation ID is required').not().isEmpty(),
      check('rating', 'Rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 })
    ]
  ],
  reviewController.createReview
);

router.get('/doctor/:doctorId', protect, reviewController.getDoctorReviews);

module.exports = router;
