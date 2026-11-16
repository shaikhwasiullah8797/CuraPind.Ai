import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Stethoscope, AlertTriangle } from 'lucide-react';
import RespiratoryRateHelper from './RespiratoryRateHelper';

const SYMPTOM_PROGRESSION_OPTIONS = [
  { value: 'None', label: 'None / Routine Check' },
  { value: '< 24 Hours', label: '< 24 Hours' },
  { value: '1 - 3 Days', label: '1 - 3 Days' },
  { value: '> 3 Days', label: '> 3 Days' },
  { value: 'Rapidly Worsening', label: 'Rapidly Worsening' }
];

const WHO_DANGER_SIGNS = [
  { id: 'sob', label: 'Shortness of Breath / Chest Indrawing' },
  { id: 'dehydration', label: 'Unable to Drink / Severe Dehydration' },
  { id: 'confusion', label: 'Confusion / Extreme Lethargy' }
];

const WHOClinicalCard = ({
  age = 30,
  respiratoryRate = 0,
  symptomProgression = 'None',
  whoDangerSigns = [],
  onRespiratoryRateChange,
  onSymptomProgressionChange,
  onDangerSignsChange
}) => {
  const [expanded, setExpanded] = useState(false);

  const hasDangerSigns = whoDangerSigns.length > 0;

  const toggleDangerSign = (signLabel) => {
    const current = [...whoDangerSigns];
    const index = current.indexOf(signLabel);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(signLabel);
    }
    onDangerSignsChange(current);
  };

  return (
    <div className={`rounded-xl border transition-all duration-300 ${hasDangerSigns ? 'border-amber-400/50 bg-amber-500/10' : 'border-[#29A683]/30 bg-[#0c140d]/80'}`}>
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3.5 text-left"
      >
        <div className="flex items-center">
          <Stethoscope className="w-4 h-4 mr-2 text-[#29A683]" />
          <span className="text-sm font-bold text-white tracking-tight">WHO Clinical & Respiratory Check</span>
          {hasDangerSigns && (
            <span className="ml-2 px-2 py-0.5 bg-amber-500/20 border border-amber-400/50 rounded-full text-[10px] text-amber-300 font-bold">
              {whoDangerSigns.length} Danger Sign{whoDangerSigns.length > 1 ? 's' : ''}
            </span>
          )}
          {respiratoryRate > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-[#29A683]/20 border border-[#29A683]/40 rounded-full text-[10px] text-[#D2FF8F] font-mono font-bold">
              RR: {respiratoryRate}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3.5 pb-4 space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="border-t border-zinc-700/60 pt-3">
            <RespiratoryRateHelper
              age={age}
              value={respiratoryRate}
              onChange={onRespiratoryRateChange}
            />
          </div>

          {/* Symptom Progression */}
          <div>
            <label className="text-sm font-semibold text-zinc-200 mb-1.5 block">
              Symptom Duration & Progression
            </label>
            <select
              className="glass-input text-white bg-[#111a12] outline-none border border-zinc-700/70 focus:ring focus:ring-[#29A683] text-sm"
              value={symptomProgression}
              onChange={(e) => onSymptomProgressionChange(e.target.value)}
            >
              {SYMPTOM_PROGRESSION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="text-white bg-[#0f1710]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* WHO Danger Signs */}
          <div>
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              <label className="text-sm font-semibold text-zinc-200">WHO Danger Signs</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {WHO_DANGER_SIGNS.map(sign => {
                const isSelected = whoDangerSigns.includes(sign.label);
                return (
                  <button
                    key={sign.id}
                    type="button"
                    onClick={() => toggleDangerSign(sign.label)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}{sign.label}
                  </button>
                );
              })}
            </div>
            {hasDangerSigns && (
              <p className="text-amber-300 text-xs mt-2 flex items-start leading-snug">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 mt-0.5 flex-shrink-0" />
                Danger sign(s) present — will escalate triage priority per WHO IMCI guidelines.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WHOClinicalCard;
