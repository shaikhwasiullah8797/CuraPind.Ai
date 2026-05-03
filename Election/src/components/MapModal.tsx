"use client";

import React from 'react';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  stateName: string;
}

export default function MapModal({ isOpen, onClose, stateName }: MapModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-navy/20 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      style={{ background: 'rgba(0, 0, 128, 0.3)' }}
    >
      <div 
        className="glass-panel p-8 w-full max-w-2xl relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white' }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-navy hover:text-saffron transition-colors"
          style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
        >
          ✕
        </button>
        
        <h2 className="text-navy mb-4 text-center">{stateName} Election Map</h2>
        <p className="text-center text-muted mb-6">Interactive visualization of constituencies and voting booths.</p>
        
        <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-100 bg-gray-50 z-0" style={{ height: '400px' }}>
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${encodeURIComponent(stateName + ', India')}&output=embed&z=6`}
          ></iframe>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-saffron/10 rounded-lg">
            <div className="text-saffron font-bold text-xl">42</div>
            <div className="text-xs text-muted">Constituencies</div>
          </div>
          <div className="p-3 bg-green/10 rounded-lg">
            <div className="text-green font-bold text-xl">12.4K</div>
            <div className="text-xs text-muted">Polling Booths</div>
          </div>
          <div className="p-3 bg-navy/10 rounded-lg">
            <div className="text-navy font-bold text-xl">85%</div>
            <div className="text-xs text-muted">Voter Readiness</div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="btn btn-primary w-full mt-8"
        >
          Close Map
        </button>
      </div>
    </div>
  );
}
