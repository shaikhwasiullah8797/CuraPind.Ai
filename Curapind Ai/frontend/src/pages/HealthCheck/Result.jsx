import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GlassCard from '../../components/GlassCard';
import ReferralBridge from '../../components/ReferralBridge';
import { ShieldAlert, ShieldCheck, Shield, ChevronLeft, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

const Result = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const result = location.state?.result;

    if (!result) {
        return (
            <div className="text-white text-center mt-20">
                <p className="text-zinc-300">No triage evaluation results found.</p>
                <button onClick={() => navigate('/')} className="glass-button mt-4">Go to Dashboard</button>
            </div>
        );
    }

    const { riskLevel, confidenceScore, recommendedAction, riskDrivers = [] } = result;

    let theme = {
        color: 'text-[#D2FF8F]',
        bg: 'bg-[#29A683]/15',
        borderColor: 'border-[#29A683]/50',
        icon: <ShieldCheck className="w-16 h-16 text-[#D2FF8F]" />,
        alertText: 'Low Risk'
    };

    if (riskLevel === 'Moderate Risk') {
        theme = {
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            borderColor: 'border-amber-500/40',
            icon: <Shield className="w-16 h-16 text-amber-400" />,
            alertText: 'Moderate Risk'
        };
    } else if (riskLevel === 'Critical Risk') {
        theme = {
            color: 'text-rose-400',
            bg: 'bg-rose-500/15',
            borderColor: 'border-rose-500/50',
            icon: <ShieldAlert className="w-16 h-16 text-rose-400 animate-pulse" />,
            alertText: 'High Risk / Critical'
        };
    }

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <button onClick={() => navigate('/')} className="flex items-center text-[#8ea096] hover:text-[#F2F2F2] transition-colors font-medium text-sm">
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Dashboard
            </button>

            <GlassCard className={`text-center flex flex-col items-center ${theme.bg} ${theme.borderColor} shadow-[0_0_35px_rgba(0,0,0,0.6)]`}>
                <div className="mb-3">
                    {theme.icon}
                </div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase mb-1 bg-[#000000]/60 border border-[#238C6E]/50 text-[#D2FF8F]">
                    Clinical Decision Result
                </div>
                <h1 className={`text-3xl font-extrabold mb-2 tracking-tight ${theme.color}`}>
                    {theme.alertText}
                </h1>
                <p className="text-[#F2F2F2] text-sm max-w-sm mb-4 leading-relaxed font-normal">
                    Based on vitals, WHO danger signs, and multi-modal biomarkers, the AI CDS system has classified the patient risk tier.
                </p>

                {/* Top 3 Plain-Language Clinical Risk Drivers */}
                {riskDrivers && riskDrivers.length > 0 && (
                    <div className="w-full bg-[#07130e]/90 border border-[#238C6E]/60 rounded-xl p-3.5 mb-5 text-left shadow-inner">
                        <div className="flex items-center text-xs font-bold text-[#D2FF8F] uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#29A683]" />
                            Top Clinical Risk Drivers (AI Explainability)
                        </div>
                        <div className="space-y-1.5">
                            {riskDrivers.slice(0, 3).map((driver, idx) => {
                                const label = typeof driver === 'object' ? driver.label : driver;
                                return (
                                    <div key={idx} className="flex items-center text-xs text-[#F2F2F2] bg-[#0d1d16] px-3 py-2 rounded-lg border border-[#238C6E]/50">
                                        <AlertCircle className="w-3.5 h-3.5 mr-2 text-[#D2FF8F] flex-shrink-0" />
                                        <span className="font-medium">{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="w-full bg-[#0d1d16]/90 border border-[#238C6E]/60 p-4 rounded-xl mb-4 text-left">
                    <p className="text-xs uppercase font-bold text-[#8ea096] tracking-wider mb-1">Recommended Action</p>
                    <p className="text-base sm:text-lg font-bold text-[#F2F2F2] leading-snug">{recommendedAction}</p>
                </div>

                <div className="w-full flex justify-between items-center text-sm pt-3 border-t border-[#238C6E]/40">
                    <span className="text-[#8ea096] font-medium">Confidence Score:</span>
                    <span className="text-[#000000] font-mono font-black bg-gradient-to-r from-[#29A683] to-[#D2FF8F] px-3 py-1 rounded-full text-xs shadow-sm">
                        {confidenceScore}%
                    </span>
                </div>
            </GlassCard>

            {/* PHC Referral Bridge */}
            {(riskLevel === 'Moderate Risk' || riskLevel === 'Critical Risk') && (
                <GlassCard className="border border-[#238C6E]/60 bg-[#07130e]/90">
                    <ReferralBridge result={result} />
                </GlassCard>
            )}

            <p className="text-xs text-[#8ea096] text-center px-4 leading-relaxed">
                Disclaimer: This is a predictive tool intended for triage purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
        </div>
    );
};

export default Result;
