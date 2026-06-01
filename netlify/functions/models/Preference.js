const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true // One preference profile per user
    },
    newsCategory: { 
        type: String, 
        default: 'finance' 
    }
}, { timestamps: true });

// Prevent Mongoose from compiling the model multiple times in serverless
module.exports = mongoose.models.Preference || mongoose.model('Preference', preferenceSchema);