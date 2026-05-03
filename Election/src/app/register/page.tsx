"use client";

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function RegisterPage() {
  const { t } = useLanguage();

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 20px', minHeight: '80vh' }}>
      <header className="text-center mb-12">
        <h1 className="text-navy mb-4">{t.regGuideTitle}</h1>
        <p>{t.regGuideDesc}</p>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <section className="glass-panel p-8 mb-8">
          <h2 className="text-saffron mb-4">Step 1: Check Eligibility</h2>
          <ul className="flex-col gap-2 list-disc" style={{ paddingLeft: '1.5rem' }}>
            <li>You must be an Indian citizen.</li>
            <li>You must be 18 years of age or older on the qualifying date (January 1st of the year of revision of electoral roll).</li>
            <li>You must be an ordinary resident of the polling area.</li>
          </ul>
        </section>

        <section className="glass-panel p-8 mb-8">
          <h2 className="text-green mb-4">Step 2: Keep Documents Ready</h2>
          <p className="mb-4">You will need the following documents:</p>
          <ul className="flex-col gap-2 list-disc" style={{ paddingLeft: '1.5rem' }}>
            <li>Passport size photograph</li>
            <li>Identity proof (Aadhaar Card, PAN Card, Driving License, etc.)</li>
            <li>Address proof (Aadhaar Card, Utility Bill, Passport, etc.)</li>
            <li>Proof of Date of Birth</li>
          </ul>
        </section>

        <section className="glass-panel p-8 mb-8">
          <h2 className="text-navy mb-4">Step 3: Fill Form 6</h2>
          <p className="mb-4">
            Form 6 is the application for inclusion of name in the electoral roll for first-time voters.
            You can fill this form online through the Voter Service Portal or offline.
          </p>
          <div className="flex gap-4 mt-6">
            <a href="https://voters.eci.gov.in/" target="_blank" rel="noreferrer" className="btn btn-primary">
              Visit ECI Portal
            </a>
            <Link href="/chat" className="btn btn-outline">
              Ask AI for Help
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
