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
            try {
                const res = await api.get('/health/history');
                setReports(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getRiskIcon = (level) => {
        if (level === 'Low Risk') return <ShieldCheck className="w-5 h-5 text-green-400" />;
        if (level === 'Moderate Risk') return <Shield className="w-5 h-5 text-yellow-400" />;
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
    };

    const getRiskColor = (level) => {
        if (level === 'Low Risk') return 'text-green-400 border-green-500/30 bg-green-500/10';
        if (level === 'Moderate Risk') return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
        return 'text-red-400 border-red-500/30 bg-red-500/10';
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center text-white mb-6">
                <button onClick={() => navigate('/')} className="hover:bg-white/10 p-2 rounded-full transition-colors mr-2">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">Health History</h1>
            </div>

            {loading ? (
                <div className="text-center text-white/50">Loading history...</div>
            ) : reports.length === 0 ? (
                <GlassCard className="text-center">
                    <Activity className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/70">No health history found.</p>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {reports.map((report) => (
                        <div key={report._id} className={`p-4 rounded-xl border backdrop-blur-md flex items-center justify-between transition-all hover:scale-[1.02] cursor-default ${getRiskColor(report.riskLevel)}`}>
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-white/10 rounded-full">
                                    {getRiskIcon(report.riskLevel)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Patient: {report.patientName || 'Self'}</h3>
                                    <p className="text-sm font-semibold">{report.riskLevel}</p>
                                    <div className="flex items-center text-xs text-white/60 mt-1">
                                        <span>SpO2: {report.spO2}% | HR: {report.heartRate}</span>
                                    </div>
                                    <div className="flex items-center text-xs text-white/40 mt-1">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs bg-white/20 px-2 py-1 rounded text-white font-mono">
                                    {report.confidenceScore}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
