import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GlassCard from '../../components/GlassCard';
import { ShieldAlert, ShieldCheck, Shield, ChevronLeft } from 'lucide-react';

const Result = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const result = location.state?.result;

    if (!result) {
        return (
            <div className="text-white text-center mt-20">
                <p>No results found.</p>
                <button onClick={() => navigate('/')} className="glass-button mt-4">Go to Dashboard</button>
            </div>
        );
    }

    const { riskLevel, confidenceScore, recommendedAction } = result;

    let theme = {
        color: 'text-green-400',
        bg: 'bg-green-500/20',
        icon: <ShieldCheck className="w-16 h-16 text-green-400" />,
        alertText: 'Low Risk'
    };

    if (riskLevel === 'Moderate Risk') {
        theme = {
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/20',
            icon: <Shield className="w-16 h-16 text-yellow-400" />,
            alertText: 'Moderate Risk'
        };
    } else if (riskLevel === 'Critical Risk') {
        theme = {
            color: 'text-red-400',
            bg: 'bg-red-500/20',
            icon: <ShieldAlert className="w-16 h-16 text-red-400" />,
            alertText: 'High Risk / Critical'
        };
    }

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <button onClick={() => navigate('/')} className="flex items-center text-white/70 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Dashboard
            </button>

            <GlassCard className={`text-center flex flex-col items-center ${theme.bg} border-${theme.color.split('-')[1]}-500/30`}>
                <div className="mb-4">
                    {theme.icon}
                </div>
                <h1 className={`text-3xl font-bold mb-2 ${theme.color}`}>
                    {theme.alertText}
                </h1>
                <p className="text-white/80 max-w-sm mb-6">
                    Based on the symptoms and vitals provided, the AI triage system has classified the risk level.
                </p>

                <div className="w-full bg-white/10 p-4 rounded-xl mb-6">
                    <p className="text-sm text-white/50 mb-1">Recommended Action</p>
                    <p className="text-xl font-bold text-white">{recommendedAction}</p>
                </div>

                <div className="w-full flex justify-between items-center text-sm">
                    <span className="text-white/60">Confidence Score:</span>
                    <span className="text-white font-mono font-bold bg-white/20 px-3 py-1 rounded-full text-xs">
                        {confidenceScore}%
                    </span>
                </div>
            </GlassCard>

            <p className="text-xs text-white/40 text-center px-4">
                Disclaimer: This is a predictive tool intended for triage purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
        </div>
    );
};

export default Result;
