import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { Activity, History, User, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Hello, {user?.name || 'User'}</h1>
          <p className="text-white/70">How are you feeling today?</p>
        </div>
        <button onClick={logout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <LogOut className="w-5 h-5 text-white" />
        </button>
      </div>

      <GlassCard className="text-center group cursor-pointer hover:bg-white/10 transition-colors" >
        <div onClick={() => navigate('/health-check')} className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Start Health Check</h2>
          <p className="text-white/70 text-sm max-w-xs px-4">
            Answer a few simple questions to understand your health risk level.
          </p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="flex flex-col items-center cursor-pointer hover:bg-white/10 transition-colors p-4 sm:p-4" >
          <div onClick={() => navigate('/history')} className="w-full flex flex-col items-center">
             <History className="w-8 h-8 text-blue-300 mb-2" />
             <span className="text-white font-medium">History</span>
          </div>
        </GlassCard>
        
        <GlassCard className="flex flex-col items-center cursor-pointer hover:bg-white/10 transition-colors p-4 sm:p-4" >
          <div onClick={() => navigate('/profile')} className="w-full flex flex-col items-center">
             <User className="w-8 h-8 text-purple-300 mb-2" />
             <span className="text-white font-medium">Profile</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Dashboard;
