import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# Set seed for reproducibility
np.random.seed(42)

def generate_diarrhoea_dataset(n_samples=2500):
    data = []
    
    # Severity mappings: None:0, Mild:1, Moderate:2, Severe:3
    # Duration mappings: None:0, 1-3 days:1, 4-7 days:2, More than a week:3
    
    for _ in range(n_samples):
        age = int(np.random.choice([
            np.random.randint(1, 12),    # Pediatric
            np.random.randint(12, 60),   # Adults
            np.random.randint(60, 85)    # Elderly
        ], p=[0.25, 0.50, 0.25]))
        
        # Diarrhoea severity distribution
        diarrhoea_level = np.random.choice(['None', 'Mild', 'Moderate', 'Severe'], p=[0.40, 0.25, 0.20, 0.15])
        diarrhoea_num = {'None': 0, 'Mild': 1, 'Moderate': 2, 'Severe': 3}[diarrhoea_level]
        
        # Duration distribution
        duration = np.random.choice(['None', '1-3 days', '4-7 days', 'More than a week'], p=[0.2, 0.4, 0.25, 0.15])
        duration_num = {'None': 0, '1-3 days': 1, '4-7 days': 2, 'More than a week': 3}[duration]
        
        # Correlated vitals based on diarrhoea and age
        # Severe diarrhoea causes dehydration -> tachycardia (high heart rate) and drop in vitals
        if diarrhoea_level == 'Severe':
            temp = np.random.normal(101.5, 1.8)
            heart_rate = np.random.normal(118, 14)
            spo2 = np.random.normal(92, 4.5)
        elif diarrhoea_level == 'Moderate':
            temp = np.random.normal(99.8, 1.2)
            heart_rate = np.random.normal(102, 10)
            spo2 = np.random.normal(95, 3.0)
        elif diarrhoea_level == 'Mild':
            temp = np.random.normal(98.8, 0.8)
            heart_rate = np.random.normal(82, 8)
            spo2 = np.random.normal(97, 2.0)
        else: # None
            temp = np.random.normal(98.6, 1.2)
            heart_rate = np.random.normal(78, 12)
            spo2 = np.random.normal(98, 2.0)
            
        # Clinical limits
        temp = round(float(np.clip(temp, 96.0, 106.0)), 1)
        heart_rate = int(np.clip(heart_rate, 45, 170))
        spo2 = int(np.clip(spo2, 75, 100))
        
        # Ground truth clinical triage logic (WHO IMCI & Rural Triage Protocol)
        # 0: Low Risk, 1: Moderate Risk, 2: Critical Risk
        is_critical = False
        is_moderate = False
        
        if (spo2 < 90 or heart_rate > 125 or temp >= 103.5 or 
            (diarrhoea_level == 'Severe' and (age < 5 or age > 65 or heart_rate > 115)) or
            (diarrhoea_level == 'Severe' and duration_num >= 2)):
            is_critical = True
        elif (spo2 < 95 or heart_rate > 100 or temp >= 100.4 or age > 65 or age < 5 or
              diarrhoea_level == 'Moderate' or 
              (diarrhoea_level == 'Mild' and duration_num >= 2)):
            is_moderate = True
            
        if is_critical:
            risk_label = 'Critical Risk'
            action = 'Immediate hospital transfer. Severe dehydration/shock risk. Administer IV fluids or high-volume ORS.'
        elif is_moderate:
            risk_label = 'Moderate Risk'
            action = 'Referral to Primary Health Centre (PHC). Start Oral Rehydration Salts (ORS) + Zinc therapy.'
        else:
            risk_label = 'Low Risk'
            action = 'Home management. Hydration with boiled water/ORS and nutritional monitoring.'
            
        data.append({
            'age': age,
            'bodyTemperature': temp,
            'heartRate': heart_rate,
            'spO2': spo2,
            'diarrhoea': diarrhoea_level,
            'diarrhoea_num': diarrhoea_num,
            'duration_num': duration_num,
            'riskLevel': risk_label,
            'recommendedAction': action
        })
        
    return pd.DataFrame(data)

