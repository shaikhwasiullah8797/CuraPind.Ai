import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import api from '../api';
import { Activity, Clock, ChevronLeft, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

const History = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            const localSaved = JSON.parse(localStorage.getItem('curapind_reports') || '[]');
            try {
                const res = await api.get('/health/history');
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    const combined = [...res.data];
                    const existingIds = new Set(res.data.map(r => r._id || r.id));
                    localSaved.forEach(localR => {
                        const id = localR._id || localR.id;
                        if (!existingIds.has(id)) {
                            combined.push(localR);
                        }
                    });
                    setReports(combined);
                } else {
                    setReports(localSaved);
                }
            } catch (err) {
                console.warn('Backend history fetch error, falling back to local history store:', err);
                setReports(localSaved);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getRiskIcon = (level) => {
        if (level === 'Low Risk') return <ShieldCheck className="w-5 h-5 text-[#29A683]" />;
        if (level === 'Moderate Risk') return <Shield className="w-5 h-5 text-amber-400" />;
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
    };

    const getRiskColor = (level) => {
        if (level === 'Low Risk') return 'text-[#29A683] border-[#29A683]/40 bg-[#29A683]/10';
        if (level === 'Moderate Risk') return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
        return 'text-rose-400 border-rose-500/40 bg-rose-500/15';
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center text-white mb-6">
                <button onClick={() => navigate('/')} className="hover:bg-zinc-800 p-2 rounded-xl transition-colors mr-2">
                    <ChevronLeft className="w-6 h-6 text-zinc-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Health History</h1>
                    <p className="text-xs text-[#29A683] font-mono">Recorded Triage Reports</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-zinc-400 py-8 font-medium">Loading history...</div>
            ) : reports.length === 0 ? (
                <GlassCard className="text-center py-10">
                    <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-300 font-medium">No health triage history found yet.</p>
                    <button 
                        onClick={() => navigate('/health-check')}
                        className="glass-button mt-4 text-sm"
                    >
                        Start Health Check
                    </button>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {reports.map((report, idx) => (
                        <GlassCard key={report._id || report.id || idx} className="p-4 hover:border-[#29A683]/50 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                    {getRiskIcon(report.riskLevel)}
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRiskColor(report.riskLevel)}`}>
                                        {report.riskLevel}
                                    </span>
                                </div>
                                <span className="text-xs text-zinc-400 flex items-center font-mono">
                                    <Clock className="w-3.5 h-3.5 mr-1 text-[#29A683]" />
                                    {new Date(report.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <p className="font-bold text-white text-base">
                                Patient: {report.patientName || 'Self'}
                                {report.villageName && <span className="text-xs text-zinc-400 font-normal ml-2">({report.villageName})</span>}
                            </p>

                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800 text-center text-xs">
                                <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                                    <p className="text-zinc-400 text-[10px]">Temperature</p>
                                    <p className="text-white font-bold">{report.bodyTemperature}°F</p>
                                </div>
                                <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                                    <p className="text-zinc-400 text-[10px]">Heart Rate</p>
                                    <p className="text-white font-bold">{report.heartRate} bpm</p>
                                </div>
                                <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                                    <p className="text-zinc-400 text-[10px]">SpO2</p>
                                    <p className="text-white font-bold">{report.spO2}%</p>
                                </div>
                            </div>

                            <div className="mt-3 bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl">
                                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Action</p>
                                <p className="text-xs text-zinc-200 mt-0.5 leading-relaxed">{report.recommendedAction}</p>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
