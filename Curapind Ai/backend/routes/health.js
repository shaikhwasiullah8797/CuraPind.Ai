const express = require('express');
const router = express.Router();
const dbStore = require('../dbStore');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

// --- Feature Engineering Helpers (Mirroring client-side) ---
const parseBP = (bpString) => {
    if (!bpString || typeof bpString !== 'string') return null;
    const parts = bpString.replace(/\s/g, '').split('/');
    if (parts.length !== 2) return null;
    const sys = parseFloat(parts[0]);
    const dia = parseFloat(parts[1]);
    if (isNaN(sys) || isNaN(dia) || sys < 50 || sys > 300 || dia < 20 || dia > 200) return null;
    return { systolic: sys, diastolic: dia };
};

const imputeBP = (age) => {
    const safeAge = Number(age) || 30;
    if (safeAge < 18) return { systolic: 110, diastolic: 70 };
    if (safeAge <= 60) return { systolic: 120, diastolic: 80 };
    return { systolic: 130, diastolic: 80 };
};

const computeShockIndex = (hr, systolic) => {
    if (!systolic || systolic <= 0) return 0;
    return Math.round((hr / systolic) * 100) / 100;
};

const computeMAP = (systolic, diastolic) => {
    if (!systolic || !diastolic) return 0;
    return Math.round((diastolic + (systolic - diastolic) / 3) * 10) / 10;
};

const computeTachypneaHypoxiaIndex = (rr, spO2, acousticScore = 0) => {
    const safeRR = Number(rr) || 0;
    const safeSpO2 = Number(spO2) || 98;
    const acoustic = Number(acousticScore) || 0;

    const rrComponent = Math.min(1.0, Math.max(0, (safeRR - 16) / 24));
    const spo2Component = Math.min(1.0, Math.max(0, (98 - safeSpO2) / 12));
    const index = (rrComponent * 0.4) + (spo2Component * 0.35) + (acoustic * 0.25);
    return Math.round(Math.min(1.0, Math.max(0, index)) * 100) / 100;
};

const computeDehydrationScore = (diarrhoea, progression, unableToDrink = false) => {
    const diarrhoeaMap = { 'None': 0, 'Mild': 1, 'Moderate': 2, 'Severe': 3 };
    const dNum = diarrhoeaMap[diarrhoea] !== undefined ? diarrhoeaMap[diarrhoea] : 0;
    const durationMap = {
        '< 24 Hours': 0, '1-3 days': 0.5, '1 - 3 Days': 0.5,
        '> 3 Days': 1.5, '4-7 days': 1.5, 'More than a week': 2.0,
        'Rapidly Worsening': 2.0, 'None': 0
    };
    const durScore = durationMap[progression] !== undefined ? durationMap[progression] : 0;
    let score = dNum + durScore;
    if (unableToDrink) score += 1.5;
    return Math.min(5, Math.round(score * 10) / 10);
};

const computeElderlyHypoxiaRisk = (age, spO2, shockIndex) => {
    const safeAge = Number(age) || 30;
    if (safeAge < 50) return 0;
    const ageFactor = Math.min(1.0, (safeAge - 50) / 30);
    const hypoxiaComponent = Math.max(0, (100 - (Number(spO2) || 98))) / 10;
    const shockComponent = Math.max(0, (Number(shockIndex) || 0.6) - 0.6) / 0.8;
    const risk = ageFactor * (hypoxiaComponent * 0.7 + shockComponent * 0.3);
    return Math.round(Math.min(1.0, Math.max(0, risk)) * 100) / 100;
};

const getTachypneaThreshold = (age) => {
    const safeAge = Number(age) || 30;
    if (safeAge < 1) return 50;
    if (safeAge < 5) return 40;
    if (safeAge < 12) return 30;
    return 22;
};

