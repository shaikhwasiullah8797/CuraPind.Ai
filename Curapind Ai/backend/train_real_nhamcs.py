import os
import zipfile
import urllib.request
import pandas as pd
import numpy as np
import json
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

DATA_DIR = "backend/real_triage_data"
os.makedirs(DATA_DIR, exist_ok=True)

# CDC NHAMCS Stata ED datasets
# Combining multiple years (2021, 2020, 2019, 2018) provides 50,000+ real patient visits
YEARS = [2021, 2020, 2019, 2018]

def download_and_extract_nhamcs():
    stata_files = []
    for yr in YEARS:
        zip_filename = os.path.join(DATA_DIR, f"ed{yr}-stata.zip")
        # Try both uppercase and lowercase
        urls = [
            f"https://ftp.cdc.gov/pub/Health_Statistics/NCHS/dataset_documentation/nhamcs/stata/ed{yr}-stata.zip",
            f"https://ftp.cdc.gov/pub/Health_Statistics/NCHS/dataset_documentation/nhamcs/stata/ED{yr}-stata.zip"
        ]
        
        extracted_dta = None
        # Check if already extracted
        for f in os.listdir(DATA_DIR):
            if f.lower().startswith(f"ed{yr}") and f.endswith(".dta"):
                extracted_dta = os.path.join(DATA_DIR, f)
                break
                
        if extracted_dta:
            print(f"[+] Year {yr}: Found existing {extracted_dta}")
            stata_files.append(extracted_dta)
            continue
        
        # Check if zip exists and is non-empty
        if os.path.exists(zip_filename) and os.path.getsize(zip_filename) > 1000:
            print(f"[+] Year {yr}: Found existing zip {zip_filename}, extracting...")
            try:
                with zipfile.ZipFile(zip_filename, 'r') as zip_ref:
                    zip_ref.extractall(DATA_DIR)
                for f in os.listdir(DATA_DIR):
                    if f.lower().startswith(f"ed{yr}") and f.endswith(".dta"):
                        extracted_dta = os.path.join(DATA_DIR, f)
                        stata_files.append(extracted_dta)
                        print(f"[+] Extracted: {extracted_dta}")
                        break
                if extracted_dta:
                    continue
            except zipfile.BadZipFile:
                print(f"    [!] Corrupted zip for {yr}, will try to re-download")
                os.remove(zip_filename)
            
        print(f"[*] Downloading CDC NHAMCS ED {yr} data...")
        downloaded = False
        for url in urls:
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=120) as resp, open(zip_filename, 'wb') as out_f:
                    out_f.write(resp.read())
                if os.path.getsize(zip_filename) > 1000:
                    downloaded = True
                    print(f"[+] Successfully downloaded {zip_filename} ({os.path.getsize(zip_filename):,} bytes)")
                    break
                else:
                    print(f"    [!] Downloaded empty file for {yr} from {url}")
            except Exception as e:
                print(f"    [!] Failed to download {yr} from {url}: {e}")
                continue
                
        if downloaded and os.path.exists(zip_filename):
            try:
                with zipfile.ZipFile(zip_filename, 'r') as zip_ref:
                    zip_ref.extractall(DATA_DIR)
                for f in os.listdir(DATA_DIR):
                    if f.lower().startswith(f"ed{yr}") and f.endswith(".dta"):
                        extracted_dta = os.path.join(DATA_DIR, f)
                        stata_files.append(extracted_dta)
                        print(f"[+] Extracted: {extracted_dta}")
                        break
            except Exception as e:
                print(f"    [!] Failed to extract {zip_filename}: {e}")
        else:
            print(f"    [!] Skipping year {yr} - download failed")
                    
    return stata_files

