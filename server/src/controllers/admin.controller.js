const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Scan = require('../models/Scan');
const Consultation = require('../models/Consultation');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');

// ─── HELPER ──────────────────────────────────────────────────────────────────
const paginate = (query) => {
  const page  = parseInt(query.page)  || 1;
  const limit = parseInt(query.limit) || 20;
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

const logActivity = async (type, message, actorId = null, actorName = 'System') => {
  try {
    await ActivityLog.create({ type, message, actor: actorId, actor_name: actorName });
  } catch (e) { /* non-blocking — log failure should not break main action */ }
};

// ─── SETUP (ONE-TIME) ────────────────────────────────────────────────────────

// POST /api/admin/setup  — disabled after first admin exists
exports.setupAdmin = async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Admin account already exists.' });
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const admin = await User.create({ name, email, password_hash, role: 'admin' });
    await logActivity('user', `Admin account created for ${name} (${email})`);
    res.json({ success: true, message: 'Admin account created. You can now log in.', admin: { name: admin.name, email: admin.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/setup/status  — check if admin exists (public)
exports.getSetupStatus = async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    res.json({ success: true, adminExists: !!existing });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── STATS ───────────────────────────────────────────────────────────────────

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalPatients, totalDoctors, pendingDoctors, totalScans, totalConsultations] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments(),
      Doctor.countDocuments({ verified: false }),   // FIX: was isApproved
      Scan.countDocuments(),
      Consultation.countDocuments(),
    ]);
    res.json({ success: true, data: { totalPatients, totalDoctors, pendingDoctors, totalScans, totalConsultations } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DOCTOR MANAGEMENT ───────────────────────────────────────────────────────

// GET /api/admin/doctors/pending
exports.getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ verified: false })   // FIX: was isApproved: false
      .populate('user_id', 'name email created_at isActive');
    res.json({ success: true, data: doctors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/doctors  — all doctors with pagination
exports.getAllDoctors = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.filter === 'approved') filter.verified = true;
    if (req.query.filter === 'pending')  filter.verified = false;

    const [doctors, total] = await Promise.all([
      Doctor.find(filter).populate('user_id', 'name email isActive created_at').skip(skip).limit(limit).sort({ _id: -1 }),
      Doctor.countDocuments(filter),
    ]);
    res.json({ success: true, data: doctors, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/admin/doctors/:id/approve
exports.approveDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, { verified: true }, { new: true }).populate('user_id', 'name email');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    await logActivity('doctor', `Doctor approved: ${doctor.user_id?.name || 'Unknown'} (${doctor.user_id?.email || ''})`, req.user._id, req.user.name);
    res.json({ success: true, message: 'Doctor approved successfully', doctor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/admin/doctors/:id/reject  — deletes doctor + user account
exports.rejectDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user_id', 'name email');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const doctorName  = doctor.user_id?.name  || 'Unknown';
    const doctorEmail = doctor.user_id?.email || '';
    const userId = doctor.user_id?._id || doctor.user_id;
    await Doctor.findByIdAndDelete(req.params.id);
    if (userId) await User.findByIdAndDelete(userId);
    await logActivity('doctor', `Doctor rejected & deleted: ${doctorName} (${doctorEmail})`, req.user._id, req.user.name);
    res.json({ success: true, message: 'Doctor rejected and account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

// GET /api/admin/users  — all users (patients) with search + pagination
exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = { role: 'patient' };
    if (req.query.filter === 'active')    filter.isActive = true;
    if (req.query.filter === 'suspended') filter.isActive = false;
    if (req.query.search) {
      filter.$or = [
        { name:  { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(filter).select('-password_hash').skip(skip).limit(limit).sort({ created_at: -1 }),
      User.countDocuments(filter),
    ]);
    // Attach scan count per user
    const userIds = users.map(u => u._id);
    const scanCounts = await Scan.aggregate([
      { $match: { patient_id: { $in: userIds } } },
      { $group: { _id: '$patient_id', count: { $sum: 1 } } },
    ]);
    const scanMap = Object.fromEntries(scanCounts.map(s => [s._id, s.count]));
    const data = users.map(u => ({ ...u.toObject(), scanCount: scanMap[u._id] || 0 }));
    res.json({ success: true, data, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password_hash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const scanCount = await Scan.countDocuments({ user_id: req.params.id });
    res.json({ success: true, data: { ...user.toObject(), scanCount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/admin/users/:id/suspend  — toggle isActive
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    const action = user.isActive ? 'Activated' : 'Suspended';
    await logActivity('user', `${action} user: ${user.name} (${user.email})`, req.user._id, req.user.name);
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'suspended'}`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/admin/users/:id  — permanent delete
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await logActivity('user', `Permanently deleted user: ${user.name} (${user.email})`, req.user._id, req.user.name);
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User permanently deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── SCAN / CONSULTATION MONITORING ─────────────────────────────────────────

// GET /api/admin/scans
exports.getAllScans = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [scans, total] = await Promise.all([
      Scan.find().skip(skip).limit(limit).sort({ created_at: -1 }),
      Scan.countDocuments(),
    ]);
    res.json({ success: true, data: scans, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/consultations
exports.getAllConsultations = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [consultations, total] = await Promise.all([
      Consultation.find().skip(skip).limit(limit).sort({ created_at: -1 }),
      Consultation.countDocuments(),
    ]);
    res.json({ success: true, data: consultations, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────

// GET /api/admin/activity-logs
exports.getActivityLogs = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.type && req.query.type !== 'all') filter.type = req.query.type;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('actor', 'name email role')   // NOW WORKS — actor field exists
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(filter),
    ]);
    res.json({ success: true, logs, page, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
