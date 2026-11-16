"""
CuraPind AI v2.0 - Automated Clinical Case Verification Suite
Tests the 4 required clinical scenarios:
1. Normal Case: Temp 98.6°F, HR 78, SpO2 98%, RR 16 -> Low Risk
2. Silent Hypoxia Trap: Temp 98.8°F, HR 106, SpO2 90%, Age 65 -> Critical Risk (SHAP flags SpO2 & Elderly Risk)
3. Early Sepsis / Dehydration: Temp 100.8°F, HR 118, BP 92/60 (Shock Index 1.28), Moderate Diarrhoea (>3 days) -> Critical Risk
4. Outbreak Cluster Trigger: 5 entries from the same village triggering a BMO alert.
"""

import sys
import os
import json
import subprocess

# Ensure backend directory is in path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from feature_engineering import (
    parse_blood_pressure,
    compute_shock_index,
    compute_map,
    compute_tachypnea_hypoxia_index,
    compute_dehydration_severity,
    compute_elderly_hypoxia_risk,
    extract_clinical_features
)
from explainer import ClinicalExplainer

def evaluate_via_node(payload):
    """
    Evaluates a triage payload using the exact JavaScript logic from backend/routes/health.js.
    """
    node_script = f"""
    const path = require('path');
    const health = require('{BACKEND_DIR.replace('\\', '/')}/routes/health.js');
    
    // Test the predictRisk function directly
    const express = require('express');
    const dbStore = require('{BACKEND_DIR.replace('\\', '/')}/dbStore.js');
    
    // Extract predictRisk from router or re-create call
    // We make a dummy request handler test
    const req = {{
        user: {{ id: 'test_verifier' }},
        body: {json.dumps(payload)}
    }};
    
    let resData = null;
    const res = {{
        json: (data) => {{ resData = data; }},
        status: () => ({{ json: (d) => {{ resData = d; }} }})
    }};
    
    const route = health.stack.find(s => s.route && s.route.path === '/predict' && s.route.methods.post);
    if (route) {{
        // Bypass auth middleware by calling handler directly (last function in stack)
        const handler = route.route.stack[route.route.stack.length - 1].handle;
        handler(req, res).then(() => {{
            console.log(JSON.stringify(resData));
        }}).catch(err => {{
            console.error(err);
            process.exit(1);
        }});
    }} else {{
        console.error("Route /predict not found");
        process.exit(1);
    }}
    """
    
    proc = subprocess.run(
        ["node", "-e", node_script],
        capture_output=True,
        text=True,
        cwd=BACKEND_DIR
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Node execution failed: {proc.stderr}")
    return json.loads(proc.stdout.strip())

def main():
    print("=" * 70)
    print("CuraPind AI v2.0 - Clinical Triage Automated Verification")
    print("=" * 70)

    all_passed = True
    results_summary = []

    # =========================================================================
    # Test 1: Normal Healthy Case
    # Temp 98.6°F, HR 78, SpO2 98%, RR 16 -> Low Risk
    # =========================================================================
    print("\n[TEST 1] Normal Baseline Case:")
    print("Inputs: Temp 98.6°F, HR 78 bpm, SpO2 98%, RR 16 bpm, Age 30")

    case1_payload = {
        'patientName': 'Ravi Kumar',
        'age': 30,
        'bodyTemperature': 98.6,
        'heartRate': 78,
        'spO2': 98,
        'respiratoryRate': 16,
        'bloodPressure': '',
        'diarrhoea': 'None',
        'durationOfSymptoms': 'None'
    }

    res1 = evaluate_via_node(case1_payload)
    print(f"-> Predicted Risk Level: {res1.get('riskLevel')}")
    print(f"-> Confidence Score:    {res1.get('confidenceScore')}%")
    print(f"-> Recommended Action:   {res1.get('recommendedAction')}")

    passed1 = (res1.get('riskLevel') == 'Low Risk')
    if passed1:
        print("RESULT: PASS [Low Risk correctly assigned]")
    else:
        print(f"RESULT: FAIL [Expected 'Low Risk', got '{res1.get('riskLevel')}']")
        all_passed = False
    results_summary.append(("Test 1: Normal Baseline Case", passed1))

    # =========================================================================
    # Test 2: Silent Hypoxia Trap
    # Temp 98.8°F, HR 106, SpO2 90%, Age 65 -> Critical Risk
    # Top SHAP drivers must flag SpO2 and Elderly Risk
    # =========================================================================
    print("\n[TEST 2] Silent Hypoxia Trap (Elderly Patient with Normal Temp but SpO2 90%):")
    print("Inputs: Temp 98.8°F, HR 106 bpm, SpO2 90%, Age 65")

    case2_payload = {
        'patientName': 'Sita Devi',
        'age': 65,
        'bodyTemperature': 98.8,
        'heartRate': 106,
        'spO2': 90,
        'respiratoryRate': 24,
        'bloodPressure': '120/80',
        'diarrhoea': 'None',
        'durationOfSymptoms': '> 3 Days'
    }

    res2 = evaluate_via_node(case2_payload)
    print(f"-> Predicted Risk Level: {res2.get('riskLevel')}")
    print(f"-> Confidence Score:    {res2.get('confidenceScore')}%")
    print(f"-> Action:               {res2.get('recommendedAction')}")

    drivers2 = res2.get('riskDrivers', [])
    driver_labels2 = [d.get('label', '') for d in drivers2]
    print("-> Risk Drivers (Explainability):")
    for d in drivers2:
        print(f"   • {d.get('label')}")

    # Check SpO2 and Elderly Risk in drivers
    has_spo2_driver = any('SpO2' in lbl or 'Hypoxia' in lbl for lbl in driver_labels2)
    has_elderly_driver = any('Elderly' in lbl or 'Age' in lbl for lbl in driver_labels2)

    passed2 = (res2.get('riskLevel') == 'Critical Risk') and has_spo2_driver and has_elderly_driver
    if passed2:
        print("RESULT: PASS [Critical Risk correctly detected + SHAP drivers flag SpO2 and Elderly Risk]")
    else:
        print(f"RESULT: FAIL [Risk: {res2.get('riskLevel')}, SpO2 driver: {has_spo2_driver}, Elderly driver: {has_elderly_driver}]")
        all_passed = False
    results_summary.append(("Test 2: Silent Hypoxia Trap", passed2))

    # =========================================================================
    # Test 3: Early Sepsis / Dehydration Shock
    # Temp 100.8°F, HR 118, BP 92/60 (Shock Index 1.28), Moderate Diarrhoea (>3 days) -> Critical Risk
    # =========================================================================
    print("\n[TEST 3] Early Sepsis / Severe Dehydration Shock:")
    print("Inputs: Temp 100.8°F, HR 118 bpm, BP 92/60, Moderate Diarrhoea, >3 Days, Age 52")

    case3_payload = {
        'patientName': 'Mohan Lal',
        'age': 52,
        'bodyTemperature': 100.8,
        'heartRate': 118,
        'spO2': 96,
        'bloodPressure': '92/60',
        'diarrhoea': 'Moderate',
        'symptomProgression': '> 3 Days',
        'whoDangerSigns': ['Unable to Drink / Severe Dehydration']
    }

    res3 = evaluate_via_node(case3_payload)
    print(f"-> Predicted Risk Level: {res3.get('riskLevel')}")
    print(f"-> Shock Index Computed: {res3.get('computedFeatures', {}).get('shockIndex')}")
    print(f"-> Dehydration Score:    {res3.get('computedFeatures', {}).get('dehydrationScore')}")
    print(f"-> Action:               {res3.get('recommendedAction')}")

    drivers3 = res3.get('riskDrivers', [])
    print("-> Risk Drivers (Explainability):")
    for d in drivers3:
        print(f"   • {d.get('label')}")

    shock_index_val = res3.get('computedFeatures', {}).get('shockIndex', 0)
    passed3 = (res3.get('riskLevel') == 'Critical Risk') and (abs(shock_index_val - 1.28) < 0.05)
    if passed3:
        print("RESULT: PASS [Critical Risk correctly detected with Shock Index 1.28]")
    else:
        print(f"RESULT: FAIL [Risk: {res3.get('riskLevel')}, Shock Index: {shock_index_val}]")
        all_passed = False
    results_summary.append(("Test 3: Early Sepsis / Dehydration", passed3))

    # =========================================================================
    # Test 4: BMO Outbreak Cluster Trigger
    # 5 entries from the same village within 48h triggering alert
    # =========================================================================
    print("\n[TEST 4] BMO Outbreak Cluster Trigger (Village Level Surveillance):")
    print("Injecting 5 acute cases from village 'Chandpur'...")

    # Log 5 cases into server dbStore
    cluster_script = f"""
    const health = require('{BACKEND_DIR.replace('\\', '/')}/routes/health.js');
    const dbStore = require('{BACKEND_DIR.replace('\\', '/')}/dbStore.js');

    // Add 5 acute entries for Chandpur
    for (let i = 0; i < 5; i++) {{
        dbStore.reports.unshift({{
            _id: 'test_rep_' + i,
            villageName: 'chandpur',
            bodyTemperature: 101.4 + (i * 0.2),
            heartRate: 110,
            spO2: 95,
            diarrhoea: 'Severe',
            respiratoryRate: 24,
            riskLevel: 'Critical Risk',
            createdAt: new Date().toISOString()
        }});
    }}

    // Call GET /surveillance route handler
    const req = {{ query: {{ hours: '48' }} }};
    let out = null;
    const res = {{
        json: (data) => {{ out = data; }}
    }};

    const route = health.stack.find(s => s.route && s.route.path === '/surveillance' && s.route.methods.get);
    const handler = route.route.stack[route.route.stack.length - 1].handle;
    handler(req, res).then(() => {{
        console.log(JSON.stringify(out));
    }});
    """

    proc4 = subprocess.run(
        ["node", "-e", cluster_script],
        capture_output=True,
        text=True,
        cwd=BACKEND_DIR
    )
    surv_res = json.loads(proc4.stdout.strip())
    chandpur_data = next((v for v in surv_res.get('villages', []) if v.get('villageName') == 'chandpur'), None)

    print(f"-> Chandpur Surveillance Record: {chandpur_data}")
    is_outbreak = chandpur_data and chandpur_data.get('isOutbreak', False)
    case_count = chandpur_data.get('totalCases', 0) if chandpur_data else 0

    passed4 = is_outbreak and case_count >= 5
    if passed4:
        print(f"RESULT: PASS [Outbreak Cluster successfully triggered with {case_count} cases in 48h]")
    else:
        print(f"RESULT: FAIL [Outbreak triggered: {is_outbreak}, Count: {case_count}]")
        all_passed = False
    results_summary.append(("Test 4: BMO Outbreak Cluster Trigger", passed4))

    # =========================================================================
    # Final Scorecard
    # =========================================================================
    print("\n" + "=" * 70)
    print("FINAL CLINICAL VERIFICATION SCORECARD")
    print("=" * 70)
    for name, status in results_summary:
        status_str = "PASS" if status else "FAIL"
        print(f"[{status_str:4s}] {name}")

    if all_passed:
        print("\nALL 4 CLINICAL VERIFICATION TESTS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\nSOME TESTS FAILED.")
        sys.exit(1)

if __name__ == '__main__':
    main()
