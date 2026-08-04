/**
 * purgeData.js
 * Clears all scan history, consultations, activity logs, and notifications
 * from the DermaScan AI database. Users and Doctors are preserved.
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/dermascan';

const run = async () => {
  console.log('\n🔧 DermaScan AI — Database Purge Tool');
  console.log('======================================');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected:', MONGO_URI);

    const db = mongoose.connection.db;

    // List all collections in the database
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);
    console.log(`\n📦 Collections found: ${names.join(', ') || 'none'}\n`);

    const targets = ['scans', 'consultations', 'activitylogs', 'notifications', 'messages', 'payments'];
    let totalDeleted = 0;

    for (const colName of targets) {
      if (names.includes(colName)) {
        const result = await db.collection(colName).deleteMany({});
        console.log(`🗑️  ${colName}: deleted ${result.deletedCount} documents`);
        totalDeleted += result.deletedCount;
      } else {
        console.log(`⏭️  ${colName}: collection not found, skipping`);
      }
    }

    console.log('\n======================================');
    console.log(`✅ Done. Total documents removed: ${totalDeleted}`);
    console.log('   Users and Doctors were NOT touched.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during purge:', error.message);
    process.exit(1);
  }
};

run();
