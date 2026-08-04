const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/user/profile — returns logged-in user's full profile
router.get('/profile', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password_hash');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
});

// PUT /api/user/profile — update name, phone, age, gender, bio, location
router.put('/profile', protect, async (req, res, next) => {
    try {
        const { name, phone, age, gender, bio, location, email } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (phone !== undefined) updates.phone = phone;
        if (age !== undefined) updates.age = parseInt(age);
        if (gender !== undefined) updates.gender = gender;
        if (bio !== undefined) updates.bio = bio;
        if (location !== undefined) updates.location = location;
        if (email !== undefined) updates.email = email;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password_hash');

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Sync updated name into any future tokens (no need to re-login)
        res.json({ success: true, message: 'Profile updated successfully', data: user });
    } catch (err) {
        next(err);
    }
});

// PUT /api/user/update-doctor — update doctor-specific fields
router.put('/update-doctor', protect, async (req, res, next) => {
    try {
        const Doctor = require('../models/Doctor');
        const { specialization, hospital_name, license_number, experience_years } = req.body;
        const updates = {};
        if (specialization !== undefined) updates.specialization = specialization;
        if (hospital_name !== undefined) updates.hospital_name = hospital_name;
        if (license_number !== undefined) updates.license_number = license_number;
        if (experience_years !== undefined) updates.experience_years = parseInt(experience_years) || 0;

        const doctor = await Doctor.findOneAndUpdate(
            { user_id: req.user._id },
            { $set: updates },
            { new: true }
        );
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor record not found' });
        res.json({ success: true, message: 'Doctor profile updated', data: doctor });
    } catch (err) {
        next(err);
    }
});

// PUT /api/user/change-password
router.put('/change-password', protect, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Both current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
        }
        const user = await User.findById(req.user._id);
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Current password is incorrect' });
        }
        const hash = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(req.user._id, { password_hash: hash });
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
