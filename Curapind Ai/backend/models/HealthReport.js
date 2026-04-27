const mongoose = require('mongoose');

const HealthReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    bodyTemperature: {
        type: Number,
        required: true
    },
    heartRate: {
        type: Number,
        required: true
    },
    spO2: {
        type: Number,
        required: true
    },
    bloodPressure: {
        type: String, // E.g. "120/80"
        required: false // Optional, populated via PPG scan
    },
    symptoms: [{
        type: String
    }],
    durationOfSymptoms: {
        type: String,
        required: true
    },
    riskLevel: {
        type: String, // Low Risk, Moderate Risk, Critical Risk
        required: true
    },
    confidenceScore: {
        type: Number,
        required: true
    },
    recommendedAction: {
        type: String, // Home Care, Visit PHC, Emergency Hospital
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HealthReport', HealthReportSchema);