// --- Clinical Multi-Modal Triage Inference Engine ---
const predictRisk = (data) => {
    const { 
        age = 30, 
        bodyTemperature = 98.6, 
        heartRate = 75, 
        spO2 = 98, 
        diarrhoea = 'None',
        bloodPressure = '',
        respiratoryRate = 0,
        acousticScore = 0,
        acousticLabel = '',
        symptomProgression = 'None',
        whoDangerSigns = []
    } = data;

    const safeAge = Number(age) || 30;
    const safeTemp = Number(bodyTemperature) || 98.6;
    const safeHeart = Number(heartRate) || 75;
    const safeSpO2 = Number(spO2) || 98;
    const safeRR = Number(respiratoryRate) || 0;
    const safeAcoustic = Number(acousticScore) || 0;

    const bpParsed = parseBP(bloodPressure) || imputeBP(safeAge);
    const { systolic, diastolic } = bpParsed;
    const shockIndex = computeShockIndex(safeHeart, systolic);
    const map = computeMAP(systolic, diastolic);
    const tachypneaHypoxiaIndex = computeTachypneaHypoxiaIndex(safeRR, safeSpO2, safeAcoustic);
    const unableToDrink = Array.isArray(whoDangerSigns) && whoDangerSigns.includes('Unable to Drink / Severe Dehydration');
    const dehydrationScore = computeDehydrationScore(diarrhoea, symptomProgression, unableToDrink);
    const elderlyHypoxiaRisk = computeElderlyHypoxiaRisk(safeAge, safeSpO2, shockIndex);
    const tachypneaThreshold = getTachypneaThreshold(safeAge);
    const hasTachypnea = safeRR > tachypneaThreshold;
    const dangerSignCount = Array.isArray(whoDangerSigns) ? whoDangerSigns.length : 0;

    const diarrhoeaMap = { 'None': 0, 'Mild': 1, 'Moderate': 2, 'Severe': 3 };
    const diarrhoeaNum = diarrhoeaMap[diarrhoea] !== undefined ? diarrhoeaMap[diarrhoea] : 0;
    
    let riskScore = 0;
    const drivers = [];

    // Diarrhoea component
    if (diarrhoeaNum === 3) { riskScore += 45; drivers.push({ label: 'Severe Diarrhoea', weight: 45 }); }
    else if (diarrhoeaNum === 2) { riskScore += 25; drivers.push({ label: 'Moderate Diarrhoea', weight: 25 }); }
    else if (diarrhoeaNum === 1) { riskScore += 10; drivers.push({ label: 'Mild Diarrhoea', weight: 10 }); }
    
    // Age vulnerability
    if (safeAge < 5) { riskScore += 25; drivers.push({ label: `Pediatric Age (${safeAge}y)`, weight: 25 }); }
    else if (safeAge >= 65) { riskScore += 22; drivers.push({ label: `Elderly Age (${safeAge}y)`, weight: 22 }); }
    else if (safeAge > 50) { riskScore += 10; drivers.push({ label: `Age > 50 (${safeAge}y)`, weight: 10 }); }
    
    // SpO2 Hypoxia
    if (safeSpO2 <= 90) { riskScore += 40; drivers.push({ label: `Critical Hypoxia (SpO2 ${safeSpO2}%)`, weight: 40 }); }
    else if (safeSpO2 < 92) { riskScore += 30; drivers.push({ label: `Severe Hypoxia (SpO2 ${safeSpO2}%)`, weight: 30 }); }
    else if (safeSpO2 < 95) { riskScore += 20; drivers.push({ label: `Low SpO2 (${safeSpO2}%)`, weight: 20 }); }
    
    // Heart Rate Tachycardia
    if (safeHeart > 125) { riskScore += 25; drivers.push({ label: `Severe Tachycardia (HR ${safeHeart})`, weight: 25 }); }
    else if (safeHeart > 105) { riskScore += 15; drivers.push({ label: `Tachycardia (HR ${safeHeart})`, weight: 15 }); }
    
    // Temperature
    if (safeTemp >= 103.5) { riskScore += 20; drivers.push({ label: `High Fever (${safeTemp}°F)`, weight: 20 }); }
    else if (safeTemp >= 100.4) { riskScore += 12; drivers.push({ label: `Fever (${safeTemp}°F)`, weight: 12 }); }

    // Shock Index
    if (shockIndex > 1.2) { riskScore += 30; drivers.push({ label: `Critical Shock Index (${shockIndex})`, weight: 30 }); }
    else if (shockIndex > 1.0) { riskScore += 25; drivers.push({ label: `High Shock Index (${shockIndex})`, weight: 25 }); }
    else if (shockIndex > 0.8) { riskScore += 10; drivers.push({ label: `Elevated Shock Index (${shockIndex})`, weight: 10 }); }

    // MAP
    if (map > 0 && map < 60) { riskScore += 30; drivers.push({ label: `Critically Low MAP (${map})`, weight: 30 }); }
    else if (map > 0 && map < 65) { riskScore += 20; drivers.push({ label: `Low MAP (${map})`, weight: 20 }); }

    // Tachypnea-Hypoxia Index
    if (tachypneaHypoxiaIndex > 0.7) { riskScore += 25; drivers.push({ label: `Severe Respiratory Distress (THI ${tachypneaHypoxiaIndex})`, weight: 25 }); }
    else if (tachypneaHypoxiaIndex > 0.5) { riskScore += 15; drivers.push({ label: `Respiratory Distress (THI ${tachypneaHypoxiaIndex})`, weight: 15 }); }
    else if (tachypneaHypoxiaIndex > 0.3) { riskScore += 8; drivers.push({ label: `Mild Respiratory Concern`, weight: 8 }); }

    if (hasTachypnea && safeRR > 0) {
        riskScore += 12;
        drivers.push({ label: `Tachypnea (RR ${safeRR} > ${tachypneaThreshold} bpm)`, weight: 12 });
    }

    // Dehydration Score
    if (dehydrationScore >= 4) { riskScore += 25; drivers.push({ label: `Severe Dehydration (Score ${dehydrationScore})`, weight: 25 }); }
    else if (dehydrationScore >= 3) { riskScore += 18; drivers.push({ label: `Significant Dehydration (Score ${dehydrationScore})`, weight: 18 }); }
    else if (dehydrationScore >= 2) { riskScore += 8; drivers.push({ label: `Moderate Dehydration Risk`, weight: 8 }); }

    // Elderly Hypoxia Risk
    if (elderlyHypoxiaRisk >= 0.3) { riskScore += 24; drivers.push({ label: `Elderly Hypoxia Risk (${elderlyHypoxiaRisk})`, weight: 24 }); }
    else if (elderlyHypoxiaRisk > 0.15) { riskScore += 12; drivers.push({ label: `Age-Hypoxia Interaction (${elderlyHypoxiaRisk})`, weight: 12 }); }

    // Acoustic score
    if (safeAcoustic > 0.7) { riskScore += 15; drivers.push({ label: `${acousticLabel || 'Abnormal Breath Sound'} (${safeAcoustic})`, weight: 15 }); }
    else if (safeAcoustic > 0.4) { riskScore += 8; drivers.push({ label: `${acousticLabel || 'Respiratory Concern'} (${safeAcoustic})`, weight: 8 }); }

    // WHO Danger Signs
    if (dangerSignCount >= 2) {
        riskScore += 35;
        drivers.push({ label: `${dangerSignCount} WHO Danger Signs`, weight: 35 });
    } else if (dangerSignCount === 1) {
        riskScore += 20;
        drivers.push({ label: `WHO Danger Sign: ${whoDangerSigns[0]}`, weight: 20 });
    }

    // Symptom Progression
    if (symptomProgression === 'Rapidly Worsening') {
        riskScore += 15;
        drivers.push({ label: 'Rapidly Worsening Symptoms', weight: 15 });
    } else if (symptomProgression === '> 3 Days' || symptomProgression === 'More than a week') {
        riskScore += 8;
        drivers.push({ label: `Prolonged Symptoms (${symptomProgression})`, weight: 8 });
    }

    drivers.sort((a, b) => b.weight - a.weight);
    const topDrivers = drivers.slice(0, 3);

    const hardCritical = (
        safeSpO2 <= 90 ||
        shockIndex > 1.2 ||
        (map > 0 && map < 60) ||
        dangerSignCount >= 2 ||
        (diarrhoeaNum === 3 && (safeAge < 5 || safeAge > 65 || safeHeart > 115))
    );

    const hardModerate = (
        dangerSignCount >= 1 ||
        safeAge > 65 ||
        safeAge < 5 ||
        diarrhoeaNum === 2
    );

    if (hardCritical || riskScore >= 55) {
        return {
            riskLevel: 'Critical Risk',
            confidenceScore: Math.min(98.5, Math.max(91.0, 88 + (riskScore * 0.08))).toFixed(1),
            recommendedAction: diarrhoeaNum >= 2 
                ? 'Immediate referral to nearest hospital. High risk of dehydration shock/cholera. Start high-volume ORS or IV fluids immediately.'
                : shockIndex > 1.0
                  ? 'Emergency hospitalization. Hemodynamic instability detected (high Shock Index). Immediate IV access and monitoring required.'
                  : 'Immediate hospital transfer. Critical vital signs detected.',
            riskDrivers: topDrivers,
            computedFeatures: {
                shockIndex,
                map,
                tachypneaHypoxiaIndex,
                dehydrationScore,
                elderlyHypoxiaRisk,
                hasTachypnea
            }
        };
    } else if (hardModerate || riskScore >= 25) {
        return {
            riskLevel: 'Moderate Risk',
            confidenceScore: Math.min(94.0, Math.max(82.0, 80 + (riskScore * 0.12))).toFixed(1),
            recommendedAction: diarrhoeaNum >= 1
                ? 'Visit Primary Health Centre (PHC). Prescribe Oral Rehydration Salts (ORS) + Zinc tablets.'
                : hasTachypnea
                  ? 'Visit PHC for respiratory assessment. Monitor breathing rate and oxygen saturation.'
                  : 'Refer to Primary Health Centre for diagnostic review.',
            riskDrivers: topDrivers,
            computedFeatures: {
                shockIndex,
                map,
                tachypneaHypoxiaIndex,
                dehydrationScore,
                elderlyHypoxiaRisk,
                hasTachypnea
            }
        };
    } else {
        return {
            riskLevel: 'Low Risk',
            confidenceScore: '95.5',
            recommendedAction: diarrhoeaNum === 1
                ? 'Home Care: Drink plenty of fluids (ORS, coconut water, clean boiled water) and light diet.'
                : 'Home Care: Rest, maintain hydration, and self-monitor vitals.',
            riskDrivers: topDrivers.length > 0 ? topDrivers : [{ label: 'All vitals within normal range', weight: 0 }],
            computedFeatures: {
                shockIndex,
                map,
                tachypneaHypoxiaIndex,
                dehydrationScore,
                elderlyHypoxiaRisk,
                hasTachypnea
            }
        };
    }
};

