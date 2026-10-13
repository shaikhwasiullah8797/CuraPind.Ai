import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/GlassCard';
import PPGScanner from '../../components/PPGScanner';
import api from '../../api';
import { User, Activity, Thermometer, Clock, ArrowRight, HeartPulse, Camera, AlertCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { calculateTriageRisk } from '../../utils/triageEngine';

const MultiStepForm = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    bodyTemperature: '',
    heartRate: '',
    spO2: '',
    bloodPressure: '',
    diarrhoea: 'None',
    symptoms: {
      fever: 'none',
      cough: 'none',
      breathlessness: 'none',
      body_pain: 'none',
      diarrhoea: 'none'
    },
    durationOfSymptoms: 'None'
  });
  
  const [showScanner, setShowScanner] = useState(false);

  const handleChange = (e) => {
    setSubmissionError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
 
  const submitForm = async () => {
    setSubmissionError('');
    setLoading(true);

    const safeAge = parseInt(formData.age, 10) || 30;
    const safeTemp = parseFloat(formData.bodyTemperature) || 98.6;
    const safeHeart = parseInt(formData.heartRate, 10) || 75;
    const safeSpO2 = parseInt(formData.spO2, 10) || 98;
    const patientName = formData.patientName || user?.name || 'Self';
    const bloodPressure = formData.bloodPressure || '120/80';
    const diarrhoea = formData.diarrhoea || 'None';

    const payload = {
      ...formData,
      patientName,
      age: safeAge,
      bodyTemperature: safeTemp,
      heartRate: safeHeart,
      spO2: safeSpO2,
      bloodPressure,
      diarrhoea
    };

    try {
      // 1. Try sending to backend server
      const res = await api.post('/health/predict', payload);
      if (res && res.data) {
        // Also cache locally in case offline
        const localHistory = JSON.parse(localStorage.getItem('curapind_reports') || '[]');
        localHistory.unshift(res.data);
        localStorage.setItem('curapind_reports', JSON.stringify(localHistory.slice(0, 30)));

        navigate('/result', { state: { result: res.data } });
        return;
      }
    } catch (err) {
      console.warn('Backend prediction endpoint unreachable or returned error, using local AI engine:', err);
      
      // 2. Resilient Fallback: Run clinical Random Forest engine in browser
      const prediction = calculateTriageRisk({
        age: safeAge,
        bodyTemperature: safeTemp,
        heartRate: safeHeart,
        spO2: safeSpO2,
        diarrhoea
      });

      const fallbackReport = {
        _id: 'rep_' + Date.now() + Math.random().toString(36).substring(2, 7),
        id: 'rep_' + Date.now(),
        user: user?.id || 'guest',
        patientName,
        age: safeAge,
        bodyTemperature: safeTemp,
        heartRate: safeHeart,
        spO2: safeSpO2,
        bloodPressure,
        diarrhoea,
        symptoms: formData.symptoms,
        durationOfSymptoms: formData.durationOfSymptoms,
        riskLevel: prediction.riskLevel,
        confidenceScore: prediction.confidenceScore,
        recommendedAction: prediction.recommendedAction,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage so History page always has it
      const localHistory = JSON.parse(localStorage.getItem('curapind_reports') || '[]');
      localHistory.unshift(fallbackReport);
      localStorage.setItem('curapind_reports', JSON.stringify(localHistory.slice(0, 30)));

      navigate('/result', { state: { result: fallbackReport } });
      return;
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (!formData.age) {
      setSubmissionError('Please enter an age to proceed.');
      return;
    }
    setSubmissionError('');
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setSubmissionError('');
    setStep(prev => prev - 1);
  };

  return (
    <GlassCard className="animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Health Check & Triage</h2>
          <p className="text-xs text-white/60">AI Clinical Risk Prediction</p>
        </div>
        <span className="text-white/80 font-semibold bg-white/10 px-3 py-1 rounded-full text-xs">Step {step} of 2</span>
      </div>

      {submissionError && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl mb-4 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-400" />
          {submissionError}
        </div>
      )}

      {/* Step 1: Basic Stats */}
      {step === 1 && (
        <div className="space-y-5 animate-[slideInRight_0.4s_ease-out]">
          
          {user?.role === 'Health Worker' && (
            <div>
              <div className="flex items-center text-white mb-2">
                <User className="w-5 h-5 mr-2 text-emerald-400" />
                <label className="text-sm font-medium">Patient Name</label>
              </div>
              <input 
                type="text" 
                name="patientName" 
                className="glass-input text-lg" 
                placeholder="e.g. Ramesh Kumar" 
                value={formData.patientName} 
                onChange={handleChange} 
              />
            </div>
          )}

          <div>
            <div className="flex items-center text-white mb-2">
              <User className="w-5 h-5 mr-2 text-indigo-300" />
              <label className="text-sm font-medium">{user?.role === 'Health Worker' ? "Patient's Age *" : "Age *"}</label>
            </div>
            <input 
              type="number" 
              name="age" 
              min="1" 
              max="120"
              className="glass-input text-lg" 
              placeholder="e.g. 45" 
              value={formData.age} 
              onChange={handleChange} 
              required
            />
          </div>

          <div>
            <div className="flex items-center text-white mb-2">
              <Clock className="w-5 h-5 mr-2 text-indigo-300" />
              <label className="text-sm font-medium">Duration of Symptoms</label>
            </div>
            <select 
              name="durationOfSymptoms" 
              className="glass-input text-white bg-slate-900/60 outline-none border border-white/20 focus:ring focus:ring-blue-500" 
              value={formData.durationOfSymptoms} 
              onChange={handleChange}
            >
              <option value="None" className="text-white bg-slate-900">None / Routine Check</option>
              <option value="1-3 days" className="text-white bg-slate-900">1-3 days</option>
              <option value="4-7 days" className="text-white bg-slate-900">4-7 days</option>
              <option value="More than a week" className="text-white bg-slate-900">More than a week</option>
            </select>
          </div>

          <button 
            disabled={!formData.age} 
            onClick={nextStep} 
            className="glass-button w-full flex justify-center items-center font-semibold mt-4 disabled:opacity-50 transition-opacity"
          >
            Next Step <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      )}

      {/* Step 2: Vitals */}
      {step === 2 && (
        <div className="space-y-4 animate-[slideInRight_0.4s_ease-out]">
          
          {showScanner ? (
             <PPGScanner 
                onCancel={() => setShowScanner(false)} 
                onComplete={(data) => {
                    setFormData(prev => ({ 
                        ...prev, 
                        heartRate: String(data.heartRate), 
                        spO2: String(data.spO2), 
                        bloodPressure: data.bloodPressure,
                        bodyTemperature: prev.bodyTemperature || '98.6'
                    }));
                    setShowScanner(false);
                }} 
             />
          ) : (
            <>
              <button 
                 type="button"
                 onClick={() => setShowScanner(true)}
                 className="w-full flex items-center justify-center p-3.5 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-400/50 hover:bg-indigo-600/40 rounded-xl text-white font-semibold transition-all mb-4 shadow-lg group"
              >
                  <Camera className="w-5 h-5 mr-2 text-indigo-300 group-hover:scale-110 transition-transform" />
                  Auto-Scan Vitals via Camera (PPG)
              </button>

              <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/20"></div>
                  <span className="flex-shrink-0 mx-4 text-white/50 text-xs font-semibold tracking-wider">OR ENTER VITALS MANUALLY</span>
                  <div className="flex-grow border-t border-white/20"></div>
              </div>

              <div>
                <div className="flex items-center text-white mb-1.5 mt-2">
                  <Thermometer className="w-4 h-4 mr-2 text-red-300" />
                  <label className="text-sm font-medium">Body Temperature (°F) *</label>
                </div>
                <input 
                  type="number" 
                  step="0.1" 
                  name="bodyTemperature" 
                  className="glass-input" 
                  placeholder="e.g. 98.6" 
                  value={formData.bodyTemperature} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <div className="flex items-center text-white mb-1.5 mt-3">
                  <HeartPulse className="w-4 h-4 mr-2 text-rose-400" />
                  <label className="text-sm font-medium">Heart Rate (bpm) *</label>
                </div>
                <input 
                  type="number" 
                  name="heartRate" 
                  className="glass-input" 
                  placeholder="e.g. 72" 
                  value={formData.heartRate} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <div className="flex items-center text-white mb-1.5 mt-3">
                  <Activity className="w-4 h-4 mr-2 text-cyan-300" />
                  <label className="text-sm font-medium">Oxygen Saturation (SpO2 %) *</label>
                </div>
                <input 
                  type="number" 
                  name="spO2" 
                  min="50"
                  max="100"
                  className="glass-input" 
                  placeholder="e.g. 98" 
                  value={formData.spO2} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <div className="flex items-center text-white mb-1.5 mt-3">
                  <Activity className="w-4 h-4 mr-2 text-purple-300" />
                  <label className="text-sm font-medium">Blood Pressure (Optional)</label>
                </div>
                <input 
                  type="text" 
                  name="bloodPressure" 
                  className="glass-input" 
                  placeholder="e.g. 120/80" 
                  value={formData.bloodPressure || ''} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <div className="flex items-center text-white mb-1.5 mt-3">
                  <Activity className="w-4 h-4 mr-2 text-amber-300" />
                  <label className="text-sm font-medium">Diarrhoea / Loose Stool</label>
                </div>
                <select 
                  name="diarrhoea" 
                  className="glass-input text-white bg-slate-900/60 outline-none border border-white/20 focus:ring focus:ring-blue-500" 
                  value={formData.diarrhoea || 'None'} 
                  onChange={handleChange}
                >
                  <option value="None" className="text-white bg-slate-900">None</option>
                  <option value="Mild" className="text-white bg-slate-900">Mild (1-2 loose stools/day)</option>
                  <option value="Moderate" className="text-white bg-slate-900">Moderate (3-5 stools/day, mild dehydration)</option>
                  <option value="Severe" className="text-white bg-slate-900">Severe (&gt;5 stools/day, acute watery)</option>
                </select>
              </div>
            </>
          )}

          {!showScanner && (
            <div className="flex space-x-3 pt-4">
              <button 
                type="button" 
                onClick={prevStep} 
                className="glass-button w-1/3 bg-transparent border border-white/30 text-white/90 font-medium"
              >
                Back
              </button>
              <button 
                type="button"
                disabled={loading || !formData.bodyTemperature || !formData.heartRate || !formData.spO2} 
                onClick={submitForm} 
                className="glass-button w-2/3 flex justify-center items-center font-semibold disabled:opacity-50"
              >
                {loading ? 'Evaluating Triage...' : 'Get Prediction'}
              </button>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
};

export default MultiStepForm;
