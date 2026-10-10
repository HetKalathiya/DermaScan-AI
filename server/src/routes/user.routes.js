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

        let patient = null;
        let stats = {
            totalScans: 0,
            totalReports: 0,
            totalConsultations: 0,
            riskLevel: 'Low Risk / Normal'
        };

        if (user.role === 'patient') {
            const Patient = require('../models/Patient');
            patient = await Patient.findOne({ user_id: user._id });
            if (!patient) {
                patient = await Patient.create({
                    user_id: user._id,
                    skin_type: 'Type II - Fair',
                    primary_concern: ['Routine Monitoring'],
                    had_skin_cancer: false,
                    medical_history: [],
                    allergies: '',
                    skincare_notes: ''
                });
            }

            try {
                const Scan = require('../models/Scan');
                const Consultation = require('../models/Consultation');
                
                const scans = await Scan.find({ user_id: user._id }).sort({ created_at: -1 });
                stats.totalScans = scans.length;
                stats.totalReports = scans.filter(s => s.status === 'completed' || s.result).length;

                const highRisk = scans.some(s => 
                    (s.result && s.result.toLowerCase().includes('malignant')) || 
                    (s.condition && s.condition.toLowerCase().includes('melanoma'))
                );
                const moderateRisk = scans.some(s => 
                    (s.result && s.result.toLowerCase().includes('suspicious')) ||
                    (s.confidence && s.confidence > 0.8 && s.result && !s.result.toLowerCase().includes('benign'))
                );

                if (highRisk) {
                    stats.riskLevel = 'Action Required';
                } else if (moderateRisk) {
                    stats.riskLevel = 'Follow-up Advised';
                } else {
                    stats.riskLevel = 'Low Risk / Normal';
                }

                stats.totalConsultations = await Consultation.countDocuments({ patient_id: user._id });
            } catch (statsErr) {
                console.error('Error fetching patient stats:', statsErr);
            }
        }

        res.json({ 
            success: true, 
            data: {
                ...user.toObject(),
                two_factor_enabled: Boolean(user.two_factor_enabled),
                patient: patient ? patient.toObject() : null,
                stats
            }
        });
    } catch (err) {
        next(err);
    }
});

// PUT /api/user/toggle-2fa — toggle or set 2FA status
router.put('/toggle-2fa', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const nextVal = req.body.enabled !== undefined ? Boolean(req.body.enabled) : !user.two_factor_enabled;
        user.two_factor_enabled = nextVal;
        await user.save();

        res.json({
            success: true,
            two_factor_enabled: user.two_factor_enabled,
            message: `Two-Factor Authentication ${user.two_factor_enabled ? 'enabled' : 'disabled'} successfully.`
        });
    } catch (err) {
        next(err);
    }
});

// PUT /api/user/profile — update personal and clinical info
router.put('/profile', protect, async (req, res, next) => {
    try {
        const { 
            name, phone, age, dob, gender, bio, location, country, email, 
            blood_group, emergency_contact, avatar, two_factor_enabled,
            // Patient clinical fields
            skin_type, primary_concern, had_skin_cancer, allergies, skincare_notes, medical_history
        } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (phone !== undefined) updates.phone = phone;
        if (age !== undefined) {
            const parsedAge = parseInt(age, 10);
            updates.age = (!isNaN(parsedAge) && parsedAge > 0 && parsedAge < 150) ? parsedAge : null;
        }
        if (dob !== undefined) updates.dob = dob;
        if (gender !== undefined) updates.gender = gender;
        if (bio !== undefined) updates.bio = bio;
        if (location !== undefined) updates.location = location;
        if (country !== undefined) updates.country = country;
        if (email !== undefined) updates.email = email;
        if (blood_group !== undefined) updates.blood_group = blood_group;
        if (emergency_contact !== undefined) updates.emergency_contact = emergency_contact;
        if (avatar !== undefined) updates.avatar = avatar;
        if (two_factor_enabled !== undefined) updates.two_factor_enabled = Boolean(two_factor_enabled);

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password_hash');

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        let patient = null;
        if (user.role === 'patient') {
            const Patient = require('../models/Patient');
            const patientUpdates = {};
            if (skin_type !== undefined) patientUpdates.skin_type = skin_type;
            if (primary_concern !== undefined) patientUpdates.primary_concern = primary_concern;
            if (had_skin_cancer !== undefined) patientUpdates.had_skin_cancer = Boolean(had_skin_cancer);
            if (allergies !== undefined) patientUpdates.allergies = allergies;
            if (skincare_notes !== undefined) patientUpdates.skincare_notes = skincare_notes;
            if (medical_history !== undefined) patientUpdates.medical_history = medical_history;

            patient = await Patient.findOneAndUpdate(
                { user_id: req.user._id },
                { $set: patientUpdates },
                { new: true, upsert: true }
            );
        }

        res.json({ 
            success: true, 
            message: 'Profile updated successfully', 
            data: {
                ...user.toObject(),
                patient: patient ? patient.toObject() : null
            } 
        });
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

// DELETE /api/user/account — delete user and associated records
router.delete('/account', protect, async (req, res, next) => {
    try {
        const userId = req.user._id;
        const Doctor = require('../models/Doctor');
        
        await Doctor.findOneAndDelete({ user_id: userId });
        await User.findByIdAndDelete(userId);
        
        res.json({ success: true, message: 'Account permanently deleted' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