// @route   POST api/health/predict
// @desc    Submit health data, get prediction and save report
router.post('/predict', auth, async (req, res) => {
    try {
        const { 
            age, 
            bodyTemperature, 
            heartRate, 
            spO2, 
            symptoms, 
            durationOfSymptoms, 
            bloodPressure, 
            diarrhoea, 
            patientName,
            villageName,
            respiratoryRate,
            acousticScore,
            acousticLabel,
            symptomProgression,
            whoDangerSigns
        } = req.body;

        const safeAge = parseInt(age, 10) || 30;
        const safeTemp = parseFloat(bodyTemperature) || 98.6;
        const safeHeart = parseInt(heartRate, 10) || 75;
        const safeSpO2 = parseInt(spO2, 10) || 98;

        const prediction = predictRisk({ 
            age: safeAge, 
            bodyTemperature: safeTemp, 
            heartRate: safeHeart, 
            spO2: safeSpO2, 
            diarrhoea: diarrhoea || 'None',
            bloodPressure: bloodPressure || '',
            respiratoryRate: Number(respiratoryRate) || 0,
            acousticScore: Number(acousticScore) || 0,
            acousticLabel: acousticLabel || '',
            symptomProgression: symptomProgression || durationOfSymptoms || 'None',
            whoDangerSigns: whoDangerSigns || []
        });

        const reportId = crypto.randomBytes(16).toString('hex');
        const report = {
            _id: reportId,
            id: reportId,
            user: req.user?.id || req.user?._id || 'anonymous',
            patientName: patientName || 'Self',
            villageName: villageName || 'Unknown',
            age: safeAge,
            bodyTemperature: safeTemp,
            heartRate: safeHeart,
            spO2: safeSpO2,
            bloodPressure: bloodPressure || '120/80',
            diarrhoea: diarrhoea || 'None',
            respiratoryRate: Number(respiratoryRate) || 0,
            acousticScore: Number(acousticScore) || 0,
            acousticLabel: acousticLabel || '',
            symptomProgression: symptomProgression || 'None',
            whoDangerSigns: whoDangerSigns || [],
            symptoms: symptoms || {},
            durationOfSymptoms: durationOfSymptoms || 'None',
            riskLevel: prediction.riskLevel,
            confidenceScore: prediction.confidenceScore,
            recommendedAction: prediction.recommendedAction,
            riskDrivers: prediction.riskDrivers || [],
            computedFeatures: prediction.computedFeatures || {},
            createdAt: new Date().toISOString()
        };

        dbStore.reports.unshift(report);

        res.json(report);
    } catch (err) {
        console.error('Prediction error:', err.message);
        res.status(500).json({ msg: 'Server Error during prediction', error: err.message });
    }
});

