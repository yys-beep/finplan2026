const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    email: { type: String, required: true }, // Links the goal to the specific user
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    saved: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.models.Goal || mongoose.model('Goal', goalSchema);