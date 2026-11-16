import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { 
    getSurveillanceSummary, 
    logTriageEntry, 
    clearSurveillanceLog 
} from '../utils/triageSurveillance';
import { 
    ShieldAlert, 
    ChevronLeft, 
    Flame, 
    Droplets, 
    Wind, 
    AlertTriangle, 
    CheckCircle2, 
    RefreshCw, 
    PlusCircle,
    Building2,
    Calendar,
    Users
} from 'lucide-react';

const BMOSurveillance = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [filterSyndrome, setFilterSyndrome] = useState('all');

    const refreshData = () => {
        const data = getSurveillanceSummary(48);
        setSummary(data);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const injectDemoCluster = (villageName = 'Chandpur') => {
        for (let i = 0; i < 5; i++) {
            logTriageEntry({
                villageName,
                riskLevel: i % 2 === 0 ? 'Critical Risk' : 'Moderate Risk',
                age: 28 + i * 5,
                bodyTemperature: 101.2 + (i * 0.2),
                diarrhoea: 'Severe',
                respiratoryRate: 24,
                spO2: 94,
                whoDangerSigns: ['Unable to Drink / Severe Dehydration']
            });
        }
        refreshData();
    };

    const handleClear = () => {
        if (window.confirm('Clear all local surveillance logs?')) {
            clearSurveillanceLog();
            refreshData();
        }
    };

    if (!summary) return null;

    const filteredVillages = summary.villages.filter(v => {
        if (filterSyndrome === 'alerts') return !!v.alert;
        if (filterSyndrome === 'diarrhoea') return v.diarrhoeaCases > 0;
        if (filterSyndrome === 'fever') return v.feverCases > 0;
        if (filterSyndrome === 'respiratory') return v.respiratoryCases > 0;
        return true;
    });

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center text-zinc-300 hover:text-white transition-colors text-sm font-medium"
                >
                    <ChevronLeft className="w-5 h-5 mr-1 text-zinc-300" />
                    Back to Dashboard
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshData}
                        className="p-2 bg-zinc-900 border border-zinc-700 hover:border-[#29A683] rounded-lg text-zinc-300 hover:text-white transition-all text-xs flex items-center"
                        title="Refresh surveillance"
                    >
                        <RefreshCw className="w-4 h-4 text-[#29A683]" />
                    </button>
                    <button
                        onClick={() => injectDemoCluster('Chandpur')}
                        className="px-2.5 py-1.5 bg-[#29A683] hover:bg-[#238C6E] text-black font-extrabold rounded-lg text-xs transition-all flex items-center shadow-[0_0_15px_rgba(41,166,131,0.3)]"
                    >
                        <PlusCircle className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                        Simulate Outbreak (+5)
                    </button>
                </div>
            </div>

            {/* Header Card */}
            <GlassCard className="p-6">
                <div className="flex items-start justify-between border-b border-zinc-700/60 pb-4 mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-[#29A683]" />
                            <h1 className="text-xl font-bold text-white tracking-tight">BMO Outbreak Surveillance</h1>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1">
                            Block Medical Officer (BMO) Cluster Warning System • 48-Hour Surveillance Window
                        </p>
                    </div>

                    {summary.alertedVillages > 0 ? (
                        <div className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/50 px-3 py-1.5 rounded-full text-rose-300 text-xs font-bold animate-pulse">
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            {summary.alertedVillages} Outbreak Alert{summary.alertedVillages > 1 ? 's' : ''} Active
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-[#29A683]/15 border border-[#29A683]/40 px-3 py-1.5 rounded-full text-[#D2FF8F] text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-[#29A683]" />
                            Normal Baseline
                        </div>
                    )}
                </div>

                {/* Key Metric KPIs */}
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-400 font-semibold flex items-center justify-center">
                            <Users className="w-3.5 h-3.5 mr-1 text-[#29A683]" /> Total Cases (48h)
                        </p>
                        <p className="text-2xl font-black text-white mt-1 font-mono">{summary.totalEntries}</p>
                    </div>

                    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-400 font-semibold flex items-center justify-center">
                            <Building2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Monitored Wards
                        </p>
                        <p className="text-2xl font-black text-white mt-1 font-mono">{summary.totalVillages}</p>
                    </div>

                    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-400 font-semibold flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" /> Flagged Clusters
                        </p>
                        <p className={`text-2xl font-black mt-1 font-mono ${summary.alertedVillages > 0 ? 'text-rose-400' : 'text-[#29A683]'}`}>
                            {summary.alertedVillages}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-zinc-700/60 overflow-x-auto text-xs">
                    <span className="text-zinc-400 font-semibold mr-1 flex-shrink-0">Filter:</span>
                    {[
                        { id: 'all', label: 'All Villages' },
                        { id: 'alerts', label: `Alerts (${summary.alertedVillages})` },
                        { id: 'diarrhoea', label: 'Diarrhoea' },
                        { id: 'fever', label: 'Fever' },
                        { id: 'respiratory', label: 'Respiratory' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilterSyndrome(f.id)}
                            className={`px-3 py-1 rounded-full whitespace-nowrap font-bold transition-all ${
                                filterSyndrome === f.id
                                    ? 'bg-[#29A683] text-black shadow-sm'
                                    : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-600'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </GlassCard>

            {/* Outbreak Alert Banner */}
            {summary.alertedVillages > 0 && (
                <div className="space-y-3">
                    {summary.villages.filter(v => v.alert).map((v, idx) => (
                        <div key={idx} className="bg-rose-950/60 border-2 border-rose-500/70 rounded-2xl p-4 text-white shadow-xl animate-[pulse_2.5s_infinite]">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                                    <span className="font-extrabold text-base uppercase tracking-wider text-rose-200">
                                        Epidemic Alert: {v.villageName}
                                    </span>
                                </div>
                                <span className="bg-rose-500 text-black font-mono text-xs px-2.5 py-0.5 rounded-full font-black">
                                    {v.totalCases} cases / 48h
                                </span>
                            </div>

                            <div className="space-y-1.5 pl-7">
                                {v.alert.alerts.map((al, aIdx) => (
                                    <p key={aIdx} className="text-xs text-rose-200 font-medium">
                                        • {al.message}
                                    </p>
                                ))}
                            </div>

                            <div className="mt-3 pt-3 border-t border-rose-500/40 flex items-center justify-between text-xs text-rose-300">
                                <span>Action: Dispatch mobile rapid response team & chlorination kit.</span>
                                <span className="font-mono font-bold text-white">{v.criticalCases} Critical</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Village Listing */}
            <div className="space-y-3">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                    Village-Level Surveillance Breakdown
                </h2>

                {filteredVillages.length === 0 ? (
                    <GlassCard className="text-center py-10 text-zinc-400">
                        <Building2 className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                        <p className="text-sm font-semibold text-white">No surveillance records logged in the past 48 hours.</p>
                        <p className="text-xs text-zinc-400 mt-1">
                            New triage records from ASHA workers will automatically register here.
                        </p>
                    </GlassCard>
                ) : (
                    filteredVillages.map((v, idx) => (
                        <GlassCard key={idx} className={`p-4 transition-all ${v.alert ? 'border-rose-500/50 bg-rose-950/25' : 'border-zinc-800 hover:border-[#29A683]/40'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="font-extrabold text-white capitalize text-base">{v.villageName}</h3>
                                    <p className="text-xs text-zinc-400">{v.totalCases} total triage evaluations</p>
                                </div>
                                {v.alert ? (
                                    <span className="px-2.5 py-1 bg-rose-500/30 border border-rose-500/60 rounded-full text-[11px] font-bold text-rose-300">
                                        Outbreak Flagged
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-1 bg-[#29A683]/15 border border-[#29A683]/30 rounded-full text-[11px] text-[#D2FF8F] font-semibold">
                                        Normal
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-800 text-center text-xs">
                                <div className="bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                                    <span className="text-zinc-400 text-[10px] flex items-center justify-center font-medium">
                                        <Droplets className="w-3 h-3 mr-1 text-cyan-400" /> Diarrhoea
                                    </span>
                                    <span className={`font-mono font-bold mt-0.5 block ${v.diarrhoeaCases >= 5 ? 'text-rose-400 text-sm' : 'text-white'}`}>
                                        {v.diarrhoeaCases}
                                    </span>
                                </div>

                                <div className="bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                                    <span className="text-zinc-400 text-[10px] flex items-center justify-center font-medium">
                                        <Flame className="w-3 h-3 mr-1 text-amber-400" /> Fever
                                    </span>
                                    <span className={`font-mono font-bold mt-0.5 block ${v.feverCases >= 5 ? 'text-rose-400 text-sm' : 'text-white'}`}>
                                        {v.feverCases}
                                    </span>
                                </div>

                                <div className="bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                                    <span className="text-zinc-400 text-[10px] flex items-center justify-center font-medium">
                                        <Wind className="w-3 h-3 mr-1 text-[#29A683]" /> Respiratory
                                    </span>
                                    <span className={`font-mono font-bold mt-0.5 block ${v.respiratoryCases >= 5 ? 'text-rose-400 text-sm' : 'text-white'}`}>
                                        {v.respiratoryCases}
                                    </span>
                                </div>

                                <div className="bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                                    <span className="text-zinc-400 text-[10px] flex items-center justify-center font-medium">
                                        <ShieldAlert className="w-3 h-3 mr-1 text-rose-400" /> Critical
                                    </span>
                                    <span className={`font-mono font-bold mt-0.5 block ${v.criticalCases > 0 ? 'text-rose-400' : 'text-white'}`}>
                                        {v.criticalCases}
                                    </span>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            <div className="flex justify-between items-center pt-2">
                <button
                    onClick={handleClear}
                    className="text-xs text-zinc-400 hover:text-rose-300 transition-colors"
                >
                    Clear Surveillance History
                </button>
                <p className="text-[11px] text-zinc-400">
                    Compliant with Integrated Disease Surveillance Programme (IDSP)
                </p>
            </div>
        </div>
    );
};

export default BMOSurveillance;
