const mongoose = require('mongoose');

const HealthReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientName: {
        type: String,
        default: 'Self'
    },
    villageName: {
        type: String,
        default: 'Unknown'
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
        required: false
    },
    diarrhoea: {
        type: String,
        default: 'None'
    },
    respiratoryRate: {
        type: Number,
        default: 0
    },
    acousticScore: {
        type: Number,
        default: 0
    },
    acousticLabel: {
        type: String,
        default: ''
    },
    symptomProgression: {
        type: String,
        default: 'None'
    },
    whoDangerSigns: [{
        type: String
    }],
    symptoms: [{
        type: String
    }],
    durationOfSymptoms: {
        type: String,
        required: false
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
    riskDrivers: [{
        label: String,
        weight: Number
    }],
    computedFeatures: {
        type: Object,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HealthReport', HealthReportSchema);
