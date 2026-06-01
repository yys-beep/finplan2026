const mongoose = require('mongoose');

// Cache the database connection
let conn = null;

exports.connectDB = async function() {
    if (conn == null) {
        console.log("Creating new MongoDB connection...");
        // Connect using the URI from your .env file
        conn = mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        }).then(() => mongoose);
        
        await conn;
    } else {
        console.log("Using existing MongoDB connection...");
    }
    return conn;
};