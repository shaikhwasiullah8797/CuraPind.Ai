import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { Activity, History, User, LogOut, ShieldAlert, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D2FF8F] animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-[#D2FF8F] font-bold">CuraPind Clinical Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F2F2F2] mt-0.5">Hello, {user?.name || 'User'}</h1>
          <p className="text-[#a4b8ad] text-sm">
            {user?.role === 'Health Worker' ? 'ASHA Clinical Portal • Rural Triage AI' : 'How are you feeling today?'}
          </p>
        </div>
        <button 
          onClick={logout} 
          className="p-2.5 bg-[#0d1c15] border border-[#238C6E]/60 rounded-xl hover:border-[#29A683] hover:bg-[#12281e] transition-all text-[#F2F2F2]"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 text-[#29A683] hover:text-[#D2FF8F]" />
        </button>
      </div>

      {/* Main Start Health Check Hero Card */}
      <GlassCard className="text-center group cursor-pointer hover:border-[#29A683]/80 hover:shadow-[0_0_35px_rgba(41,166,131,0.25)] transition-all relative overflow-hidden" >
        <div className="absolute inset-0 bg-gradient-to-b from-[#29A683]/10 to-transparent pointer-events-none"></div>
        <div onClick={() => navigate('/health-check')} className="flex flex-col items-center py-2 relative z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#238C6E] via-[#29A683] to-[#D2FF8F] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(41,166,131,0.4)]">
            <Activity className="w-10 h-10 text-[#000000] stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#F2F2F2] mb-2 tracking-tight group-hover:text-[#D2FF8F] transition-colors">
            Start Health Check
          </h2>
          <p className="text-[#a4b8ad] text-sm max-w-sm px-4 leading-relaxed">
            AI Triage with WHO clinical checks, Acoustic AI, and camera pulse screening.
          </p>
          <div className="mt-4 inline-flex items-center text-xs font-bold text-[#D2FF8F] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            Launch Evaluation <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </div>
      </GlassCard>

      {/* Grid Cards: History & Profile */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="flex flex-col items-center cursor-pointer hover:border-[#29A683]/60 hover:bg-[#0c1912] transition-all p-4" >
          <div onClick={() => navigate('/history')} className="w-full flex flex-col items-center">
             <div className="w-12 h-12 rounded-xl bg-[#29A683]/20 border border-[#29A683]/40 flex items-center justify-center mb-2">
               <History className="w-6 h-6 text-[#D2FF8F]" />
             </div>
             <span className="text-[#F2F2F2] font-semibold text-sm">History</span>
             <span className="text-[#8ea096] text-[11px] mt-0.5">Past evaluations</span>
          </div>
        </GlassCard>
        
        <GlassCard className="flex flex-col items-center cursor-pointer hover:border-[#29A683]/60 hover:bg-[#0c1912] transition-all p-4" >
          <div onClick={() => navigate('/profile')} className="w-full flex flex-col items-center">
             <div className="w-12 h-12 rounded-xl bg-[#238C6E]/20 border border-[#238C6E]/40 flex items-center justify-center mb-2">
               <User className="w-6 h-6 text-[#29A683]" />
             </div>
             <span className="text-[#F2F2F2] font-semibold text-sm">Profile</span>
             <span className="text-[#8ea096] text-[11px] mt-0.5">User credentials</span>
          </div>
        </GlassCard>
      </div>

      {/* BMO Outbreak Surveillance Card */}
      <GlassCard className="p-4 cursor-pointer hover:border-[#D2FF8F]/50 transition-all border border-[#29A683]/40 bg-gradient-to-r from-[#0a1711] to-[#040907] shadow-[0_0_20px_rgba(41,166,131,0.15)]">
        <div onClick={() => navigate('/surveillance')} className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#29A683]/20 border border-[#29A683]/40 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-[#D2FF8F]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[#F2F2F2] text-sm">BMO Outbreak Surveillance</h3>
                <span className="text-[10px] bg-[#D2FF8F]/20 text-[#D2FF8F] px-2 py-0.2 rounded font-mono font-bold">IDSP</span>
              </div>
              <p className="text-xs text-[#a4b8ad]">Cluster monitoring & village epidemic alerts</p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-gradient-to-r from-[#29A683] to-[#D2FF8F] text-[#000000] font-extrabold text-xs rounded-lg transition-all shadow">
            Open &rarr;
          </span>
        </div>
      </GlassCard>
    </div>
  );
};

export default Dashboard;
