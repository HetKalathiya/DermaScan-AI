const express = require('express');
const cors = require('cors');
const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());
app.use(cors());
app.use(apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/scans', require('./routes/scan.routes'));
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/patients', require('./routes/patient.routes'));

// Consultation & Appointment Routes
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/consultations', require('./routes/consultation.routes'));
app.use('/api/doctor/consultations', require('./routes/doctorConsultations.routes'));
app.use('/api/user/consultations', require('./routes/userConsultations.routes'));

// Health
app.get('/', (req, res) => res.json({ success: true, message: 'Server is running' }));

// Middleware
app.use(errorHandler);

module.exports = app;
