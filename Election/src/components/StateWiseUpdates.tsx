import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import MapModal from './MapModal';

const statesData = [
  { name: 'Assam', status: 'Concluded', phase: 'Single Phase', date: 'April 9, 2026' },
  { name: 'Kerala', status: 'Concluded', phase: 'Single Phase', date: 'April 9, 2026' },
  { name: 'Tamil Nadu', status: 'Concluded', phase: 'Single Phase', date: 'April 23, 2026' },
  { name: 'West Bengal', status: 'Concluded', phase: '2 Phases', date: 'April 23 & April 29, 2026' },
  { name: 'Puducherry', status: 'Concluded', phase: 'Single Phase', date: 'April 2026' },
  { name: 'Uttar Pradesh', status: 'Upcoming', phase: 'Multiple Phases', date: 'Early 2027' },
  { name: 'Punjab', status: 'Upcoming', phase: 'Single Phase', date: 'Early 2027' },
  { name: 'Uttarakhand', status: 'Upcoming', phase: 'Single Phase', date: 'Early 2027' },
  { name: 'Goa', status: 'Upcoming', phase: 'Single Phase', date: 'Early 2027' },
  { name: 'Manipur', status: 'Upcoming', phase: 'Multiple Phases', date: 'Early 2027' },
  { name: 'Gujarat', status: 'Upcoming', phase: 'Multiple Phases', date: 'Late 2027' },
  { name: 'Himachal Pradesh', status: 'Upcoming', phase: 'Single Phase', date: 'Late 2027' },
  { name: 'Delhi', status: 'Concluded', phase: 'Single Phase', date: 'February 5, 2025' },
  { name: 'Bihar', status: 'Concluded', phase: '2 Phases', date: 'Nov 6 & Nov 11, 2025' },
  { name: 'Maharashtra', status: 'Concluded', phase: 'Single Phase', date: 'Nov 20, 2024' },
  { name: 'Jharkhand', status: 'Concluded', phase: 'Phase 1 & 2', date: 'Nov 13 & Nov 20, 2024' },
  { name: 'Haryana', status: 'Concluded', phase: 'Single Phase', date: 'Oct 5, 2024' },
  { name: 'Jammu and Kashmir', status: 'Concluded', phase: '3 Phases', date: 'Sep 18 - Oct 1, 2024' }
];

export default function StateWiseUpdates() {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const filteredStates = statesData.filter(state => 
    state.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusText = (status: string) => {
    if (language === 'hi') {
      return status === 'Ongoing' ? 'जारी है' : status === 'Upcoming' ? 'आगामी' : 'संपन्न';
    }
    if (language === 'pa') {
      return status === 'Ongoing' ? 'ਜਾਰੀ ਹੈ' : status === 'Upcoming' ? 'ਆਉਣ ਵਾਲਾ' : 'ਸੰਪੰਨ';
    }
    return status;
  };

  return (
    <div className="glass-panel p-8 mt-12 w-full animate-fade-in" style={{ maxWidth: '1000px', margin: '3rem auto', textAlign: 'center' }}>
      <h2 className="gradient-text mb-8">{t.stateWiseUpdates}</h2>
      
      <div className="mb-12" style={{ position: 'relative', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
        <input 
          type="text" 
          placeholder={t.searchState} 
          className="w-full p-4 glass-panel border-none outline-none focus:ring-2 text-navy"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            background: 'rgba(255, 255, 255, 0.8)', 
            fontSize: '1.1rem',
            boxShadow: 'var(--shadow-md)',
            borderRadius: 'var(--radius-full)',
            paddingLeft: '3rem'
          }}
        />
        <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
          🔍
        </div>
      </div>

      <div className="grid gap-6" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        justifyContent: 'center'
      }}>
        {filteredStates.map((state) => (
          <div 
            key={state.name} 
            className="glass-panel p-6 hover-scale cursor-pointer flex flex-col justify-between" 
            style={{ 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'rgba(255, 255, 255, 0.95)',
              borderTop: `4px solid ${
                state.status === 'Ongoing' ? 'var(--saffron)' : 
                state.status === 'Upcoming' ? 'var(--navy)' : 
                'var(--green)'
              }`,
              textAlign: 'left'
            }}
            onClick={() => setSelectedState(state.name)}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-navy" style={{ fontSize: '1.4rem', margin: 0 }}>{state.name}</h3>
                <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 rounded text-muted uppercase tracking-wider">
                  {state.phase}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-sm font-bold flex items-center gap-1.5 ${
                  state.status === 'Ongoing' ? 'text-saffron' : 
                  state.status === 'Upcoming' ? 'text-navy' : 
                  'text-green'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    state.status === 'Ongoing' ? 'bg-saffron animate-pulse' : 
                    state.status === 'Upcoming' ? 'bg-navy' : 
                    'bg-green'
                  }`}></span>
                  {getStatusText(state.status)}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-muted font-medium">📅 {state.date}</span>
              <button 
                className="text-xs font-bold text-navy hover:text-saffron transition-colors flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedState(state.name);
                }}
              >
                View Map 🗺️
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted">No states found matching "{searchTerm}"</p>
        </div>
      )}

      <MapModal 
        isOpen={!!selectedState} 
        onClose={() => setSelectedState(null)} 
        stateName={selectedState || ''} 
      />
    </div>
  );
}
