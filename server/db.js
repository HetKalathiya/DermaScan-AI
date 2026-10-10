const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/google-antigravity';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to the MongoDB database.'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

const schemaOptions = {
    toJSON: {
        transform: (document, returnedObject) => {
            returnedObject.id = returnedObject._id.toString();
            delete returnedObject._id;
            delete returnedObject.__v;
        }
    }
};

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password_hash: { type: String, required: true },
    is_verified: { type: Boolean, default: false }
}, schemaOptions);

const doctorSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    specialization: String,
    license_number: String,
    hospital_name: String
}, schemaOptions);

const consultationSchema = new mongoose.Schema({
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    image_data: String,
    status: { type: String, default: 'pending' },
    diagnosis: String,
    appointment_date: String,
    appointment_time: String,
    message: String,
    created_at: { type: Date, default: Date.now }
}, schemaOptions);

const scanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    image: String,
    result: String,
    condition: String,
    confidence: Number,
    date: { type: Date, default: Date.now },
    consulted: { type: Boolean, default: false }
}, schemaOptions);

const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Consultation = mongoose.model('Consultation', consultationSchema);
const ScanModel = mongoose.model('Scan', scanSchema);

module.exports = { mongoose, User, Doctor, Consultation, ScanModel };