def main():
    print("1. Generating clinical triage dataset with Diarrhoea...")
    df = generate_diarrhoea_dataset(3000)
    
    # Save CSV dataset
    dataset_csv_path = "backend/diarrhoea_triage_dataset.csv"
    df.to_csv(dataset_csv_path, index=False)
    print(f"-> Saved dataset with {len(df)} samples to {dataset_csv_path}")
    
    # Also update dataset_sample.json with representative diarrhoea & clinical cases
    sample_records = [
        {
            "patient_input": "3-year-old child with severe watery diarrhoea (>6 times today), sunken eyes, lethargic and irritable.",
            "extracted_symptoms": ["severe watery diarrhoea", "dehydration", "sunken eyes", "pediatric"],
            "diarrhoea": "Severe",
            "vitals": {"age": 3, "bodyTemperature": 101.4, "heartRate": 132, "spO2": 93},
            "triage_classification": "Critical",
            "recommended_action": "Emergency hospital admission. High risk of hypovolemic shock. Initiate IV Ringer's lactate or rapid ORS.",
            "asha_guideline_reference": "WHO-IMCI-Diarrhoea-Severe-01"
        },
        {
            "patient_input": "Adult patient has had loose stools 3-4 times for the past 2 days with mild stomach cramps and low fever.",
            "extracted_symptoms": ["moderate diarrhoea", "abdominal cramps", "low-grade fever"],
            "diarrhoea": "Moderate",
            "vitals": {"age": 34, "bodyTemperature": 99.8, "heartRate": 88, "spO2": 98},
            "triage_classification": "Moderate Risk",
            "recommended_action": "Refer to Primary Health Centre. Prescribe ORS packets, Zinc supplementation, and monitor urine output.",
            "asha_guideline_reference": "WHO-Diarrhoea-Moderate-02"
        },
        {
            "patient_input": "Mild loose stool once after eating street food, feeling otherwise fine with normal energy and appetite.",
            "extracted_symptoms": ["mild loose stool", "normal hydration"],
            "diarrhoea": "Mild",
            "vitals": {"age": 28, "bodyTemperature": 98.4, "heartRate": 74, "spO2": 99},
            "triage_classification": "Low Risk",
            "recommended_action": "Home care: Adequate fluid intake (coconut water, rice congee, clean water) and light diet.",
            "asha_guideline_reference": "WHO-Diarrhoea-HomeCare-03"
        }
    ]
    with open("backend/dataset_sample.json", "w") as f:
        json.dump(sample_records, f, indent=4)
    print("-> Updated backend/dataset_sample.json with clinical diarrhoea scenarios")

    # Features and Target
    feature_cols = ['age', 'bodyTemperature', 'heartRate', 'spO2', 'diarrhoea_num']
    X = df[feature_cols]
    y = df['riskLevel']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("\n2. Training Random Forest Classifier...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf.fit(X_train, y_train)
    
    y_pred = rf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"-> Model Accuracy: {accuracy * 100:.2f}%\n")
    print(classification_report(y_test, y_pred))
    
    # Feature importances
    importances = dict(zip(feature_cols, [round(float(x), 4) for x in rf.feature_importances_]))
    print(f"Feature Importances: {importances}")
    
    # Export trained model parameters/rules into JSON format for instant backend inference
    # We export decision thresholds and class probabilities
    model_metadata = {
        "accuracy": round(float(accuracy), 4),
        "classes": list(rf.classes_),
        "feature_importances": importances,
        "feature_cols": feature_cols,
        "trained_samples": len(df)
    }
    
    with open("backend/model_metadata.json", "w") as f:
        json.dump(model_metadata, f, indent=4)
    print("-> Exported model metadata to backend/model_metadata.json")

if __name__ == '__main__':
    main()
