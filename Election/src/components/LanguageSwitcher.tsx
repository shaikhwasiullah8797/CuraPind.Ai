"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { languages, Language } from '@/i18n/dictionaries';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold">🌐</span>
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="glass-panel"
        style={{ 
          padding: '0.25rem 0.5rem', 
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        {(Object.keys(languages) as Language[]).map((lang) => (
          <option key={lang} value={lang} style={{ color: 'var(--text-main)' }}>
            {languages[lang]}
          </option>
        ))}
      </select>
    </div>
  );
}
