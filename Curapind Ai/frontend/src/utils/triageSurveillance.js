/**
 * CuraPind AI — Offline Village Surveillance Module
 * Stores anonymized triage entries locally and detects outbreak clusters.
 * Uses localStorage (IndexedDB-free for maximum rural device compatibility).
 */

const STORAGE_KEY = 'curapind_surveillance_log';
const MAX_ENTRIES = 500;

/**
 * Get all surveillance entries from local storage.
 */
export const getSurveillanceLog = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Save surveillance log to local storage.
 */
const saveSurveillanceLog = (entries) => {
  try {
    // Keep only the most recent entries
    const trimmed = entries.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Could not persist surveillance log:', e);
  }
};

/**
 * Log a new triage entry for village-level surveillance.
 * @param {Object} entry
 * @param {string} entry.villageName - Village / ward name
 * @param {string} entry.riskLevel - "Low Risk" | "Moderate Risk" | "Critical Risk"
 * @param {number} entry.age - Patient age
 * @param {number} entry.bodyTemperature - Temperature (°F)
 * @param {string} entry.diarrhoea - Diarrhoea severity
 * @param {number} entry.respiratoryRate - Respiratory rate (bpm)
 * @param {number} entry.spO2 - Oxygen saturation
 * @param {string[]} entry.whoDangerSigns - WHO danger signs present
 * @param {string} entry.acousticLabel - Acoustic classification
 */
export const logTriageEntry = (entry) => {
  const log = getSurveillanceLog();

  const record = {
    id: `surv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    villageName: (entry.villageName || 'Unknown').trim().toLowerCase(),
    riskLevel: entry.riskLevel || 'Low Risk',
    age: entry.age || 0,
    hasFever: (entry.bodyTemperature || 98.6) >= 100.4,
    hasDiarrhoea: entry.diarrhoea && entry.diarrhoea !== 'None',
    diarrhoeaSeverity: entry.diarrhoea || 'None',
    hasRespiratoryDistress: (entry.respiratoryRate > 22) || (entry.spO2 < 95) ||
      (entry.acousticLabel && entry.acousticLabel !== 'Normal Breathing'),
    respiratoryRate: entry.respiratoryRate || 0,
    spO2: entry.spO2 || 98,
    acousticLabel: entry.acousticLabel || '',
    whoDangerSigns: entry.whoDangerSigns || []
  };

  log.unshift(record);
  saveSurveillanceLog(log);
  return record;
};

/**
 * Check for outbreak clusters in a specific village.
 * Triggers alert if >= threshold cases of fever, diarrhoea, or respiratory
 * distress within the specified time window.
 *
 * @param {string} villageName - Village name to check
 * @param {number} windowHours - Time window in hours (default 48)
 * @param {number} threshold - Minimum cases to trigger alert (default 5)
 * @returns {Object|null} Alert object if cluster detected, null otherwise
 */
export const checkOutbreakCluster = (villageName, windowHours = 48, threshold = 5) => {
  const log = getSurveillanceLog();
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
  const village = villageName.trim().toLowerCase();

  const recentCases = log.filter(
    e => e.villageName === village && e.timestamp >= cutoff
  );

  if (recentCases.length === 0) return null;

  // Count by syndrome
  const feverCount = recentCases.filter(e => e.hasFever).length;
  const diarrhoeaCount = recentCases.filter(e => e.hasDiarrhoea).length;
  const respiratoryCount = recentCases.filter(e => e.hasRespiratoryDistress).length;
  const criticalCount = recentCases.filter(e => e.riskLevel === 'Critical Risk').length;

  const alerts = [];

  if (feverCount >= threshold) {
    alerts.push({
      syndrome: 'Fever Cluster',
      count: feverCount,
      severity: 'high',
      message: `${feverCount} fever cases in ${villageName} within ${windowHours}h — possible outbreak`
    });
  }

  if (diarrhoeaCount >= threshold) {
    alerts.push({
      syndrome: 'Diarrhoea / Waterborne',
      count: diarrhoeaCount,
      severity: 'critical',
      message: `${diarrhoeaCount} diarrhoea cases in ${villageName} within ${windowHours}h — investigate water source`
    });
  }

  if (respiratoryCount >= threshold) {
    alerts.push({
      syndrome: 'Respiratory Distress',
      count: respiratoryCount,
      severity: 'high',
      message: `${respiratoryCount} respiratory distress cases in ${villageName} within ${windowHours}h — possible respiratory outbreak`
    });
  }

  if (alerts.length === 0) return null;

  return {
    villageName,
    totalCases: recentCases.length,
    criticalCount,
    windowHours,
    alerts,
    timestamp: new Date().toISOString()
  };
};

/**
 * Get surveillance summary across all villages.
 * Returns aggregated data for the BMO dashboard.
 */
export const getSurveillanceSummary = (windowHours = 48) => {
  const log = getSurveillanceLog();
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const recentEntries = log.filter(e => e.timestamp >= cutoff);

  // Group by village
  const villageMap = {};
  for (const entry of recentEntries) {
    const v = entry.villageName || 'unknown';
    if (!villageMap[v]) {
      villageMap[v] = {
        villageName: v,
        totalCases: 0,
        feverCases: 0,
        diarrhoeaCases: 0,
        respiratoryCases: 0,
        criticalCases: 0,
        moderateCases: 0,
        entries: []
      };
    }
    villageMap[v].totalCases++;
    if (entry.hasFever) villageMap[v].feverCases++;
    if (entry.hasDiarrhoea) villageMap[v].diarrhoeaCases++;
    if (entry.hasRespiratoryDistress) villageMap[v].respiratoryCases++;
    if (entry.riskLevel === 'Critical Risk') villageMap[v].criticalCases++;
    if (entry.riskLevel === 'Moderate Risk') villageMap[v].moderateCases++;
    villageMap[v].entries.push(entry);
  }

  // Check for outbreak alerts in each village
  const villages = Object.values(villageMap).map(v => {
    const alert = checkOutbreakCluster(v.villageName, windowHours);
    return { ...v, alert };
  });

  // Sort: alerted villages first, then by total cases descending
  villages.sort((a, b) => {
    if (a.alert && !b.alert) return -1;
    if (!a.alert && b.alert) return 1;
    return b.totalCases - a.totalCases;
  });

  return {
    windowHours,
    totalEntries: recentEntries.length,
    totalVillages: villages.length,
    alertedVillages: villages.filter(v => v.alert).length,
    villages
  };
};

/**
 * Clear all surveillance data (admin function).
 */
export const clearSurveillanceLog = () => {
  localStorage.removeItem(STORAGE_KEY);
};
