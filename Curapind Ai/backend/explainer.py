"""
CuraPind AI v2.0 - SHAP Explainability & Top Risk Drivers
Uses shap.TreeExplainer if available, with a built-in exact Tree Path Attribution
fallback (Saabas algorithm) computed over all RandomForest decision trees.
"""

import numpy as np

# Feature display labels for rural clinical explainability
CLINICAL_FEATURE_LABELS = {
    'age': 'Patient Age',
    'bodyTemperature': 'Body Temperature',
    'heartRate': 'Tachycardia / Elevated HR',
    'spO2': 'Low Oxygen Saturation (SpO2)',
    'respiratoryRate': 'Elevated Respiratory Rate (Tachypnea)',
    'systolic_bp': 'Abnormal Systolic BP',
    'diastolic_bp': 'Abnormal Diastolic BP',
    'shock_index': 'Elevated Shock Index (HR / Systolic BP)',
    'map': 'Low Mean Arterial Pressure (MAP)',
    'tachypnea_hypoxia_index': 'Tachypnea-Hypoxia Index',
    'dehydration_score': 'Dehydration Severity Score',
    'elderly_hypoxia_risk': 'Elderly Hypoxia Vulnerability',
    'tachypnea_flag': 'WHO Tachypnea Threshold Exceeded',
    'acoustic_score': 'Abnormal Breath/Cough Acoustics',
    'diarrhoea_num': 'Acute Watery Diarrhoea',
    'danger_signs_count': 'WHO Danger Signs Count'
}

def format_plain_language_driver(feat_name, val, contribution):
    """
    Translates a feature value and contribution into an actionable medical statement.
    """
    if feat_name == 'shock_index':
        return f"High Shock Index ({val:.2f})"
    elif feat_name == 'spO2':
        return f"Low Oxygen Saturation ({int(val)}% SpO2)"
    elif feat_name == 'respiratoryRate':
        return f"Tachypnea ({int(val)} breaths/min)"
    elif feat_name == 'elderly_hypoxia_risk':
        return f"Elderly Hypoxia Risk ({val:.2f})"
    elif feat_name == 'dehydration_score':
        return f"Severe Dehydration (Score {val:.1f})"
    elif feat_name == 'tachypnea_hypoxia_index':
        return f"High Tachypnea-Hypoxia Index ({val:.2f})"
    elif feat_name == 'heartRate':
        return f"Tachycardia ({int(val)} bpm)"
    elif feat_name == 'bodyTemperature':
        return f"Fever ({val:.1f}°F)"
    elif feat_name == 'map':
        return f"Critically Low MAP ({val:.1f} mmHg)"
    elif feat_name == 'diarrhoea_num':
        severities = {0: 'None', 1: 'Mild', 2: 'Moderate', 3: 'Severe'}
        return f"{severities.get(int(val), 'Acute')} Diarrhoea"
    elif feat_name == 'danger_signs_count':
        return f"{int(val)} WHO Danger Signs Present"
    else:
        label = CLINICAL_FEATURE_LABELS.get(feat_name, feat_name)
        return f"{label} ({val:.2f})"

class ClinicalExplainer:
    def __init__(self, model, feature_names):
        self.model = model
        self.feature_names = list(feature_names)
        self.use_shap = False
        self.shap_explainer = None

        try:
            import shap
            # Initialize TreeExplainer
            self.shap_explainer = shap.TreeExplainer(model)
            self.use_shap = True
            print("SHAP TreeExplainer initialized successfully.")
        except Exception:
            # Native exact tree path attribution
            self.use_shap = False

    def explain_instance(self, feature_values_dict):
        """
        Computes per-feature contributions for a single patient instance.
        Returns top 3 plain-language clinical risk drivers.
        """
        # Create ordered feature vector
        x_vec = np.array([[feature_values_dict.get(f, 0.0) for f in self.feature_names]], dtype=float)

        contributions = np.zeros(len(self.feature_names), dtype=float)

        if self.use_shap and self.shap_explainer is not None:
            try:
                shap_vals = self.shap_explainer.shap_values(x_vec)
                # If binary/multiclass classification, take values for critical class (usually class index 0 or highest risk)
                # Check classes
                classes = list(self.model.classes_)
                crit_idx = classes.index('Critical Risk') if 'Critical Risk' in classes else -1
                if isinstance(shap_vals, list):
                    vals = shap_vals[crit_idx]
                elif len(shap_vals.shape) == 3:
                    vals = shap_vals[:, :, crit_idx]
                else:
                    vals = shap_vals
                contributions = np.abs(vals[0])
            except Exception:
                contributions = self._compute_tree_contributions(x_vec[0])
        else:
            contributions = self._compute_tree_contributions(x_vec[0])

        # Rank features by contribution
        ranked_indices = np.argsort(contributions)[::-1]
        top_drivers = []
        for idx in ranked_indices:
            feat_name = self.feature_names[idx]
            val = x_vec[0, idx]
            weight = float(contributions[idx])
            # Only include if feature has non-trivial positive contribution
            if weight > 0 or len(top_drivers) < 3:
                top_drivers.append({
                    'feature': feat_name,
                    'label': format_plain_language_driver(feat_name, val, weight),
                    'value': float(val),
                    'weight': round(weight, 4)
                })
            if len(top_drivers) >= 3:
                break

        return top_drivers

    def _compute_tree_contributions(self, x):
        """
        Exact Tree Path Attribution across all Random Forest estimators.
        At each internal node splitting on feature j, contribution is the change
        in class probability distribution towards Critical Risk between parent and child.
        """
        classes = list(self.model.classes_)
        crit_idx = classes.index('Critical Risk') if 'Critical Risk' in classes else 0
        contributions = np.zeros(len(self.feature_names), dtype=float)

        n_trees = len(self.model.estimators_)
        if n_trees == 0:
            return contributions

        for tree in self.model.estimators_:
            t = tree.tree_
            node = 0
            while t.children_left[node] != -1: # While not a leaf
                feature = t.feature[node]
                parent_val = t.value[node][0]
                parent_prob = parent_val[crit_idx] / np.sum(parent_val)

                if x[feature] <= t.threshold[node]:
                    child = t.children_left[node]
                else:
                    child = t.children_right[node]

                child_val = t.value[child][0]
                child_prob = child_val[crit_idx] / np.sum(child_val)

                # Positive shift towards critical risk
                diff = child_prob - parent_prob
                contributions[feature] += diff
                node = child

        # Average over trees
        contributions = contributions / n_trees
        # Normalize and ensure non-negative relevance for drivers
        return np.maximum(0, contributions)
