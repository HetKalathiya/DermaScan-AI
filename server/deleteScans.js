const mongoose = require('mongoose');
const Scan = require('./src/models/Scan');

const clearScans = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dermascan');
    console.log('MongoDB Connected');
    
    const result = await Scan.deleteMany({});
    console.log(`Deleted ${result.deletedCount} scans from the database`);
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing scans:', error);
    process.exit(1);
  }
};

clearScans();
