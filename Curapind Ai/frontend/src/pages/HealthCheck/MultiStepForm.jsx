import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/GlassCard';
import PPGScanner from '../../components/PPGScanner';
import api from '../../api';
import { User, Activity, Thermometer, Clock, ArrowRight, HeartPulse, CheckSquare, Camera } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const MultiStepForm = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    bodyTemperature: '',
    heartRate: '',
    spO2: '',
    bloodPressure: '',
    symptoms: {
      fever: 'none',
      cough: 'none',
      breathlessness: 'none',
      body_pain: 'none'
    },
    durationOfSymptoms: 'None'
  });
  
  const [showScanner, setShowScanner] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSymptomChange = (symptomId, severity) => {
    setFormData(prev => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [symptomId]: severity
      }
    }));
  };

  const submitForm = async () => {
    setLoading(true);
    try {
      const res = await api.post('/health/predict', {
        ...formData,
        patientName: formData.patientName || user?.name || 'Self',
        age: parseInt(formData.age),
        bodyTemperature: parseFloat(formData.bodyTemperature),
        heartRate: parseInt(formData.heartRate),
        spO2: parseInt(formData.spO2),
        bloodPressure: formData.bloodPressure
      });
      navigate('/result', { state: { result: res.data } });
    } catch (err) {
      console.error(err);
      alert('Error submitting health data');
    }
    setLoading(false);
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const availableSymptoms = [
    { id: 'fever', label: 'Fever', icon: <Thermometer className="w-5 h-5 text-red-300" /> },
    { id: 'cough', label: 'Cough', icon: <Activity className="w-5 h-5 text-blue-300" /> },
    { id: 'breathlessness', label: 'Breathlessness', icon: <Activity className="w-5 h-5 text-gray-300" /> },
    { id: 'body_pain', label: 'Body Pain', icon: <HeartPulse className="w-5 h-5 text-purple-300" /> },
  ];

  return (
    <GlassCard className="animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
        <h2 className="text-xl font-bold text-white">Health Check</h2>
        <span className="text-white/60 text-sm">Step {step} of 3</span>
      </div>

      {/* Step 1: Basic Stats */}
      {step === 1 && (
        <div className="space-y-6 animate-[slideInRight_0.4s_ease-out]">
          
          {user?.role === 'Health Worker' && (
            <div>
              <div className="flex items-center text-white mb-2">
                <User className="w-5 h-5 mr-2 text-green-300" />
                <label>Patient Name</label>
              </div>
              <input type="text" name="patientName" className="glass-input text-lg" placeholder="e.g. John Doe" value={formData.patientName} onChange={handleChange} />
            </div>
          )}

          <div>
            <div className="flex items-center text-white mb-2">
              <User className="w-5 h-5 mr-2 text-indigo-300" />
              <label>{user?.role === 'Health Worker' ? "Patient's Age" : "Age"}</label>
            </div>
            <input type="number" name="age" className="glass-input text-lg" placeholder="e.g. 45" value={formData.age} onChange={handleChange} />
          </div>
          <div>
            <div className="flex items-center text-white mb-2">
              <Clock className="w-5 h-5 mr-2 text-indigo-300" />
              <label>Duration of Symptoms</label>
            </div>
            <select name="durationOfSymptoms" className="glass-input text-white bg-transparent outline-none border focus:ring focus:ring-blue-500" value={formData.durationOfSymptoms} onChange={handleChange}>
              <option value="None" className="text-black">None</option>
              <option value="1-3 days" className="text-black">1-3 days</option>
              <option value="4-7 days" className="text-black">4-7 days</option>
              <option value="More than a week" className="text-black">More than a week</option>
            </select>
          </div>
          <button disabled={!formData.age} onClick={nextStep} className="glass-button w-full flex justify-center items-center opacity-90 disabled:opacity-50">
            Next <ArrowRight className="w-5 h-5 ml-2" />
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
                        heartRate: data.heartRate, 
                        spO2: data.spO2, 
                        bloodPressure: data.bloodPressure 
                    }));
                    setShowScanner(false);
                }} 
             />
          ) : (
            <>
              <button 
                 onClick={() => setShowScanner(true)}
                 className="w-full flex items-center justify-center p-4 bg-indigo-500/20 border border-indigo-400 hover:bg-indigo-500/40 rounded-xl text-white font-semibold transition-colors mb-4"
              >
                  <Camera className="w-5 h-5 mr-2" />
                  Auto-Scan Vitals (Experimental)
              </button>

              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/20"></div>
                  <span className="flex-shrink-0 mx-4 text-white/50 text-sm">OR ENTER MANUALLY</span>
                  <div className="flex-grow border-t border-white/20"></div>
              </div>

              <div>
                <div className="flex items-center text-white mb-2 mt-2">
                  <Thermometer className="w-5 h-5 mr-2 text-red-300" />
                  <label>Body Temperature (°F)</label>
                </div>
                <input type="number" step="0.1" name="bodyTemperature" className="glass-input" placeholder="e.g. 98.6" value={formData.bodyTemperature} onChange={handleChange} />
              </div>
              <div>
                <div className="flex items-center text-white mb-2 mt-4">
                  <HeartPulse className="w-5 h-5 mr-2 text-red-400" />
                  <label>Heart Rate (bpm)</label>
                </div>
                <input type="number" name="heartRate" className="glass-input" placeholder="e.g. 72" value={formData.heartRate} onChange={handleChange} />
              </div>
              <div>
                <div className="flex items-center text-white mb-2 mt-4">
                  <Activity className="w-5 h-5 mr-2 text-blue-300" />
                  <label>Oxygen Saturation (SpO2 %)</label>
                </div>
                <input type="number" name="spO2" className="glass-input" placeholder="e.g. 98" value={formData.spO2} onChange={handleChange} />
              </div>
              <div>
                <div className="flex items-center text-white mb-2 mt-4">
                  <Activity className="w-5 h-5 mr-2 text-purple-300" />
                  <label>Blood Pressure (Optional)</label>
                </div>
                <input type="text" name="bloodPressure" className="glass-input" placeholder="e.g. 120/80" value={formData.bloodPressure || ''} onChange={handleChange} />
              </div>
            </>
          )}

          {!showScanner && (
            <div className="flex space-x-3 pt-4">
              <button onClick={prevStep} className="glass-button w-1/3 bg-transparent border border-white/30 text-white/90">Back</button>
              <button disabled={!formData.bodyTemperature || !formData.heartRate || !formData.spO2} onClick={nextStep} className="glass-button w-2/3 flex justify-center items-center">
                Next <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Symptoms */}
      {step === 3 && (
        <div className="space-y-6 animate-[slideInRight_0.4s_ease-out]">
          <h3 className="text-white text-lg mb-4">Select symptom severity:</h3>
          <div className="flex flex-col space-y-4">
            {availableSymptoms.map(sym => (
              <div key={sym.id} className="p-4 rounded-xl border border-white/20 bg-white/5 flex flex-col space-y-3">
                <div className="flex items-center text-white">
                  {sym.icon}
                  <span className="font-medium ml-2">{sym.label}</span>
                </div>
                <div className="flex space-x-2">
                  {['none', 'mild', 'moderate', 'severe'].map(level => (
                    <button
                      key={level}
                      onClick={() => handleSymptomChange(sym.id, level)}
                      className={`flex-1 py-1.5 md:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-medium transition-colors border
                        ${formData.symptoms[sym.id] === level 
                          ? 'bg-blue-500/50 border-blue-400 text-white' 
                          : 'bg-transparent border-white/30 text-white/50 hover:border-white/60 hover:text-white/80'}`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex space-x-3 mt-8">
            <button onClick={prevStep} className="glass-button w-1/3 bg-transparent border border-white/30">Back</button>
            <button onClick={submitForm} disabled={loading} className="glass-button w-2/3">
              {loading ? 'Predicting...' : 'Get Prediction'}
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default MultiStepForm;
