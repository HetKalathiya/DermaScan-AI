const mongoose = require('mongoose');
const Consultation = require('./src/models/Consultation');

const checkConsultations = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/dermascan');
    console.log('MongoDB Connected');
    
    const count = await Consultation.countDocuments();
    console.log(`There are ${count} consultations in the database`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkConsultations();
