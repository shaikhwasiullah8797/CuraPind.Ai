import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Wind, Hand, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { getTachypneaThreshold, isTachypnea } from '../utils/featureEngineering';

const COUNTING_DURATION = 15; // seconds

const RespiratoryRateHelper = ({ age = 30, value, onChange }) => {
  const [mode, setMode] = useState('idle'); // idle | counting | done
  const [tapCount, setTapCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(COUNTING_DURATION);
  const [calculatedRR, setCalculatedRR] = useState(null);
  const [manualMode, setManualMode] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startCounting = useCallback(() => {
    cleanup();
    setMode('counting');
    setTapCount(0);
    setSecondsLeft(COUNTING_DURATION);
    setCalculatedRR(null);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, COUNTING_DURATION - elapsed);
      setSecondsLeft(Math.ceil(remaining));

      if (remaining <= 0) {
        cleanup();
        setMode('done');
        setTapCount(prev => {
          const rr = Math.round(prev * (60 / COUNTING_DURATION));
          setCalculatedRR(rr);
          onChange(rr);
          return prev;
        });
      }
    }, 200);
  }, [cleanup, onChange]);

  const handleTap = useCallback(() => {
    if (mode === 'counting') {
      setTapCount(prev => prev + 1);
    }
  }, [mode]);

  const handleReset = useCallback(() => {
    cleanup();
    setMode('idle');
    setTapCount(0);
    setSecondsLeft(COUNTING_DURATION);
    setCalculatedRR(null);
  }, [cleanup]);

  const handleManualChange = useCallback((e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 80) {
      onChange(val);
      setCalculatedRR(val);
    } else if (e.target.value === '') {
      onChange(0);
      setCalculatedRR(null);
    }
  }, [onChange]);

  const currentRR = value || calculatedRR || 0;
  const hasTachypnea = currentRR > 0 && isTachypnea(currentRR, age);
  const threshold = getTachypneaThreshold(age);

  if (manualMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-zinc-200">
            <Wind className="w-4 h-4 mr-2 text-[#29A683]" />
            <label className="text-sm font-semibold">Respiratory Rate (breaths/min)</label>
          </div>
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className="text-xs text-[#29A683] hover:text-[#238C6E] font-semibold underline"
          >
            Use Tap Counter
          </button>
        </div>
        <input
          type="number"
          min="0"
          max="80"
          className="glass-input"
          placeholder="e.g. 18"
          value={value || ''}
          onChange={handleManualChange}
        />
        {hasTachypnea && (
          <div className="flex items-center text-amber-300 text-xs mt-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Tachypnea detected: {currentRR} bpm exceeds WHO threshold ({threshold} bpm for age {age})
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-zinc-200">
          <Wind className="w-4 h-4 mr-2 text-[#29A683]" />
          <label className="text-sm font-semibold">Respiratory Rate</label>
        </div>
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className="text-xs text-[#29A683] hover:text-[#238C6E] font-semibold underline"
        >
          Enter Manually
        </button>
      </div>

      {mode === 'idle' && (
        <button
          type="button"
          onClick={startCounting}
          className="w-full flex items-center justify-center p-3 bg-zinc-900/90 border border-[#29A683]/40 hover:border-[#29A683] hover:bg-[#29A683]/10 rounded-xl text-white font-semibold transition-all text-xs sm:text-sm shadow-sm"
        >
          <Hand className="w-4 h-4 mr-2 text-[#29A683]" />
          Start 15s Breath Counter — Tap on Each Breath
        </button>
      )}

      {mode === 'counting' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleTap}
            className="w-full p-6 bg-gradient-to-br from-[#29A683]/25 via-emerald-600/20 to-black/60 border-2 border-[#29A683] rounded-xl text-white font-extrabold text-lg transition-all active:scale-95 shadow-[0_0_25px_rgba(41,166,131,0.3)] select-none"
          >
            <Hand className="w-8 h-8 mx-auto mb-2 text-[#D2FF8F] animate-bounce" />
            TAP ON EACH BREATH
            <div className="text-4xl font-mono mt-1 text-[#29A683] font-black">{tapCount}</div>
            <div className="text-xs text-zinc-300 mt-1 uppercase font-bold tracking-wider">breaths counted</div>
          </button>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-mono font-medium">
              ⏱ {secondsLeft}s remaining
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-rose-300 hover:text-rose-200 flex items-center"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Reset
            </button>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#29A683] to-emerald-400 h-full transition-all duration-200 rounded-full"
              style={{ width: `${((COUNTING_DURATION - secondsLeft) / COUNTING_DURATION) * 100}%` }}
            />
          </div>
        </div>
      )}

      {mode === 'done' && (
        <div className="space-y-2">
          <div className={`flex items-center justify-between p-3 rounded-xl border ${hasTachypnea ? 'bg-amber-500/15 border-amber-400/50' : 'bg-[#29A683]/15 border-[#29A683]/50'}`}>
            <div className="flex items-center">
              {hasTachypnea ? (
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-400" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2 text-[#29A683]" />
              )}
              <div>
                <p className="text-white font-extrabold text-lg leading-tight">{calculatedRR} breaths/min</p>
                <p className="text-zinc-300 text-xs">
                  {tapCount} breaths in {COUNTING_DURATION}s × 4
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Reset counter"
            >
              <RotateCcw className="w-4 h-4 text-zinc-300" />
            </button>
          </div>

          {hasTachypnea && (
            <div className="text-amber-300 text-xs flex items-start leading-snug">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 mt-0.5 flex-shrink-0" />
              <span>WHO Tachypnea Alert: {calculatedRR} bpm exceeds threshold ({threshold} bpm for age {age})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RespiratoryRateHelper;
