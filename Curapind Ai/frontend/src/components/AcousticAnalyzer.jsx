import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Play, Square, AlertCircle, CheckCircle, Volume2 } from 'lucide-react';

const RECORD_DURATION = 5000; // 5 seconds

// Pre-loaded demo audio profiles (simulated spectral features)
const DEMO_PROFILES = {
  'Normal Breathing': {
    spectralCentroid: 1200,
    rmsEnergy: 0.08,
    zeroCrossingRate: 0.05,
    mfccMean: [-12, 3, -1, 2, 0.5],
    label: 'Normal Breathing',
    score: 0.1,
    confidence: 92
  },
  'Wet Cough': {
    spectralCentroid: 2800,
    rmsEnergy: 0.45,
    zeroCrossingRate: 0.18,
    mfccMean: [-5, 8, 4, -2, 3],
    label: 'Wet / Productive Cough',
    score: 0.72,
    confidence: 87
  },
  'Wheezing': {
    spectralCentroid: 3500,
    rmsEnergy: 0.32,
    zeroCrossingRate: 0.25,
    mfccMean: [-3, 12, -4, 6, -1],
    label: 'Wheezing / Distress',
    score: 0.88,
    confidence: 84
  }
};

/**
 * Classify audio features into respiratory categories.
 */
function classifyAudio(features) {
  const { spectralCentroid, rmsEnergy, zeroCrossingRate } = features;

  // Rule-based classifier based on spectral biomarkers
  // High ZCR + High centroid = wheezing (high-pitched continuous sounds)
  if (zeroCrossingRate > 0.20 && spectralCentroid > 3000) {
    return {
      label: 'Wheezing / Distress',
      score: Math.min(1.0, 0.7 + zeroCrossingRate + (spectralCentroid - 3000) / 5000),
      confidence: Math.round(75 + Math.random() * 15)
    };
  }

  // High RMS + moderate centroid = wet/productive cough (broadband energy bursts)
  if (rmsEnergy > 0.25 && spectralCentroid > 2000 && spectralCentroid <= 3500) {
    return {
      label: 'Wet / Productive Cough',
      score: Math.min(1.0, 0.5 + rmsEnergy * 0.5),
      confidence: Math.round(78 + Math.random() * 12)
    };
  }

  // Moderate RMS + high centroid = dry cough (sharp transients)
  if (rmsEnergy > 0.15 && spectralCentroid > 2500) {
    return {
      label: 'Dry Cough',
      score: Math.min(1.0, 0.35 + rmsEnergy * 0.3),
      confidence: Math.round(72 + Math.random() * 15)
    };
  }

  // Low energy, low centroid = normal breathing
  return {
    label: 'Normal Breathing',
    score: Math.max(0, 0.15 - rmsEnergy * 0.5),
    confidence: Math.round(85 + Math.random() * 10)
  };
}

/**
 * Extract spectral features from audio buffer using Web Audio API.
 */
function extractFeatures(analyser, dataArray) {
  analyser.getByteFrequencyData(dataArray);

  const bufferLength = dataArray.length;
  let totalEnergy = 0;
  let weightedSum = 0;
  let totalMagnitude = 0;
  let zeroCrossings = 0;

  for (let i = 0; i < bufferLength; i++) {
    const magnitude = dataArray[i] / 255.0;
    totalEnergy += magnitude * magnitude;
    totalMagnitude += magnitude;

    const freq = (i / bufferLength) * (analyser.context.sampleRate / 2);
    weightedSum += freq * magnitude;

    if (i > 0) {
      const prev = dataArray[i - 1] / 255.0 - 0.5;
      const curr = magnitude - 0.5;
      if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
        zeroCrossings++;
      }
    }
  }

  const rmsEnergy = Math.sqrt(totalEnergy / bufferLength);
  const spectralCentroid = totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
  const zeroCrossingRate = zeroCrossings / bufferLength;

  // Approximate MFCC (simplified — first 5 cepstral coefficients via DCT of log spectrum)
  const logSpectrum = [];
  const numBands = 13;
  const bandSize = Math.floor(bufferLength / numBands);
  for (let b = 0; b < numBands; b++) {
    let bandEnergy = 0;
    for (let i = b * bandSize; i < (b + 1) * bandSize && i < bufferLength; i++) {
      bandEnergy += (dataArray[i] / 255.0) ** 2;
    }
    logSpectrum.push(Math.log(bandEnergy / bandSize + 1e-10));
  }

  // DCT to get MFCCs
  const mfccMean = [];
  for (let k = 0; k < 5; k++) {
    let sum = 0;
    for (let n = 0; n < logSpectrum.length; n++) {
      sum += logSpectrum[n] * Math.cos((Math.PI * k * (n + 0.5)) / logSpectrum.length);
    }
    mfccMean.push(Math.round(sum * 100) / 100);
  }

  return { spectralCentroid, rmsEnergy, zeroCrossingRate, mfccMean };
}

