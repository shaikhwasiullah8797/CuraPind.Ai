"use client";

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface FlashcardProps {
  frontContent: string;
  backContent: string;
}

export default function Flashcard({ frontContent, backContent }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { t } = useLanguage();

  return (
    <div 
      className={`flip-card ${isFlipped ? 'flipped' : ''}`} 
      onClick={() => setIsFlipped(!isFlipped)}
      style={{ width: '100%', maxWidth: '400px', height: '250px', margin: '1rem auto' }}
    >
      <div className="flip-card-inner">
        <div className="flip-card-front">
          <h3 className="text-navy text-center">{frontContent}</h3>
          <p className="mt-4 text-sm text-muted">{t.clickToReveal}</p>
        </div>
        <div className="flip-card-back">
          <p className="text-center" style={{ fontSize: '1.125rem', fontWeight: 500 }}>{backContent}</p>
        </div>
      </div>
    </div>
  );
}
