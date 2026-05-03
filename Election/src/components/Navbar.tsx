"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { t } = useLanguage();

  return (
    <nav className="glass-panel" style={{ 
      position: 'sticky', 
      top: '1rem', 
      zIndex: 100, 
      margin: '1rem', 
      padding: '1rem 2rem'
    }}>
      <div className="container flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Left side: Links */}
        <div className="flex items-center gap-8" style={{ flexWrap: 'wrap' }}>
          <div className="flex items-center gap-4">
            <Link href="/register" className="text-sm font-semibold text-navy hover:text-white hover:bg-saffron px-4 py-2 rounded-full" style={{ transition: 'all 0.3s', whiteSpace: 'nowrap' }}>{t.navRegister}</Link>
            <Link href="/chat" className="text-sm font-semibold text-navy hover:text-white hover:bg-saffron px-4 py-2 rounded-full" style={{ transition: 'all 0.3s', whiteSpace: 'nowrap' }}>{t.navChat}</Link>
            <Link href="/learn" className="text-sm font-semibold text-navy hover:text-white hover:bg-saffron px-4 py-2 rounded-full" style={{ transition: 'all 0.3s', whiteSpace: 'nowrap' }}>{t.navLearn}</Link>
          </div>
        </div>

        {/* Right side: Language Switcher and App Name */}
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <Link href="/" className="flex items-center gap-2 hover-scale" style={{ fontWeight: '900', fontSize: '1.25rem', marginLeft: '0.5rem' }}>
            <span className="text-saffron">●</span>
            <span className="text-navy" style={{ whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(255,255,255,0.8)', letterSpacing: '1px' }}>{t.appName}</span>
            <span className="text-green">●</span>
          </Link>
        </div>

      </div>
    </nav>
  );
}
