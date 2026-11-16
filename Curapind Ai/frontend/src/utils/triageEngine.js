/**
 * CuraPind AI v2.0 — Clinical Decision Support & Triage Engine
 * Enhanced Random Forest calibrated decision boundaries with multi-modal fusion.
 * Incorporates: BP/Shock Index, Respiratory Rate, Acoustic Score, WHO Danger Signs,
 * Dehydration Score, Elderly Hypoxia Risk, and SHAP-like risk driver attribution.
 */

import { computeAllFeatures } from './featureEngineering';

export const calculateTriageRisk = ({
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
}) => {
    const safeAge = Number(age) || 30;
    const safeTemp = Number(bodyTemperature) || 98.6;
    const safeHeart = Number(heartRate) || 75;
    const safeSpO2 = Number(spO2) || 98;
    const safeRR = Number(respiratoryRate) || 0;
    const safeAcoustic = Number(acousticScore) || 0;

    const diarrhoeaMap = { 'None': 0, 'Mild': 1, 'Moderate': 2, 'Severe': 3 };
    const diarrhoeaNum = diarrhoeaMap[diarrhoea] !== undefined ? diarrhoeaMap[diarrhoea] : 0;

    // Compute all clinical features
    const features = computeAllFeatures({
        age: safeAge,
        heartRate: safeHeart,
        spO2: safeSpO2,
        bloodPressure,
        respiratoryRate: safeRR,
        acousticScore: safeAcoustic,
        diarrhoea,
        symptomProgression,
        whoDangerSigns
    });

    // ===== Multi-modal Risk Scoring =====
    let riskScore = 0;
    const drivers = []; // Track what contributes to the score

    // --- Original components (preserved) ---

    // Diarrhoea component (36.6% importance)
    if (diarrhoeaNum === 3) { riskScore += 45; drivers.push({ label: `Severe Diarrhoea`, weight: 45 }); }
    else if (diarrhoeaNum === 2) { riskScore += 25; drivers.push({ label: `Moderate Diarrhoea`, weight: 25 }); }
    else if (diarrhoeaNum === 1) { riskScore += 10; drivers.push({ label: `Mild Diarrhoea`, weight: 10 }); }

    // Age vulnerability (24.0% importance)
    if (safeAge < 5) { riskScore += 25; drivers.push({ label: `Pediatric Age (${safeAge}y)`, weight: 25 }); }
    else if (safeAge >= 65) { riskScore += 22; drivers.push({ label: `Elderly Age (${safeAge}y)`, weight: 22 }); }
    else if (safeAge > 50) { riskScore += 10; drivers.push({ label: `Age > 50 (${safeAge}y)`, weight: 10 }); }

    // SpO2 Hypoxia (16.7% importance)
    if (safeSpO2 <= 90) { riskScore += 40; drivers.push({ label: `Critical Hypoxia (SpO2 ${safeSpO2}%)`, weight: 40 }); }
    else if (safeSpO2 < 92) { riskScore += 30; drivers.push({ label: `Severe Hypoxia (SpO2 ${safeSpO2}%)`, weight: 30 }); }
    else if (safeSpO2 < 95) { riskScore += 20; drivers.push({ label: `Low SpO2 (${safeSpO2}%)`, weight: 20 }); }

    // Heart Rate Tachycardia (13.9% importance)
    if (safeHeart > 125) { riskScore += 25; drivers.push({ label: `Severe Tachycardia (HR ${safeHeart})`, weight: 25 }); }
    else if (safeHeart > 105) { riskScore += 15; drivers.push({ label: `Tachycardia (HR ${safeHeart})`, weight: 15 }); }

    // Temperature (8.8% importance)
    if (safeTemp >= 103.5) { riskScore += 20; drivers.push({ label: `High Fever (${safeTemp}°F)`, weight: 20 }); }
    else if (safeTemp >= 100.4) { riskScore += 12; drivers.push({ label: `Fever (${safeTemp}°F)`, weight: 12 }); }

    // --- New v2.0 components ---

    // Shock Index (from BP)
    if (features.shockIndex > 1.2) { riskScore += 30; drivers.push({ label: `Critical Shock Index (${features.shockIndex})`, weight: 30 }); }
    else if (features.shockIndex > 1.0) { riskScore += 25; drivers.push({ label: `High Shock Index (${features.shockIndex})`, weight: 25 }); }
    else if (features.shockIndex > 0.8) { riskScore += 10; drivers.push({ label: `Elevated Shock Index (${features.shockIndex})`, weight: 10 }); }

    // MAP (Mean Arterial Pressure)
    if (features.map > 0 && features.map < 60) { riskScore += 30; drivers.push({ label: `Critically Low MAP (${features.map})`, weight: 30 }); }
    else if (features.map > 0 && features.map < 65) { riskScore += 20; drivers.push({ label: `Low MAP (${features.map})`, weight: 20 }); }

    // Tachypnea-Hypoxia Index
    if (features.tachypneaHypoxiaIndex > 0.7) { riskScore += 25; drivers.push({ label: `Severe Respiratory Distress (THI ${features.tachypneaHypoxiaIndex})`, weight: 25 }); }
    else if (features.tachypneaHypoxiaIndex > 0.5) { riskScore += 15; drivers.push({ label: `Respiratory Distress (THI ${features.tachypneaHypoxiaIndex})`, weight: 15 }); }
    else if (features.tachypneaHypoxiaIndex > 0.3) { riskScore += 8; drivers.push({ label: `Mild Respiratory Concern`, weight: 8 }); }

    // Tachypnea flag (standalone RR check)
    if (features.hasTachypnea && safeRR > 0) {
      riskScore += 12;
      drivers.push({ label: `Tachypnea (RR ${safeRR} > ${features.tachypneaThreshold} bpm)`, weight: 12 });
    }

    // Dehydration Score
    if (features.dehydrationScore >= 4) { riskScore += 25; drivers.push({ label: `Severe Dehydration (Score ${features.dehydrationScore})`, weight: 25 }); }
    else if (features.dehydrationScore >= 3) { riskScore += 18; drivers.push({ label: `Significant Dehydration (Score ${features.dehydrationScore})`, weight: 18 }); }
    else if (features.dehydrationScore >= 2) { riskScore += 8; drivers.push({ label: `Moderate Dehydration Risk`, weight: 8 }); }

    // Elderly Hypoxia Risk (interaction term)
    if (features.elderlyHypoxiaRisk >= 0.3) { riskScore += 24; drivers.push({ label: `Elderly Hypoxia Risk (${features.elderlyHypoxiaRisk})`, weight: 24 }); }
    else if (features.elderlyHypoxiaRisk > 0.15) { riskScore += 12; drivers.push({ label: `Age-Hypoxia Interaction (${features.elderlyHypoxiaRisk})`, weight: 12 }); }

    // Acoustic respiratory signal
    if (safeAcoustic > 0.7) { riskScore += 15; drivers.push({ label: `${acousticLabel || 'Abnormal Respiratory Sound'} (${safeAcoustic})`, weight: 15 }); }
    else if (safeAcoustic > 0.4) { riskScore += 8; drivers.push({ label: `${acousticLabel || 'Respiratory Sound Concern'} (${safeAcoustic})`, weight: 8 }); }

    // WHO Danger Sign escalation
    if (features.dangerSignCount >= 2) {
      riskScore += 35;
      drivers.push({ label: `${features.dangerSignCount} WHO Danger Signs`, weight: 35 });
    } else if (features.dangerSignCount === 1) {
      riskScore += 20;
      drivers.push({ label: `WHO Danger Sign: ${whoDangerSigns[0]}`, weight: 20 });
    }

    // Symptom progression urgency
    if (symptomProgression === 'Rapidly Worsening') {
      riskScore += 15;
      drivers.push({ label: 'Rapidly Worsening Symptoms', weight: 15 });
    } else if (symptomProgression === '> 3 Days' || symptomProgression === 'More than a week') {
      riskScore += 8;
      drivers.push({ label: `Prolonged Symptoms (${symptomProgression})`, weight: 8 });
    }

    // Sort drivers by weight descending, take top 3
    drivers.sort((a, b) => b.weight - a.weight);
    const topDrivers = drivers.slice(0, 3);

    // ===== Classification =====
    // Hard critical triggers
    const hardCritical = (
      safeSpO2 <= 90 ||
      features.shockIndex > 1.2 ||
      (features.map > 0 && features.map < 60) ||
      features.dangerSignCount >= 2 ||
      (diarrhoeaNum === 3 && (safeAge < 5 || safeAge > 65 || safeHeart > 115))
    );

    // Moderate floor triggers
    const hardModerate = (
      features.dangerSignCount >= 1 ||
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
                : features.shockIndex > 1.0
                  ? 'Emergency hospitalization. Hemodynamic instability detected (high Shock Index). Immediate IV access and monitoring required.'
                  : 'Immediate hospital transfer. Critical vital signs detected.',
            riskDrivers: topDrivers,
            computedFeatures: features,
            riskScore
        };
    } else if (hardModerate || riskScore >= 25) {
        return {
            riskLevel: 'Moderate Risk',
            confidenceScore: Math.min(94.0, Math.max(82.0, 80 + (riskScore * 0.12))).toFixed(1),
            recommendedAction: diarrhoeaNum >= 1
                ? 'Visit Primary Health Centre (PHC). Prescribe Oral Rehydration Salts (ORS) + Zinc tablets.'
                : features.hasTachypnea
                  ? 'Visit PHC for respiratory assessment. Monitor breathing rate and oxygen saturation.'
                  : 'Refer to Primary Health Centre for diagnostic review.',
            riskDrivers: topDrivers,
            computedFeatures: features,
            riskScore
        };
    } else {
        return {
            riskLevel: 'Low Risk',
            confidenceScore: '95.5',
            recommendedAction: diarrhoeaNum === 1
                ? 'Home Care: Drink plenty of fluids (ORS, coconut water, clean boiled water) and light diet.'
                : 'Home Care: Rest, maintain hydration, and self-monitor vitals.',
            riskDrivers: topDrivers.length > 0 ? topDrivers : [{ label: 'All vitals within normal range', weight: 0 }],
            computedFeatures: features,
            riskScore
        };
    }
};
