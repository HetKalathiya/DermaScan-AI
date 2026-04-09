const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, Doctor, Consultation, ScanModel } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key_change_this';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate token' });
        req.userId = decoded.id;
        next();
    });
};

// Register Doctor Endpoint
app.post('/api/auth/register-doctor', async (req, res) => {
    try {
        const { name, email, password, specialization, license_number, hospital_name } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        const newUser = new User({ name, email, password_hash: hashedPassword });
        await newUser.save();

        const newDoctor = new Doctor({
            user_id: newUser._id,
            specialization,
            license_number,
            hospital_name
        });
        await newDoctor.save();

        const token = jwt.sign({ id: newUser._id, role: 'doctor' }, SECRET_KEY, { expiresIn: 86400 });
        res.status(201).json({ auth: true, token, user: { id: newUser._id.toString(), name, email, role: 'doctor' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        const newUser = new User({ name, email, password_hash: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, SECRET_KEY, { expiresIn: 86400 });
        res.status(201).json({ auth: true, token, user: { id: newUser._id.toString(), name, email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
        if (!passwordIsValid) return res.status(401).json({ auth: false, token: null });

        const doctor = await Doctor.findOne({ user_id: user._id });

        if (role === 'doctor') {
            if (!doctor) {
                return res.status(403).json({ error: 'Access denied. Not a doctor account.' });
            }
            const token = jwt.sign({ id: user._id, role: 'doctor' }, SECRET_KEY, { expiresIn: 86400 });
            res.status(200).json({ auth: true, token, user: { id: user._id.toString(), name: user.name, email: user.email, role: 'doctor' } });
        } else {
            if (doctor) {
                return res.status(403).json({ error: 'Access denied. Please login through the Doctor Portal.' });
            }
            const token = jwt.sign({ id: user._id, role: 'patient' }, SECRET_KEY, { expiresIn: 86400 });
            res.status(200).json({ auth: true, token, user: { id: user._id.toString(), name: user.name, email: user.email, role: 'patient' } });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Profile Endpoint
app.get('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ id: user._id.toString(), name: user.name, email: user.email });
    } catch (err) {
        res.status(500).json({ error: 'Problem finding user' });
    }
});

// Update Profile Endpoint
app.put('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const { name, email } = req.body;
        await User.findByIdAndUpdate(req.userId, { name, email });
        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error updating user' });
    }
});

// Get List of Doctors
app.get('/api/doctors', verifyToken, async (req, res) => {
    try {
        const doctors = await Doctor.find().populate('user_id', 'name');
        const formattedDoctors = doctors.map(d => ({
            id: d._id.toString(),
            name: d.user_id ? d.user_id.name : 'Unknown',
            specialization: d.specialization,
            hospital_name: d.hospital_name
        }));
        res.status(200).json(formattedDoctors);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching doctors' });
    }
});

// Create Consultation Request
app.post('/api/consultations', verifyToken, async (req, res) => {
    try {
        const { image, doctor_id, ai_result } = req.body;
        if (!image) return res.status(400).json({ error: 'Image data is required' });

        const newConsultation = new Consultation({
            patient_id: req.userId,
            doctor_id: doctor_id ? doctor_id : undefined,
            image_data: image,
            status: 'pending',
            diagnosis: ai_result ? `AI Analysis: ${ai_result}` : null
        });
        await newConsultation.save();

        res.status(201).json({ message: 'Consultation request created', id: newConsultation._id.toString() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating consultation request' });
    }
});

// Book Appointment
app.post('/api/appointments', verifyToken, async (req, res) => {
    try {
        const { doctor_id, appointment_date, appointment_time, message } = req.body;
        
        const newAppointment = new Consultation({
            patient_id: req.userId,
            doctor_id: doctor_id,
            status: 'pending_appointment',
            appointment_date,
            appointment_time,
            message
        });
        await newAppointment.save();
        
        res.status(201).json({ message: 'Appointment booked successfully', id: newAppointment._id.toString() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error booking appointment' });
    }
});

// Get consultations for doctor
app.get('/api/doctor/consultations', verifyToken, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ user_id: req.userId });
        if (!doctor) return res.status(403).json({ error: 'Not a registered doctor' });

        const consultations = await Consultation.find({ 
            $or: [
                { doctor_id: doctor._id },
                { doctor_id: { $exists: false } },
                { doctor_id: null }
            ]
        })
            .populate('patient_id', 'name email')
            .sort({ created_at: -1 });

        const formattedConsultations = consultations.map(c => {
            const doc = c.toJSON();
            if (c.patient_id) {
                doc.patient_name = c.patient_id.name;
                doc.patient_email = c.patient_id.email;
            }
            return doc;
        });

        res.status(200).json(formattedConsultations);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching consultations' });
    }
});

// Get consultations for patient (history)
app.get('/api/user/consultations', verifyToken, async (req, res) => {
    try {
        const consultations = await Consultation.find({ patient_id: req.userId }).sort({ created_at: -1 });
        const mapped = consultations.map(c => c.toJSON());
        res.status(200).json(mapped);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching history' });
    }
});

// Save Scan Immediatly after AI Analysis
app.post('/api/save-scan', verifyToken, async (req, res) => {
    try {
        const { userId, image, result, condition, confidence, date, consulted } = req.body;
        
        // ensure valid inputs exist
        if (!userId || !image || !result) {
            return res.status(400).json({ error: 'Missing required scan data' });
        }

        const newScan = new ScanModel({
            userId,
            image,
            result,
            condition,
            confidence,
            date: date || new Date(),
            consulted: consulted || false
        });

        await newScan.save();
        res.status(201).json({ message: 'Scan saved successfully', scanId: newScan._id });
    } catch (err) {
        console.error("Error saving scan:", err);
        res.status(500).json({ error: 'Failed to save scan' });
    }
});

// Added as requested: DELETE /api/scan/:scanId
app.delete('/api/scan/:scanId', verifyToken, async (req, res) => {
    try {
        const { scanId } = req.params;
        const userId = req.userId; // Provided by verifyToken
        
        const scan = await ScanModel.findOneAndDelete({ _id: scanId, userId: userId });
        
        if (!scan) {
            return res.status(404).json({ error: 'Scan not found or not authorized to delete.' });
        }
        res.status(200).json({ message: 'Scan deleted successfully' });
    } catch (err) {
        console.error("Error deleting scan:", err);
        res.status(500).json({ error: 'Error deleting scan' });
    }
});

// Added as requested: GET /api/scan-history/{userId}
app.get('/api/scan-history/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(200).json([]);
        }

        let scans = await ScanModel.find({ userId: userId }).sort({ date: -1 });

        // If scanning didn't bring up enough recent standalone records, fallback gracefully if required
        // But per constraints, use ONLY real-time records from ScanModel.
        
        const mapped = scans.map(c => {
            const scanDate = c.date ? new Date(c.date) : new Date();
            const isValidDate = !isNaN(scanDate.getTime());
            const finalDate = isValidDate ? scanDate : new Date();
            return {
                id: "SCAN" + c._id.toString().substring(0, 6).toUpperCase(),
                _id: c._id.toString(),
                image: c.image || "",
                result: c.result || "Unknown",
                condition: c.condition || "AI Analysis",
                confidence: c.confidence || 0,
                date: finalDate.toISOString().split('T')[0],
                time: finalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                consulted: c.consulted || false
            };
        });
        
        res.status(200).json(mapped);
    } catch (err) {
        console.error("Error in /api/scan-history/:userId:", err);
        res.status(500).json({ error: 'Error fetching scan history' });
    }
});

// Update Consultation (Doctor diagnosis)
app.put('/api/doctor/consultations/:id', verifyToken, async (req, res) => {
    try {
        const { diagnosis, status } = req.body;
        const { id } = req.params;

        await Consultation.findByIdAndUpdate(id, {
            diagnosis,
            status: status || 'completed'
        });

        res.status(200).json({ message: 'Consultation updated' });
    } catch (err) {
        res.status(500).json({ error: 'Error updating consultation' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
