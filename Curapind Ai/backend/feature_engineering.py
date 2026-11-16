"""
CuraPind AI v2.0 - Clinical Feature Engineering & Multi-Modal Fusion (Python)
Extracts non-linear medical indices from raw patient vitals for model training & inference.
"""

import re
import numpy as np

def parse_blood_pressure(bp_str, age=30):
    """
    Parses 'systolic/diastolic' string (e.g. '120/80').
    If blank or unparseable, imputes age-adjusted baseline:
      <18: 110/70, 18-60: 120/80, >60: 130/80
    """
    if isinstance(bp_str, str) and '/' in bp_str:
        clean = re.sub(r'\s+', '', bp_str)
        parts = clean.split('/')
        if len(parts) == 2:
            try:
                sys = float(parts[0])
                dia = float(parts[1])
                if 50 <= sys <= 280 and 30 <= dia <= 180:
                    return sys, dia, False  # Not imputed
            except ValueError:
                pass

    # Impute age-adjusted baseline
    if age < 18:
        return 110.0, 70.0, True
    elif age <= 60:
        return 120.0, 80.0, True
    else:
        return 130.0, 80.0, True

def compute_shock_index(heart_rate, systolic_bp):
    """
    Shock Index = Heart Rate / Systolic BP
    Normal: 0.5 - 0.7, Elevated: 0.7 - 1.0, Critical: > 1.0
    """
    if systolic_bp <= 0:
        return 0.6
    return round(float(heart_rate) / float(systolic_bp), 3)

def compute_map(systolic_bp, diastolic_bp):
    """
    Mean Arterial Pressure (MAP) = Diastolic + (1/3)*(Systolic - Diastolic)
    Normal: 70 - 100 mmHg, Critically low: < 65 mmHg
    """
    return round(float(diastolic_bp) + (float(systolic_bp) - float(diastolic_bp)) / 3.0, 2)

def compute_tachypnea_hypoxia_index(respiratory_rate, spo2, acoustic_score=0.0):
    """
    Tachypnea-Hypoxia Index: Detects early respiratory distress before severe SpO2 drops.
    Output: 0.0 - 1.0
    """
    rr = float(respiratory_rate) if respiratory_rate else 16.0
    s = float(spo2) if spo2 else 98.0
    ac = float(acoustic_score) if acoustic_score else 0.0

    # RR component: normalized deviation above 16 bpm
    rr_comp = min(1.0, max(0.0, (rr - 16.0) / 24.0))

    # SpO2 component: drop below 98%
    spo2_comp = min(1.0, max(0.0, (98.0 - s) / 12.0))

    index = (rr_comp * 0.40) + (spo2_comp * 0.35) + (ac * 0.25)
    return round(float(np.clip(index, 0.0, 1.0)), 3)

def compute_dehydration_severity(diarrhoea_str, symptom_progression_str, unable_to_drink=False):
    """
    Dehydration Severity Score (0 - 5.0 scale)
    Combines diarrhoea severity, symptom duration, and the 'Unable to Drink' danger sign.
    """
    d_map = {'None': 0.0, 'Mild': 1.0, 'Moderate': 2.0, 'Severe': 3.0}
    d_num = d_map.get(diarrhoea_str, 0.0)

    dur_map = {
        '< 24 Hours': 0.0,
        '1 - 3 Days': 0.5,
        '1-3 days': 0.5,
        '> 3 Days': 1.5,
        '4-7 days': 1.5,
        'More than a week': 2.0,
        'Rapidly Worsening': 2.0,
        'None': 0.0
    }
    dur_score = dur_map.get(symptom_progression_str, 0.0)

    score = d_num + dur_score
    if unable_to_drink:
        score += 1.5
    return round(min(5.0, score), 2)

def compute_elderly_hypoxia_risk(age, spo2, shock_index):
    """
    Interaction term weighting Age with (100 - SpO2) and Shock_Index.
    Scale: 0.0 - 1.0
    """
    if age < 50:
        return 0.0

    age_factor = min(1.0, (age - 50.0) / 30.0)
    hypoxia_comp = max(0.0, 100.0 - float(spo2)) / 10.0
    shock_comp = max(0.0, float(shock_index) - 0.6) / 0.8

    risk = age_factor * (hypoxia_comp * 0.7 + shock_comp * 0.3)
    return round(float(np.clip(risk, 0.0, 1.0)), 3)

def get_tachypnea_threshold(age):
    """WHO Age-adjusted respiratory rate thresholds (breaths/min)"""
    if age < 1:
        return 50
    elif age < 5:
        return 40
    elif age < 12:
        return 30
    return 22

def extract_clinical_features(record):
    """
    Takes a raw dictionary and returns an engineered feature dict.
    """
    age = float(record.get('age', 30))
    temp = float(record.get('bodyTemperature', 98.6))
    hr = float(record.get('heartRate', 75))
    spo2 = float(record.get('spO2', 98))
    bp_str = record.get('bloodPressure', '')
    diarrhoea = record.get('diarrhoea', 'None')
    rr = float(record.get('respiratoryRate', 16) or 16)
    acoustic_score = float(record.get('acousticScore', 0.0) or 0.0)
    progression = record.get('symptomProgression', record.get('durationOfSymptoms', 'None'))
    danger_signs = record.get('whoDangerSigns', [])
    unable_to_drink = 'Unable to Drink / Severe Dehydration' in danger_signs

    sys, dia, imputed = parse_blood_pressure(bp_str, age)
    shock_index = compute_shock_index(hr, sys)
    map_val = compute_map(sys, dia)
    thi = compute_tachypnea_hypoxia_index(rr, spo2, acoustic_score)
    dehydration_score = compute_dehydration_severity(diarrhoea, progression, unable_to_drink)
    elderly_risk = compute_elderly_hypoxia_risk(age, spo2, shock_index)
    tachypnea_flag = 1 if rr > get_tachypnea_threshold(age) else 0

    d_map = {'None': 0, 'Mild': 1, 'Moderate': 2, 'Severe': 3}
    diarrhoea_num = d_map.get(diarrhoea, 0)

    return {
        'age': age,
        'bodyTemperature': temp,
        'heartRate': hr,
        'spO2': spo2,
        'respiratoryRate': rr,
        'systolic_bp': sys,
        'diastolic_bp': dia,
        'shock_index': shock_index,
        'map': map_val,
        'tachypnea_hypoxia_index': thi,
        'dehydration_score': dehydration_score,
        'elderly_hypoxia_risk': elderly_risk,
        'tachypnea_flag': tachypnea_flag,
        'acoustic_score': acoustic_score,
        'diarrhoea_num': diarrhoea_num,
        'danger_signs_count': len(danger_signs)
    }