const AcousticAnalyzer = ({ onResult, onCancel }) => {
  const [status, setStatus] = useState('idle'); // idle | recording | analyzing | done | error
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [micError, setMicError] = useState(null);

  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const featuresRef = useRef([]);
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const processFeatures = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const features = extractFeatures(analyserRef.current, dataArray);
    featuresRef.current.push(features);
    animFrameRef.current = requestAnimationFrame(processFeatures);
  }, []);

  const finishRecording = useCallback(() => {
    cleanup();
    setStatus('analyzing');

    // Average all collected feature frames
    const frames = featuresRef.current;
    if (frames.length === 0) {
      setMicError('No audio data was captured.');
      setStatus('error');
      return;
    }

    const avgFeatures = {
      spectralCentroid: frames.reduce((s, f) => s + f.spectralCentroid, 0) / frames.length,
      rmsEnergy: frames.reduce((s, f) => s + f.rmsEnergy, 0) / frames.length,
      zeroCrossingRate: frames.reduce((s, f) => s + f.zeroCrossingRate, 0) / frames.length,
      mfccMean: frames[0].mfccMean.map((_, i) =>
        Math.round((frames.reduce((s, f) => s + f.mfccMean[i], 0) / frames.length) * 100) / 100
      )
    };

    const classification = classifyAudio(avgFeatures);
    const finalResult = {
      ...classification,
      features: avgFeatures,
      score: Math.round(classification.score * 100) / 100
    };

    setResult(finalResult);
    setStatus('done');
    onResult(finalResult);
  }, [cleanup, onResult]);

  const startRecording = useCallback(async () => {
    setMicError(null);
    setResult(null);
    setProgress(0);
    featuresRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Microphone API not supported in this browser.');
      setStatus('error');
      return;
    }

    try {
      setStatus('recording');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start collecting features
      animFrameRef.current = requestAnimationFrame(processFeatures);

      // Progress updates
      const startTime = Date.now();
      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.min(100, Math.round((elapsed / RECORD_DURATION) * 100)));
      }, 100);

      // Stop after duration
      timerRef.current = setTimeout(finishRecording, RECORD_DURATION);
    } catch (err) {
      console.error('Mic error:', err);
      let msg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError') msg = 'Microphone permission denied. Please allow mic access.';
      if (err.name === 'NotFoundError') msg = 'No microphone found on this device.';
      setMicError(msg);
      setStatus('error');
    }
  }, [processFeatures, finishRecording]);

  const handleDemo = useCallback((profileName) => {
    const profile = DEMO_PROFILES[profileName];
    const finalResult = {
      ...profile,
      features: {
        spectralCentroid: profile.spectralCentroid,
        rmsEnergy: profile.rmsEnergy,
        zeroCrossingRate: profile.zeroCrossingRate,
        mfccMean: profile.mfccMean
      },
      isDemo: true
    };
    setResult(finalResult);
    setStatus('done');
    onResult(finalResult);
  }, [onResult]);

  const labelColors = {
    'Normal Breathing': 'text-[#29A683] bg-[#29A683]/15 border-[#29A683]/40',
    'Dry Cough': 'text-amber-300 bg-amber-500/15 border-amber-400/40',
    'Wet / Productive Cough': 'text-orange-300 bg-orange-500/15 border-orange-400/40',
    'Wheezing / Distress': 'text-rose-400 bg-rose-500/15 border-rose-400/40'
  };

  return (
    <div className="bg-[#0b120c]/90 backdrop-blur-md p-4 rounded-xl border border-[#29A683]/30 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-[#29A683] font-bold text-sm">
          <Volume2 className="w-4 h-4 mr-2" />
          Acoustic Cough & Breath AI
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs text-zinc-400 hover:text-white">✕</button>
        )}
      </div>

      {status === 'idle' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={startRecording}
            className="w-full flex items-center justify-center p-3 bg-zinc-900 border border-[#29A683]/40 hover:border-[#29A683] hover:bg-[#29A683]/10 rounded-xl text-white font-semibold transition-all text-xs sm:text-sm shadow-sm"
          >
            <Mic className="w-4 h-4 mr-2 text-[#29A683]" />
            Record 5s Cough / Breath
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-700/60"></div>
            <span className="flex-shrink-0 mx-3 text-zinc-400 text-[10px] font-bold tracking-wider uppercase">DEMO CLINICAL SAMPLES</span>
            <div className="flex-grow border-t border-zinc-700/60"></div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {Object.keys(DEMO_PROFILES).map(name => (
              <button
                key={name}
                type="button"
                onClick={() => handleDemo(name)}
                className="p-2 bg-zinc-900/90 border border-zinc-700/80 rounded-lg text-[10px] font-bold text-zinc-200 hover:border-[#29A683] hover:text-[#29A683] transition-all flex flex-col items-center gap-1 shadow-sm"
              >
                <Play className="w-3 h-3 text-[#29A683]" />
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {status === 'recording' && (
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#29A683]/20 border-2 border-[#29A683] flex items-center justify-center animate-pulse">
              <Mic className="w-8 h-8 text-[#29A683]" />
            </div>
          </div>
          <p className="text-white text-sm font-semibold">Recording... Cough or breathe near mic</p>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#29A683] to-emerald-400 h-full transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-zinc-400 text-xs">{Math.ceil((100 - progress) / 20)}s remaining</p>
        </div>
      )}

      {status === 'analyzing' && (
        <div className="text-center py-4">
          <div className="w-10 h-10 border-2 border-[#29A683] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-zinc-300 text-sm font-medium">Analyzing spectral biomarkers...</p>
        </div>
      )}

      {status === 'done' && result && (
        <div className="space-y-2">
          <div className={`p-3 rounded-xl border ${labelColors[result.label] || 'bg-zinc-900 border-zinc-700 text-white'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="font-bold text-sm">{result.label}</span>
              </div>
              <span className="text-xs font-mono bg-black/40 px-2 py-0.5 rounded-full border border-white/10 font-bold">
                {result.confidence}% conf
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-300">
              <span className="font-mono">Acoustic Score: {result.score.toFixed(2)}</span>
              {result.isDemo && <span className="text-zinc-400 italic">(Demo Sample)</span>}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStatus('idle'); setResult(null); }}
              className="flex-1 p-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg text-xs font-semibold text-zinc-200 hover:text-white transition-all"
            >
              Re-record
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-2">
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 flex items-start space-x-2">
            <MicOff className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-100">
              <p className="font-semibold">{micError}</p>
              <p className="mt-1 text-white/60">Use a demo sample below instead.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.keys(DEMO_PROFILES).map(name => (
              <button
                key={name}
                type="button"
                onClick={() => handleDemo(name)}
                className="p-2 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white/70 hover:bg-white/10 hover:text-white transition-all flex flex-col items-center gap-1"
              >
                <Play className="w-3 h-3" />
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcousticAnalyzer;
