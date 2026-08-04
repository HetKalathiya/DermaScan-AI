const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/dermascan');
    const db = mongoose.connection.db;
    const items = await db.collection('consultations').find({}).toArray();
    console.log("Total Items:", items.length);
    items.forEach(item => {
        console.log("ID:", item._id, "Has Image_Data:", !!item.image_data, "Has Image:", !!item.image, "Has ImageUrl:", !!item.imageUrl, "Status:", item.status);
    });
    mongoose.connection.close();
}
test();
