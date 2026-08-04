const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, admin } = require('../middlewares/auth.middleware');

// ─── PUBLIC (no auth required) ───────────────────────────────────────────────
// One-time setup — check if admin exists
router.get('/setup/status', adminController.getSetupStatus);
// One-time setup — create first admin account
router.post('/setup', adminController.setupAdmin);

// ─── ALL ROUTES BELOW ARE PROTECTED ─────────────────────────────────────────
router.use(protect);
router.use(admin);

// Stats
router.get('/stats', adminController.getStats);

// Doctor management
router.get('/doctors/pending',         adminController.getPendingDoctors);
router.get('/doctors',                 adminController.getAllDoctors);
router.patch('/doctors/:id/approve',   adminController.approveDoctor);
router.patch('/doctors/:id/reject',    adminController.rejectDoctor);

// User management
router.get('/users',                   adminController.getAllUsers);
router.get('/users/:id',               adminController.getUserById);
router.patch('/users/:id/suspend',     adminController.suspendUser);
router.delete('/users/:id',            adminController.deleteUser);

// Monitoring
router.get('/scans',                   adminController.getAllScans);
router.get('/consultations',           adminController.getAllConsultations);

// Activity logs
router.get('/activity-logs',           adminController.getActivityLogs);

module.exports = router;
