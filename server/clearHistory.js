const mongoose = require('mongoose');
const Scan = require('./src/models/Scan');
const Consultation = require('./src/models/Consultation');

const clearHistory = async () => {
  try {
    // Connect to the local dermascan database
    await mongoose.connect('mongodb://localhost:27017/dermascan');
    console.log('MongoDB Connected');
    
    const scanResult = await Scan.deleteMany({});
    console.log(`Deleted ${scanResult.deletedCount} scans from the database`);
    
    const consultationResult = await Consultation.deleteMany({});
    console.log(`Deleted ${consultationResult.deletedCount} consultations from the database`);
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing history:', error);
    process.exit(1);
  }
};

clearHistory();
