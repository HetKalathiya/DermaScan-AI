const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

const register = async (req, res, next) => {
  try {
    const { email, password, role, name } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({ email, password_hash, role: role || 'patient', name });

    res.status(201).json({
      success: true,
      auth: true,
      message: 'User registered successfully',
      token: generateToken(user._id),
      user: { id: user._id, email: user.email, role: user.role, name: user.name },
      data: {
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      }
    });
  } catch (error) {
    next(error);
  }
};

const registerDoctor = async (req, res, next) => {
  try {
    const { name, email, password, specialization, license_number, hospital_name } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({ email, password_hash, role: 'doctor', name });
    
    await Doctor.create({ 
      user_id: user._id,
      specialization,
      license_number,
      hospital_name
    });

    res.status(201).json({
      success: true,
      auth: true,
      message: 'Doctor registered successfully',
      token: generateToken(user._id),
      user: { id: user._id, email: user.email, role: user.role, name: user.name }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      
      // Role validation for frontend matching
      if (role && user.role !== role) {
          return res.status(403).json({ error: `Access denied. Not a ${role} account.` });
      }
      
      res.json({
        success: true,
        auth: true,
        message: 'Login successful',
        token: generateToken(user._id),
        user: { id: user._id, email: user.email, role: user.role, name: user.name },
        data: {
          _id: user._id,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        }
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    next(error);
  }
};

// Dedicated patient login — always enforces role === 'patient'
const loginPatient = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        error: `This email is registered as a ${user.role} account. Please use the correct login page.`
      });
    }

    res.json({
      success: true,
      auth: true,
      message: 'Patient login successful',
      token: generateToken(user._id),
      user: { id: user._id, email: user.email, role: user.role, name: user.name },
      data: { _id: user._id, email: user.email, role: user.role, token: generateToken(user._id) }
    });
  } catch (error) {
    next(error);
  }
};

// Dedicated doctor login — always enforces role === 'doctor'
const loginDoctor = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: `This email is registered as a ${user.role} account. Please use the correct login page.`
      });
    }

    res.json({
      success: true,
      auth: true,
      message: 'Doctor login successful',
      token: generateToken(user._id),
      user: { id: user._id, email: user.email, role: user.role, name: user.name },
      data: { _id: user._id, email: user.email, role: user.role, token: generateToken(user._id) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, registerDoctor, login, loginPatient, loginDoctor };
