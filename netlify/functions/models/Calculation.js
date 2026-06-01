const mongoose = require('mongoose');

const calculationSchema = new mongoose.Schema({
    email: { type: String, required: true },
    principal: { type: Number, required: true },
    rate: { type: Number, required: true },
    years: { type: Number, required: true },
    simpleTotal: Number,
    compoundTotal: Number
}, { timestamps: true });

module.exports = mongoose.models.Calculation || mongoose.model('Calculation', calculationSchema);