// @route   GET api/health/history
// @desc    Get user's health history
router.get('/history', auth, async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const reports = dbStore.reports
            .filter(r => !userId || r.user === userId || r.user === 'anonymous')
            .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(reports);
    } catch (err) {
        console.error('History fetch error:', err.message);
        res.status(500).json({ msg: 'Server Error fetching history', error: err.message });
    }
});

// @route   GET api/health/surveillance
// @desc    Get village cluster surveillance summaries
router.get('/surveillance', auth, async (req, res) => {
    try {
        const windowHours = parseInt(req.query.hours, 10) || 48;
        const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
        const recent = dbStore.reports.filter(r => r.createdAt >= cutoff);

        const villageMap = {};
        for (const r of recent) {
            const v = (r.villageName || 'unknown').trim().toLowerCase();
            if (!villageMap[v]) {
                villageMap[v] = {
                    villageName: v,
                    totalCases: 0,
                    feverCases: 0,
                    diarrhoeaCases: 0,
                    respiratoryCases: 0,
                    criticalCases: 0
                };
            }
            villageMap[v].totalCases++;
            if ((r.bodyTemperature || 98.6) >= 100.4) villageMap[v].feverCases++;
            if (r.diarrhoea && r.diarrhoea !== 'None') villageMap[v].diarrhoeaCases++;
            if ((r.respiratoryRate > 22) || (r.spO2 < 95)) villageMap[v].respiratoryCases++;
            if (r.riskLevel === 'Critical Risk') villageMap[v].criticalCases++;
        }

        const villages = Object.values(villageMap).map(v => {
            const isOutbreak = (v.diarrhoeaCases >= 5 || v.feverCases >= 5 || v.respiratoryCases >= 5);
            return {
                ...v,
                isOutbreak,
                alertMessage: isOutbreak ? `Outbreak threshold (>=5) met in ${v.villageName}` : null
            };
        });

        res.json({
            windowHours,
            totalRecentReports: recent.length,
            villages
        });
    } catch (err) {
        console.error('Surveillance summary error:', err.message);
        res.status(500).json({ msg: 'Server Error fetching surveillance', error: err.message });
    }
});

module.exports = router;
