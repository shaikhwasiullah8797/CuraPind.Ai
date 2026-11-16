import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/GlassCard';
import PPGScanner from '../../components/PPGScanner';
import AcousticAnalyzer from '../../components/AcousticAnalyzer';
import WHOClinicalCard from '../../components/WHOClinicalCard';
import api from '../../api';
import { User, Activity, Thermometer, Clock, ArrowRight, HeartPulse, Camera, AlertCircle, MapPin, Volume2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { calculateTriageRisk } from '../../utils/triageEngine';
import { logTriageEntry } from '../../utils/triageSurveillance';

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
    durationOfSymptoms: 'None',
    // v2.0 fields
    villageName: '',
    respiratoryRate: 0,
    symptomProgression: 'None',
    whoDangerSigns: [],
    acousticScore: 0,
    acousticLabel: '',
    acousticConfidence: 0
  });
  
  const [showScanner, setShowScanner] = useState(false);
  const [showAcoustic, setShowAcoustic] = useState(false);

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
      diarrhoea,
      respiratoryRate: Number(formData.respiratoryRate) || 0,
      acousticScore: Number(formData.acousticScore) || 0,
      acousticLabel: formData.acousticLabel || '',
      symptomProgression: formData.symptomProgression || 'None',
      whoDangerSigns: formData.whoDangerSigns || [],
      villageName: formData.villageName || ''
    };

    try {
      // 1. Try sending to backend server
      const res = await api.post('/health/predict', payload);
      if (res && res.data) {
        const localHistory = JSON.parse(localStorage.getItem('curapind_reports') || '[]');
        localHistory.unshift(res.data);
        localStorage.setItem('curapind_reports', JSON.stringify(localHistory.slice(0, 30)));

        logTriageEntry({
          villageName: formData.villageName || 'Unknown',
          riskLevel: res.data.riskLevel,
          age: safeAge,
          bodyTemperature: safeTemp,
          diarrhoea,
          respiratoryRate: Number(formData.respiratoryRate) || 0,
          spO2: safeSpO2,
          whoDangerSigns: formData.whoDangerSigns || [],
          acousticLabel: formData.acousticLabel || ''
        });

        navigate('/result', { state: { result: res.data } });
        return;
      }
    } catch (err) {
      console.warn('Backend prediction unreachable, using local AI engine:', err);
      
      const prediction = calculateTriageRisk({
        age: safeAge,
        bodyTemperature: safeTemp,
        heartRate: safeHeart,
        spO2: safeSpO2,
        diarrhoea,
        bloodPressure,
        respiratoryRate: Number(formData.respiratoryRate) || 0,
        acousticScore: Number(formData.acousticScore) || 0,
        acousticLabel: formData.acousticLabel || '',
        symptomProgression: formData.symptomProgression || 'None',
        whoDangerSigns: formData.whoDangerSigns || []
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
        respiratoryRate: Number(formData.respiratoryRate) || 0,
        acousticScore: Number(formData.acousticScore) || 0,
        acousticLabel: formData.acousticLabel || '',
        symptomProgression: formData.symptomProgression || 'None',
        whoDangerSigns: formData.whoDangerSigns || [],
        villageName: formData.villageName || '',
        riskLevel: prediction.riskLevel,
        confidenceScore: prediction.confidenceScore,
        recommendedAction: prediction.recommendedAction,
        riskDrivers: prediction.riskDrivers || [],
        computedFeatures: prediction.computedFeatures || {},
        createdAt: new Date().toISOString()
      };

      const localHistory = JSON.parse(localStorage.getItem('curapind_reports') || '[]');
      localHistory.unshift(fallbackReport);
      localStorage.setItem('curapind_reports', JSON.stringify(localHistory.slice(0, 30)));

      logTriageEntry({
        villageName: formData.villageName || 'Unknown',
        riskLevel: prediction.riskLevel,
        age: safeAge,
        bodyTemperature: safeTemp,
        diarrhoea,
        respiratoryRate: Number(formData.respiratoryRate) || 0,
        spO2: safeSpO2,
        whoDangerSigns: formData.whoDangerSigns || [],
        acousticLabel: formData.acousticLabel || ''
      });

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
      <div className="flex justify-between items-center mb-6 border-b border-[#238C6E]/40 pb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-[#D2FF8F] animate-pulse"></span>
            <span className="text-[10px] uppercase font-bold text-[#D2FF8F] tracking-wider">CuraPind Clinical CDS</span>
          </div>
          <h2 className="text-xl font-bold text-[#F2F2F2] tracking-tight">Health Check & Triage</h2>
          <p className="text-xs text-[#a4b8ad]">AI Clinical Risk Prediction Engine</p>
        </div>
        <span className="text-[#D2FF8F] font-bold bg-[#29A683]/20 border border-[#29A683]/50 px-3 py-1 rounded-full text-xs font-mono">
          Step {step} of 2
        </span>
      </div>

      {submissionError && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl mb-4 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-400" />
          {submissionError}
        </div>
      )}

      {/* Step 1: Basic Demographics */}
      {step === 1 && (
        <div className="space-y-5 animate-[slideInRight_0.4s_ease-out]">
          
          {user?.role === 'Health Worker' && (
            <>
              <div>
                <div className="flex items-center text-[#F2F2F2] mb-1.5">
                  <User className="w-4 h-4 mr-2 text-[#29A683]" />
                  <label className="text-sm font-semibold">Patient Name</label>
                </div>
                <input 
                  type="text" 
                  name="patientName" 
                  className="glass-input text-base" 
                  placeholder="e.g. Ramesh Kumar" 
                  value={formData.patientName} 
                  onChange={handleChange} 
                />
              </div>

              {/* Village Name */}
              <div>
                <div className="flex items-center text-[#F2F2F2] mb-1.5">
                  <MapPin className="w-4 h-4 mr-2 text-[#29A683]" />
                  <label className="text-sm font-semibold">Village / Ward Name</label>
                </div>
                <input 
                  type="text" 
                  name="villageName" 
                  className="glass-input text-base" 
                  placeholder="e.g. Chandpur, Gram Panchayat Khaira" 
                  value={formData.villageName} 
                  onChange={handleChange} 
                />
              </div>
            </>
          )}

          <div>
            <div className="flex items-center text-[#F2F2F2] mb-1.5">
              <User className="w-4 h-4 mr-2 text-[#29A683]" />
              <label className="text-sm font-semibold">{user?.role === 'Health Worker' ? "Patient's Age *" : "Age *"}</label>
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
            <div className="flex items-center text-[#F2F2F2] mb-1.5">
              <Clock className="w-4 h-4 mr-2 text-[#29A683]" />
              <label className="text-sm font-semibold">Duration of Symptoms</label>
            </div>
            <select 
              name="durationOfSymptoms" 
              className="glass-input text-[#F2F2F2] bg-[#0d1d16] outline-none border border-[#238C6E]/60 focus:ring-2 focus:ring-[#D2FF8F]" 
              value={formData.durationOfSymptoms} 
              onChange={handleChange}
            >
              <option value="None" className="text-[#F2F2F2] bg-[#07120d]">None / Routine Check</option>
              <option value="1-3 days" className="text-[#F2F2F2] bg-[#07120d]">1-3 days</option>
              <option value="4-7 days" className="text-[#F2F2F2] bg-[#07120d]">4-7 days</option>
              <option value="More than a week" className="text-[#F2F2F2] bg-[#07120d]">More than a week</option>
            </select>
          </div>

          <button 
            disabled={!formData.age} 
            onClick={nextStep} 
            className="glass-button w-full flex justify-center items-center mt-6"
          >
            Next Step <ArrowRight className="w-5 h-5 ml-2 stroke-[2.5]" />
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
                        bodyTemperature: prev.bodyTemperature || '98.6'
                    }));
                    setShowScanner(false);
                }} 
             />
          ) : showAcoustic ? (
            <AcousticAnalyzer
              onCancel={() => setShowAcoustic(false)}
              onResult={(data) => {
                setFormData(prev => ({
                  ...prev,
                  acousticScore: data.score,
                  acousticLabel: data.label,
                  acousticConfidence: data.confidence
                }));
                setShowAcoustic(false);
              }}
            />
          ) : (
            <>
              {/* Camera Pulse & Acoustic Buttons with Mint / Teal Palette */}
              <div className="grid grid-cols-2 gap-2.5">
                <button 
                   type="button"
                   onClick={() => setShowScanner(true)}
                   className="flex items-center justify-center p-3 bg-[#0d1d16] hover:bg-[#12281e] border border-[#238C6E]/70 hover:border-[#29A683] rounded-xl text-[#F2F2F2] font-semibold transition-all shadow-md group text-xs sm:text-sm"
                >
                    <Camera className="w-4 h-4 mr-1.5 text-[#D2FF8F] group-hover:scale-110 transition-transform" />
                    Camera Pulse (HR)
                </button>

                <button 
                   type="button"
                   onClick={() => setShowAcoustic(true)}
                   className="flex items-center justify-center p-3 bg-[#0d1d16] hover:bg-[#12281e] border border-[#238C6E]/70 hover:border-[#29A683] rounded-xl text-[#F2F2F2] font-semibold transition-all shadow-md group text-xs sm:text-sm"
                >
                    <Volume2 className="w-4 h-4 mr-1.5 text-[#29A683] group-hover:scale-110 transition-transform" />
                    Acoustic AI
                </button>
              </div>

              {/* Acoustic badge */}
              {formData.acousticLabel && formData.acousticLabel !== '' && (
                <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                  formData.acousticScore > 0.5 
                    ? 'bg-amber-500/15 border-amber-400/40 text-amber-200' 
                    : 'bg-[#29A683]/15 border-[#29A683]/40 text-[#D2FF8F]'
                }`}>
                  <span className="font-medium">🔊 {formData.acousticLabel}</span>
                  <span className="font-mono bg-[#000000]/60 px-2 py-0.5 rounded border border-[#238C6E]/40 text-[#D2FF8F]">Score: {Number(formData.acousticScore).toFixed(2)}</span>
                </div>
              )}

              <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#238C6E]/40"></div>
                  <span className="flex-shrink-0 mx-4 text-[#8ea096] text-xs font-bold tracking-wider">OR ENTER VITALS MANUALLY</span>
                  <div className="flex-grow border-t border-[#238C6E]/40"></div>
              </div>

              <div>
                <div className="flex items-center text-[#F2F2F2] mb-1 mt-1">
                  <Thermometer className="w-4 h-4 mr-2 text-[#29A683]" />
                  <label className="text-sm font-semibold">Body Temperature (°F) *</label>
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
                <div className="flex items-center text-[#F2F2F2] mb-1 mt-2">
                  <HeartPulse className="w-4 h-4 mr-2 text-[#D2FF8F]" />
                  <label className="text-sm font-semibold">Heart Rate (bpm) *</label>
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
                <div className="flex items-center text-[#F2F2F2] mb-1 mt-2">
                  <Activity className="w-4 h-4 mr-2 text-[#29A683]" />
                  <label className="text-sm font-semibold">Oxygen Saturation (SpO2 %) *</label>
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
                <div className="flex items-center text-[#F2F2F2] mb-1 mt-2">
                  <Activity className="w-4 h-4 mr-2 text-[#29A683]" />
                  <label className="text-sm font-semibold">Blood Pressure (Optional)</label>
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
                <div className="flex items-center text-[#F2F2F2] mb-1 mt-2">
                  <Activity className="w-4 h-4 mr-2 text-[#D2FF8F]" />
                  <label className="text-sm font-semibold">Diarrhoea / Loose Stool</label>
                </div>
                <select 
                  name="diarrhoea" 
                  className="glass-input text-[#F2F2F2] bg-[#0d1d16] outline-none border border-[#238C6E]/60 focus:ring-2 focus:ring-[#D2FF8F]" 
                  value={formData.diarrhoea || 'None'} 
                  onChange={handleChange} 
                >
                  <option value="None" className="text-[#F2F2F2] bg-[#07120d]">None</option>
                  <option value="Mild" className="text-[#F2F2F2] bg-[#07120d]">Mild (1-2 loose stools/day)</option>
                  <option value="Moderate" className="text-[#F2F2F2] bg-[#07120d]">Moderate (3-5 stools/day, mild dehydration)</option>
                  <option value="Severe" className="text-[#F2F2F2] bg-[#07120d]">Severe (&gt;5 stools/day, acute watery)</option>
                </select>
              </div>

              {/* WHO Clinical & Respiratory Check */}
              <WHOClinicalCard
                age={parseInt(formData.age, 10) || 30}
                respiratoryRate={formData.respiratoryRate}
                symptomProgression={formData.symptomProgression}
                whoDangerSigns={formData.whoDangerSigns}
                onRespiratoryRateChange={(rr) => setFormData(prev => ({ ...prev, respiratoryRate: rr }))}
                onSymptomProgressionChange={(val) => setFormData(prev => ({ ...prev, symptomProgression: val }))}
                onDangerSignsChange={(signs) => setFormData(prev => ({ ...prev, whoDangerSigns: signs }))}
              />
            </>
          )}

          {!showScanner && !showAcoustic && (
            <div className="flex space-x-3 pt-4">
              <button 
                type="button" 
                onClick={prevStep} 
                className="w-1/3 py-3 bg-[#0d1d16] border border-[#238C6E]/70 hover:border-[#29A683] text-[#F2F2F2] font-semibold rounded-xl transition-all"
              >
                Back
              </button>
              <button 
                type="button"
                disabled={loading || !formData.bodyTemperature || !formData.heartRate || !formData.spO2} 
                onClick={submitForm} 
                className="glass-button w-2/3 flex justify-center items-center font-extrabold"
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