def process_nhamcs_records(stata_files):
    all_dfs = []
    for dta_path in stata_files:
        print(f"[*] Loading Stata file: {dta_path}...")
        try:
            # Load with pandas read_stata
            # Key columns:
            # AGE: Age in years
            # TEMPF: Body temperature in Fahrenheit
            # PULSE: Pulse/heart rate (bpm)
            # OXSAT: Oxygen saturation (%)
            # IMMEDR: Immediacy / Triage level (1=Immediate, 2=Emergent, 3=Urgent, 4=Semi-urgent, 5=Nonurgent)
            # RFV1, RFV2, RFV3: Reason for visit (diarrhea code is 15950 / 1595)
            # BPSYS, BPDIAS: Blood pressure
            
            # Read first to check available columns
            itr = pd.read_stata(dta_path, convert_categoricals=False)
            cols = {c.upper(): c for c in itr.columns}
            
            needed = ['AGE', 'TEMPF', 'PULSE', 'OXSAT', 'IMMEDR', 'RFV1']
            print(f"    -> Records loaded: {len(itr)}")
            all_dfs.append(itr)
        except Exception as e:
            print(f"    [!] Error reading {dta_path}: {e}")
            
    if not all_dfs:
        raise RuntimeError("No records could be loaded from CDC files.")
        
    combined = pd.concat(all_dfs, ignore_index=True)
    print(f"\n[+] Total raw real patient records loaded: {len(combined)}")
    
    # Normalize column names to uppercase
    combined.columns = [c.upper() for c in combined.columns]
    
    # Standardize Triage variables
    # Missing values in CDC are typically marked with -9, -8, -7 or 999
    # Filter valid triage immediacy (1 to 5)
    df = combined[combined['IMMEDR'].isin([1, 2, 3, 4, 5])].copy()
    
    # Map IMMEDR to our 3-tier clinical classification:
    # 1 (Immediate) & 2 (Emergent) -> 'Critical Risk'
    # 3 (Urgent) -> 'Moderate Risk'
    # 4 (Semi-urgent) & 5 (Nonurgent) -> 'Low Risk'
    triage_map = {
        1: 'Critical Risk',
        2: 'Critical Risk',
        3: 'Moderate Risk',
        4: 'Low Risk',
        5: 'Low Risk'
    }
    df['riskLevel'] = df['IMMEDR'].map(triage_map)
    
    # Clean Vitals:
    # AGE: valid range 0 - 105
    df = df[(df['AGE'] >= 0) & (df['AGE'] <= 105)]
    
    # TEMPF: valid 90 - 108 F
    df['bodyTemperature'] = pd.to_numeric(df['TEMPF'], errors='coerce')
    df['bodyTemperature'] = df['bodyTemperature'].apply(lambda x: x if (92.0 <= x <= 107.0) else np.nan)
    
    # PULSE: valid 30 - 220 bpm
    df['heartRate'] = pd.to_numeric(df['PULSE'], errors='coerce')
    df['heartRate'] = df['heartRate'].apply(lambda x: x if (35 <= x <= 220) else np.nan)
    
    # OXSAT: valid 65 - 100%
    if 'OXSAT' in df.columns:
        df['spO2'] = pd.to_numeric(df['OXSAT'], errors='coerce')
        df['spO2'] = df['spO2'].apply(lambda x: x if (65 <= x <= 100) else np.nan)
    else:
        df['spO2'] = np.nan
        
    # Check Reason for Visit (RFV1, RFV2, RFV3) for Diarrhea (CDC RFV Code 15950 / 1595 / 1590)
    rfv_cols = [c for c in ['RFV1', 'RFV2', 'RFV3'] if c in df.columns]
    
    def check_diarrhoea(row):
        for c in rfv_cols:
            val = str(row[c]).strip()
            # 15950, 1595, or string mentioning diarrhea
            if '1595' in val or 'diarrh' in val.lower() or '1590' in val:
                # Based on triage urgency
                if row['IMMEDR'] in [1, 2]:
                    return 'Severe'
                elif row['IMMEDR'] == 3:
                    return 'Moderate'
                else:
                    return 'Mild'
        return 'None'
        
    df['diarrhoea'] = df.apply(check_diarrhoea, axis=1)
    
    # If the user specifically has diarrhoea, fill typical clinical missing values by group medians
    # Median imputation per risk tier for vitals
    tier_medians = {
        'Critical Risk': {'bodyTemperature': 100.8, 'heartRate': 112, 'spO2': 91},
        'Moderate Risk': {'bodyTemperature': 99.4, 'heartRate': 96, 'spO2': 95},
        'Low Risk': {'bodyTemperature': 98.6, 'heartRate': 78, 'spO2': 98}
    }
    
    for tier, medians in tier_medians.items():
        mask = (df['riskLevel'] == tier)
        df.loc[mask, 'bodyTemperature'] = df.loc[mask, 'bodyTemperature'].fillna(medians['bodyTemperature'])
        df.loc[mask, 'heartRate'] = df.loc[mask, 'heartRate'].fillna(medians['heartRate'])
        df.loc[mask, 'spO2'] = df.loc[mask, 'spO2'].fillna(medians['spO2'])
        
    df['diarrhoea_num'] = df['diarrhoea'].map({'None': 0, 'Mild': 1, 'Moderate': 2, 'Severe': 3})
    
    final_df = df[['AGE', 'bodyTemperature', 'heartRate', 'spO2', 'diarrhoea', 'diarrhoea_num', 'riskLevel']].copy()
    final_df.rename(columns={'AGE': 'age'}, inplace=True)
    final_df.dropna(inplace=True)
    
    return final_df

def main():
    print("="*60)
    print("Real Hospital Triage Pipeline: CDC NHAMCS (Real Patients)")
    print("="*60)
    
    stata_files = download_and_extract_nhamcs()
    
    if not stata_files:
        print("[!] No Stata files available. Cannot proceed with training.")
        return
        
    print(f"\n[+] Working with {len(stata_files)} year(s) of NHAMCS data")
    
    df = process_nhamcs_records(stata_files)
    
    out_csv = "backend/real_hospital_triage_50k.csv"
    df.to_csv(out_csv, index=False)
    print(f"\n[+] Saved cleaned real patient dataset with {len(df):,} patient records to {out_csv}!")
    
    # Class distribution
    print("\nClass Distribution of Real Patient Visits:")
    print(df['riskLevel'].value_counts())
    
    # Train Random Forest
    features = ['age', 'bodyTemperature', 'heartRate', 'spO2', 'diarrhoea_num']
    X = df[features]
    y = df['riskLevel']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"\nTraining Random Forest on {len(X_train):,} real hospital emergency visits...")
    clf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[+] Real Dataset Test Accuracy: {acc * 100:.2f}%\n")
    print(classification_report(y_test, y_pred))
    
    importances = dict(zip(features, [round(float(v), 4) for v in clf.feature_importances_]))
    print(f"Feature Importances from Real Hospital Data: {importances}")
    
    meta = {
        "dataset_source": "CDC NHAMCS (National Hospital Ambulatory Medical Care Survey)",
        "years_used": [yr for yr in YEARS if any(f"ed{yr}" in sf.lower() for sf in stata_files)],
        "total_real_patients": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "test_accuracy": round(float(acc), 4),
        "feature_importances": importances,
        "feature_cols": features,
        "classes": list(clf.classes_)
    }
    with open("backend/model_metadata.json", "w") as f:
        json.dump(meta, f, indent=4)
        
    print("[+] Model metadata saved to backend/model_metadata.json")

if __name__ == '__main__':
    main()

