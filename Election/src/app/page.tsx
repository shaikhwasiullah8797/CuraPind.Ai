"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import StateWiseUpdates from "@/components/StateWiseUpdates";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div className="container flex-col items-center justify-center animate-fade-in" style={{ minHeight: '100vh', padding: '6rem 20px 4rem 20px' }}>
        
        <header className="flex-col items-center text-center mb-16">
          <h1 className="mb-6" style={{ lineHeight: '1.1' }}>
            {language === 'hi' ? (
              <>
                <span className="inline-block bg-navy px-12 py-2 rounded-full shadow-2xl mt-4 mb-4 border border-white/20" style={{ transform: 'rotate(-2deg)' }}>
                  <span className="gradient-text" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{t.appName}</span>
                </span> <br /> में {t.welcome}
              </>
            ) : language === 'pa' ? (
              <>
                 <span className="inline-block bg-navy px-12 py-2 rounded-full shadow-2xl mt-4 mb-4 border border-white/20" style={{ transform: 'rotate(-2deg)' }}>
                   <span className="gradient-text" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{t.appName}</span>
                 </span> <br /> ਵਿੱਚ {t.welcome}
              </>
            ) : language === 'bn' ? (
               <>
                 <span className="inline-block bg-navy px-12 py-2 rounded-full shadow-2xl mt-4 mb-4 border border-white/20" style={{ transform: 'rotate(-2deg)' }}>
                   <span className="gradient-text" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{t.appName}</span>
                 </span> <br /> এ {t.welcome}
               </>
            ) : (
              <>
                {t.welcome} <br />
                <span className="inline-block bg-navy px-12 py-3 rounded-full shadow-2xl mt-4 mb-2 border border-white/20" style={{ transform: 'rotate(-1deg)' }}>
                  <span className="gradient-text" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{t.appName}</span>
                </span>
              </>
            )}
          </h1>
          <p className="mx-auto" style={{ maxWidth: '650px', fontSize: '1.25rem' }}>
            {t.description}
          </p>
        </header>

        <div className="flex justify-center gap-6 mb-24 flex-wrap">
          <Link href="/register" className="btn btn-primary shadow-lg hover-scale">
            {t.registerBtn}
          </Link>
          <Link href="/chat" className="btn btn-secondary shadow-lg hover-scale">
            {t.askAIBtn}
          </Link>
          <Link href="/learn" className="btn btn-outline hover-scale">
            {t.learnBtn}
          </Link>
        </div>

        <section className="glass-panel p-10 px-12 mb-20 mt-12 relative" style={{ width: '100%', maxWidth: '950px', margin: '3rem auto 5rem auto' }}>
          <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '3rem' }}>
            <div className="flex-col justify-center" style={{ flex: '1 1 450px', textAlign: 'left', paddingLeft: '1rem' }}>
              <h2 className="text-navy mb-6" style={{ fontSize: '2rem' }}>{t.empowering}</h2>
              <ul className="flex-col gap-6">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green/20 flex items-center justify-center text-green font-bold flex-shrink-0 mt-1">✓</div>
                  <span style={{ fontSize: '1.1rem', lineHeight: '1.6' }}><strong>{t.multilingual}</strong> {t.multilingualDesc}</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-saffron/20 flex items-center justify-center text-saffron font-bold flex-shrink-0 mt-1">✓</div>
                  <span style={{ fontSize: '1.1rem', lineHeight: '1.6' }}><strong>{t.interactive}</strong> {t.interactiveDesc}</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-navy/20 flex items-center justify-center text-navy font-bold flex-shrink-0 mt-1">✓</div>
                  <span style={{ fontSize: '1.1rem', lineHeight: '1.6' }}><strong>{t.aiGuidance}</strong> {t.aiGuidanceDesc}</span>
                </li>
              </ul>
            </div>
            
            <div className="flex justify-center items-center" style={{ flex: '1 1 300px' }}>
              <div className="glass-panel p-8 text-center" style={{ background: 'rgba(255, 255, 255, 0.98)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.5)', width: '100%', maxWidth: '350px' }}>
                <h3 className="mb-4 text-saffron uppercase tracking-widest text-sm font-black">{t.nextElection}</h3>
                <p className="text-navy font-black text-5xl mb-4" style={{ letterSpacing: '-2px' }}>{t.nextElectionYear}</p>
                <p className="text-sm font-bold text-muted">{t.nextElectionDesc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Voter Assistance & Services Section */}
        <section className="mt-20 mb-20 animate-fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '5rem auto' }}>
          <h2 className="text-center mb-10 text-navy" style={{ fontSize: '2rem' }}>{language === 'hi' ? 'मतदाता सहायता एवं सेवाएँ' : language === 'pa' ? 'ਵੋਟਰ ਸਹਾਇਤਾ ਅਤੇ ਸੇਵਾਵਾਂ' : 'Voter Assistance & Services'}</h2>
          
          <div className="grid gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {/* Service 1: Find Polling Booth */}
            <a href="https://electoralsearch.eci.gov.in/" target="_blank" rel="noopener noreferrer" className="glass-panel p-6 hover-scale text-center border-t-4 border-saffron group" style={{ textDecoration: 'none' }}>
              <div className="w-16 h-16 mx-auto bg-saffron/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-saffron/20 transition-colors">
                <span style={{ fontSize: '2rem' }}>📍</span>
              </div>
              <h3 className="text-navy mb-2" style={{ fontSize: '1.2rem' }}>{language === 'hi' ? 'अपना बूथ खोजें' : language === 'pa' ? 'ਆਪਣਾ ਬੂਥ ਲੱਭੋ' : 'Find Your Booth'}</h3>
              <p className="text-muted text-sm">{language === 'hi' ? 'अपने मतदान केंद्र का पता और विवरण जानें।' : language === 'pa' ? 'ਆਪਣੇ ਪੋਲਿੰਗ ਸਟੇਸ਼ਨ ਦਾ ਪਤਾ ਅਤੇ ਵੇਰਵੇ ਜਾਣੋ।' : 'Locate your exact polling station and address.'}</p>
            </a>

            {/* Service 2: Download Voter Slip */}
            <a href="https://voters.eci.gov.in/" target="_blank" rel="noopener noreferrer" className="glass-panel p-6 hover-scale text-center border-t-4 border-green group" style={{ textDecoration: 'none' }}>
              <div className="w-16 h-16 mx-auto bg-green/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-green/20 transition-colors">
                <span style={{ fontSize: '2rem' }}>📄</span>
              </div>
              <h3 className="text-navy mb-2" style={{ fontSize: '1.2rem' }}>{language === 'hi' ? 'वोटर स्लिप डाउनलोड करें' : language === 'pa' ? 'ਵੋਟਰ ਸਲਿੱਪ ਡਾਊਨਲੋਡ ਕਰੋ' : 'Download Voter Slip'}</h3>
              <p className="text-muted text-sm">{language === 'hi' ? 'मतदान के दिन के लिए अपनी आधिकारिक ई-वोटर स्लिप प्राप्त करें।' : language === 'pa' ? 'ਵੋਟਿੰਗ ਵਾਲੇ ਦਿਨ ਲਈ ਆਪਣੀ ਅਧਿਕਾਰਤ ਈ-ਵੋਟਰ ਸਲਿੱਪ ਪ੍ਰਾਪਤ ਕਰੋ।' : 'Get your official e-voter slip for election day.'}</p>
            </a>

            {/* Service 3: Know Your Candidate */}
            <a href="https://affidavit.eci.gov.in/" target="_blank" rel="noopener noreferrer" className="glass-panel p-6 hover-scale text-center border-t-4 border-navy group" style={{ textDecoration: 'none' }}>
              <div className="w-16 h-16 mx-auto bg-navy/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-navy/20 transition-colors">
                <span style={{ fontSize: '2rem' }}>👤</span>
              </div>
              <h3 className="text-navy mb-2" style={{ fontSize: '1.2rem' }}>{language === 'hi' ? 'अपने उम्मीदवार को जानें' : language === 'pa' ? 'ਆਪਣੇ ਉਮੀਦਵਾਰ ਨੂੰ ਜਾਣੋ' : 'Know Your Candidate'}</h3>
              <p className="text-muted text-sm">{language === 'hi' ? 'अपने क्षेत्र के उम्मीदवारों के हलफनामे और पृष्ठभूमि की जाँच करें।' : language === 'pa' ? 'ਆਪਣੇ ਖੇਤਰ ਦੇ ਉਮੀਦਵਾਰਾਂ ਦੇ ਹਲਫਨਾਮੇ ਅਤੇ ਪਿਛੋਕੜ ਦੀ ਜਾਂਚ ਕਰੋ।' : 'Check affidavits and backgrounds of candidates in your area.'}</p>
            </a>
          </div>
        </section>

        {/* Voting Journey Timeline (Chain) */}
        <section className="animate-fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '2rem auto 3rem auto' }}>
          <h2 className="text-center mb-8 text-navy" style={{ fontSize: '2rem' }}>
            {language === 'hi' ? 'मतदान की प्रक्रिया' : language === 'pa' ? 'ਵੋਟਿੰਗ ਪ੍ਰਕਿਰਿਆ' : 'Your Voting Journey'}
          </h2>
          
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 px-4 py-8">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-[4rem] left-[10%] w-[80%] h-1 bg-navy/20 z-0"></div>
            {/* Connecting Line for Mobile */}
            <div className="md:hidden absolute left-1/2 top-[10%] h-[80%] w-1 bg-navy/20 -translate-x-1/2 z-0"></div>

            {[
              { step: 1, title: language === 'hi' ? 'पंजीकरण' : language === 'pa' ? 'ਰਜਿਸਟ੍ਰੇਸ਼ਨ' : 'Register', desc: language === 'hi' ? 'फॉर्म 6 भरें' : language === 'pa' ? 'ਫਾਰਮ 6 ਭਰੋ' : 'Submit Form 6 online', icon: '📝' },
              { step: 2, title: language === 'hi' ? 'नाम जाँचें' : language === 'pa' ? 'ਨਾਮ ਚੈੱਕ ਕਰੋ' : 'Verify', desc: language === 'hi' ? 'मतदाता सूची में नाम देखें' : language === 'pa' ? 'ਵੋਟਰ ਸੂਚੀ ਵਿੱਚ ਨਾਮ ਵੇਖੋ' : 'Check name in voter list', icon: '🔍' },
              { step: 3, title: language === 'hi' ? 'बूथ खोजें' : language === 'pa' ? 'ਬੂਥ ਲੱਭੋ' : 'Locate', desc: language === 'hi' ? 'अपना मतदान केंद्र जानें' : language === 'pa' ? 'ਆਪਣਾ ਪੋਲਿੰਗ ਸਟੇਸ਼ਨ ਜਾਣੋ' : 'Find your polling booth', icon: '📍' },
              { step: 4, title: language === 'hi' ? 'मतदान' : language === 'pa' ? 'ਵੋਟਿੰਗ' : 'Vote', desc: language === 'hi' ? 'ईवीएम पर बटन दबाएं' : language === 'pa' ? 'ਈਵੀਐਮ ਤੇ ਬਟਨ ਦਬਾਓ' : 'Cast vote on EVM & verify', icon: '🗳️' }
            ].map((item, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center group w-full md:w-1/4">
                <div className="w-16 h-16 rounded-full bg-white shadow-[0_0_20px_rgba(0,0,0,0.1)] border-4 border-saffron flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:border-green">
                  <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                </div>
                <div className="glass-panel p-4 text-center w-full max-w-[200px] border-t-2 border-navy/10 group-hover:border-navy/50 transition-colors">
                  <div className="text-saffron font-bold text-xs uppercase tracking-widest mb-1">Step {item.step}</div>
                  <h3 className="text-navy font-bold mb-1 text-lg">{item.title}</h3>
                  <p className="text-muted text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 animate-fade-in" style={{ width: '100%', maxWidth: '900px', margin: '5rem auto' }}>
          <h2 className="text-center mb-12 gradient-text">{t.electionUpdates}</h2>
          <div className="grid gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="glass-panel p-6 border-l-4" style={{ borderColor: 'var(--saffron)' }}>
              <h3 className="text-navy mb-2">{t.panchayatElection}</h3>
              <p className="text-muted mb-4">{t.panchayatDesc}</p>
              <div className="flex items-center gap-2 text-sm font-bold text-saffron">
                <span className="animate-pulse">●</span> {language === 'hi' ? 'ताज़ा अपडेट' : language === 'pa' ? 'ਤਾਜ਼ਾ ਅੱਪਡੇਟ' : 'Live Updates'}
              </div>
            </div>
            
            <div className="glass-panel p-6 border-l-4" style={{ borderColor: 'var(--green)' }}>
              <h3 className="text-navy mb-2">{t.vidhanSabhaElection}</h3>
              <p className="text-muted mb-4">{t.vidhanSabhaDesc}</p>
              <div className="flex items-center gap-2 text-sm font-bold text-green">
                <span className="animate-pulse">●</span> {language === 'hi' ? 'आगामी कार्यक्रम' : language === 'pa' ? 'ਆਉਣ ਵਾਲਾ ਸਮਾਂ' : 'Upcoming Schedule'}
              </div>
            </div>
          </div>
        </section>

        <StateWiseUpdates />
        
        <footer className="mt-12 text-center text-muted" style={{ paddingBottom: '2rem' }}>
          <p>{t.footer}</p>
        </footer>
      </div>
    </>
  );
}
