const express = require('express');
const router = express.Router();
const dbStore = require('../dbStore');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

// Mock Random Forest Prediction Logic
const predictRisk = (data) => {
    const { age, bodyTemperature, heartRate, spO2 } = data;
    
    // Simplistic mock thresholds
    if (spO2 < 90 || heartRate > 120 || bodyTemperature > 103) {
        return {
            riskLevel: 'Critical Risk',
            confidenceScore: 92.5,
            recommendedAction: 'Emergency Hospital'
        };
    } else if (spO2 < 95 || heartRate > 100 || bodyTemperature > 100 || age > 65) {
        return {
            riskLevel: 'Moderate Risk',
            confidenceScore: 85.0,
            recommendedAction: 'Visit PHC'
        };
    } else {
        return {
            riskLevel: 'Low Risk',
            confidenceScore: 95.5,
            recommendedAction: 'Home Care'
        };
    }
};

// @route   POST api/health/predict
// @desc    Submit health data, get prediction and save report
router.post('/predict', auth, async (req, res) => {
    try {
        const { age, bodyTemperature, heartRate, spO2, symptoms, durationOfSymptoms, bloodPressure, patientName } = req.body;

        const prediction = predictRisk({ age, bodyTemperature, heartRate, spO2 });

        const report = {
            _id: crypto.randomBytes(16).toString('hex'),
            id: crypto.randomBytes(16).toString('hex'),
            user: req.user.id,
            patientName: patientName || 'Self',
            age,
            bodyTemperature,
            heartRate,
            spO2,
            bloodPressure,
            symptoms,
            durationOfSymptoms,
            riskLevel: prediction.riskLevel,
            confidenceScore: prediction.confidenceScore,
            recommendedAction: prediction.recommendedAction,
            createdAt: new Date()
        };

        dbStore.reports.push(report);

        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/health/history
// @desc    Get user's health history
router.get('/history', auth, async (req, res) => {
    try {
        const reports = dbStore.reports.filter(r => r.user === req.user.id).sort((a,b) => b.createdAt - a.createdAt);
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
