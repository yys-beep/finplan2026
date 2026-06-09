const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Or 'bcrypt' depending on what you installed

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
    twoFactorEnabled: { type: Boolean, default: true },
    otp: String,          
    otpExpiry: Date       
}, { timestamps: true });

// --- THE FIX: Hash password before saving ---
userSchema.pre('save', async function() {
    // Only run this if the user is changing/creating their password
    if (!this.isModified('password')) return;

    // Generate a secure salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);