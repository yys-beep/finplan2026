const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    dob: String,
    income: String,
    employment: String,
    goal: String,
    risk: String,
    bio: String,
    profilePic: String,
    twoFactorEnabled: { type: Boolean, default: true }, // NEW: Tracks 2FA preference
    otp: String,          
    otpExpiry: Date       
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);