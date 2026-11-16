import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { User, LogOut, Camera, Calendar, Mail, Loader, Info, X, ChevronLeft, Shield } from 'lucide-react';
import api from '../api';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [loading, setLoading] = useState(false);
  const [localRole, setLocalRole] = useState(user?.role === 'Health Worker' ? 'ASHA' : (user?.role === 'User' ? 'Normal User' : (user?.role || 'Normal User')));
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    setLocalRole(newRole);
    try {
      await api.put('/auth/profile', { role: newRole });
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
       alert("Image is too large. Please select an image under 2MB.");
       return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setProfileImage(base64String);
      setLoading(true);

      try {
        await api.put('/auth/profile', { profileImage: base64String });
      } catch (err) {
        console.error("Failed to upload image", err);
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const username = user?.email?.split('@')[0] || user?.name?.toLowerCase().replace(/\s/g, '');

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <button onClick={() => navigate('/')} className="hover:bg-zinc-800 p-2 rounded-xl transition-colors">
          <ChevronLeft className="w-6 h-6 text-zinc-300" />
        </button>
        <h1 className="text-xl font-bold text-white text-center">My Profile</h1>
        <div className="w-10"></div>
      </div>
      
      <GlassCard className="w-full max-w-sm relative">
        <div className="flex flex-col items-center">
          
          {/* Avatar Upload Container */}
          <div className="relative mb-6 group cursor-pointer">
             <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
             />
             <div className="w-24 h-24 rounded-full border-2 border-[#29A683] shadow-[0_0_20px_rgba(41,166,131,0.3)] overflow-hidden bg-zinc-900 flex items-center justify-center relative">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-[#29A683]" />
                )}
                {loading && (
                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader className="w-6 h-6 text-[#29A683] animate-spin" />
                   </div>
                )}
             </div>
             <div className="absolute bottom-0 right-0 bg-[#29A683] p-1.5 rounded-full text-black shadow-lg">
                <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
             </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-0.5">{user?.name || 'Healthcare User'}</h2>
          <p className="text-xs text-[#29A683] font-mono mb-4">@{username}</p>

          <div className="w-full space-y-3 pt-3 border-t border-zinc-800 text-sm">
            <div className="flex items-center justify-between text-zinc-300 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
               <span className="flex items-center text-xs text-zinc-400">
                  <Mail className="w-4 h-4 mr-2 text-[#29A683]" /> Email
               </span>
               <span className="font-medium text-xs text-white">{user?.email || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between text-zinc-300 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
               <span className="flex items-center text-xs text-zinc-400">
                  <Shield className="w-4 h-4 mr-2 text-[#29A683]" /> Role
               </span>
               <select 
                  value={localRole}
                  onChange={handleRoleChange}
                  className="bg-black/50 border border-zinc-700 text-[#D2FF8F] text-xs font-bold rounded-lg px-2 py-1 outline-none"
               >
                  <option value="ASHA" className="bg-zinc-900 text-white">ASHA Worker</option>
                  <option value="Normal User" className="bg-zinc-900 text-white">Citizen</option>
               </select>
            </div>
          </div>

          <button 
             onClick={logout}
             className="w-full mt-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold rounded-xl transition-all text-xs flex items-center justify-center"
          >
             <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Profile;
