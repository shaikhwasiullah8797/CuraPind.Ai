/**
 * CuraPind AI v2.0 — Clinical Feature Engineering & Multi-Modal Fusion
 * Computes non-linear medical indices from raw vitals before inference.
 */

/**
 * Parse "systolic/diastolic" string into numeric values.
 * Returns { systolic, diastolic } or null if unparseable.
 */
export const parseBP = (bpString) => {
  if (!bpString || typeof bpString !== 'string') return null;
  const parts = bpString.replace(/\s/g, '').split('/');
  if (parts.length !== 2) return null;
  const systolic = parseFloat(parts[0]);
  const diastolic = parseFloat(parts[1]);
  if (isNaN(systolic) || isNaN(diastolic)) return null;
  if (systolic < 50 || systolic > 300 || diastolic < 20 || diastolic > 200) return null;
  return { systolic, diastolic };
};

/**
 * Age-adjusted BP imputation when BP is not available.
 */
export const imputeBP = (age) => {
  const safeAge = Number(age) || 30;
  if (safeAge < 18) return { systolic: 110, diastolic: 70 };
  if (safeAge <= 60) return { systolic: 120, diastolic: 80 };
  return { systolic: 130, diastolic: 80 };
};

/**
 * Shock Index = Heart Rate / Systolic BP
 * Normal: 0.5–0.7, Elevated: 0.7–1.0, Critical: > 1.0
 */
export const computeShockIndex = (heartRate, systolicBP) => {
  if (!systolicBP || systolicBP <= 0) return 0;
  return Math.round((heartRate / systolicBP) * 100) / 100;
};

/**
 * Mean Arterial Pressure = Diastolic + (1/3)(Systolic - Diastolic)
 * Normal: 70–100 mmHg, Critically low: < 65 mmHg
 */
export const computeMAP = (systolic, diastolic) => {
  if (!systolic || !diastolic) return 0;
  return Math.round((diastolic + (systolic - diastolic) / 3) * 10) / 10;
};

/**
 * Tachypnea-Hypoxia Index: Detects early respiratory distress.
 * Combines Respiratory Rate, SpO2, and Acoustic Respiratory Score.
 * Output range: 0.0 – 1.0 (higher = more distress)
 */
export const computeTachypneaHypoxiaIndex = (respiratoryRate, spO2, acousticScore = 0) => {
  const rr = Number(respiratoryRate) || 0;
  const spo2 = Number(spO2) || 98;
  const acoustic = Number(acousticScore) || 0;

  // RR component: normalized deviation above normal (16 bpm baseline)
  const rrComponent = Math.min(1.0, Math.max(0, (rr - 16) / 24)); // 0 at 16, 1 at 40

  // SpO2 component: normalized drop below 98%
  const spo2Component = Math.min(1.0, Math.max(0, (98 - spo2) / 12)); // 0 at 98, 1 at 86

  // Weighted combination
  const index = (rrComponent * 0.4) + (spo2Component * 0.35) + (acoustic * 0.25);
  return Math.round(Math.min(1.0, Math.max(0, index)) * 100) / 100;
};

/**
 * Dehydration Severity Score (0–5 scale)
 * Combines diarrhoea severity, symptom duration, and WHO danger sign.
 */
export const computeDehydrationScore = (diarrhoea, symptomProgression, unableToDrink = false) => {
  const diarrhoeaMap = { 'None': 0, 'Mild': 1, 'Moderate': 2, 'Severe': 3 };
  const diarrhoeaNum = diarrhoeaMap[diarrhoea] !== undefined ? diarrhoeaMap[diarrhoea] : 0;

  const durationMap = {
    '< 24 Hours': 0, '1-3 days': 0.5, '1 - 3 Days': 0.5,
    '> 3 Days': 1.5, '4-7 days': 1.5, 'More than a week': 2.0,
    'Rapidly Worsening': 2.0, 'None': 0
  };
  const durationScore = durationMap[symptomProgression] !== undefined ? durationMap[symptomProgression] : 0;

  let score = diarrhoeaNum + durationScore;
  if (unableToDrink) score += 1.5;

  return Math.min(5, Math.round(score * 10) / 10);
};

/**
 * Elderly Hypoxia Risk: Age-weighted interaction with hypoxia and shock.
 * Higher for elderly patients with even mild SpO2 drops.
 */
export const computeElderlyHypoxiaRisk = (age, spO2, shockIndex) => {
  const safeAge = Number(age) || 30;
  const safeSpo2 = Number(spO2) || 98;
  const safeSI = Number(shockIndex) || 0.6;

  if (safeAge < 50) return 0;

  // Age factor: scales from 0 at age 50 to 1.0 at age 80
  const ageFactor = Math.min(1.0, (safeAge - 50) / 30);

  // Hypoxia component: (100 - SpO2), scaled
  const hypoxiaComponent = Math.max(0, (100 - safeSpo2)) / 10;

  // Shock component
  const shockComponent = Math.max(0, safeSI - 0.6) / 0.8;

  const risk = ageFactor * (hypoxiaComponent * 0.7 + shockComponent * 0.3);
  return Math.round(Math.min(1.0, Math.max(0, risk)) * 100) / 100;
};

/**
 * WHO age-adjusted tachypnea thresholds (breaths per minute).
 */
export const getTachypneaThreshold = (age) => {
  const safeAge = Number(age) || 30;
  if (safeAge < 1) return 50;      // Infant < 1 year
  if (safeAge < 5) return 40;      // Child 1-4
  if (safeAge < 12) return 30;     // Child 5-11
  return 22;                        // Adult / adolescent
};

/**
 * Check if respiratory rate indicates tachypnea for given age.
 */
export const isTachypnea = (respiratoryRate, age) => {
  const rr = Number(respiratoryRate) || 0;
  if (rr <= 0) return false;
  return rr > getTachypneaThreshold(age);
};

/**
 * Master function: Compute all clinical features from raw inputs.
 */
export const computeAllFeatures = ({
  age = 30,
  heartRate = 75,
  spO2 = 98,
  bloodPressure = '',
  respiratoryRate = 0,
  acousticScore = 0,
  diarrhoea = 'None',
  symptomProgression = 'None',
  whoDangerSigns = []
}) => {
  // Parse or impute BP
  const bpParsed = parseBP(bloodPressure) || imputeBP(age);
  const { systolic, diastolic } = bpParsed;
  const bpWasImputed = !parseBP(bloodPressure);

  // Compute indices
  const shockIndex = computeShockIndex(heartRate, systolic);
  const map = computeMAP(systolic, diastolic);
  const tachypneaHypoxiaIndex = computeTachypneaHypoxiaIndex(respiratoryRate, spO2, acousticScore);
  const unableToDrink = whoDangerSigns.includes('Unable to Drink / Severe Dehydration');
  const dehydrationScore = computeDehydrationScore(diarrhoea, symptomProgression, unableToDrink);
  const elderlyHypoxiaRisk = computeElderlyHypoxiaRisk(age, spO2, shockIndex);
  const hasTachypnea = isTachypnea(respiratoryRate, age);

  return {
    systolic,
    diastolic,
    bpWasImputed,
    shockIndex,
    map,
    tachypneaHypoxiaIndex,
    dehydrationScore,
    elderlyHypoxiaRisk,
    hasTachypnea,
    tachypneaThreshold: getTachypneaThreshold(age),
    dangerSignCount: whoDangerSigns.length
  };
};
