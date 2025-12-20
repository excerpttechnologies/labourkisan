const mongoose = require('mongoose');

const connectDB = async () => {
  try {
  
    const conn = await mongoose.connect(`mongodb+srv://root:1234@cluster0.ofeco44.mongodb.net/KissanPartner`);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;