const express = require('express');
const router = express.Router();
const {
    getDoctorSchedule,
    lockDoctorSlot,
    unlockDoctorSlot,
    bulkLockDoctorSlots
} = require('../controllers/doctorSchedule.controller');
const { protect, doctor } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(doctor);

router.get('/', getDoctorSchedule);
router.post('/lock', lockDoctorSlot);
router.post('/unlock', unlockDoctorSlot);
router.post('/bulk-lock', bulkLockDoctorSlots);

module.exports = router;
