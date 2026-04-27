import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { User, LogOut, Camera, Calendar, Mail, Loader, Info, X } from 'lucide-react';
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
      alert("Failed to update role.");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
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
        // The context user object might need a full reload to reflect everywhere,
        // but since we only display it in the profile right now, local state is enough!
      } catch (err) {
        console.error("Failed to upload image", err);
        alert("Failed to upload profile picture.");
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const username = user?.email?.split('@')[0] || user?.name?.toLowerCase().replace(/\s/g, '');

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] flex flex-col items-center">
      <h1 className="text-2xl font-bold text-white w-full max-w-sm text-center mb-4">My Profile</h1>
      
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
             <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-400 bg-black/20 flex items-center justify-center shadow-2xl relative">
                {profileImage ? (
                   <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <User className="w-16 h-16 text-indigo-300" />
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   {loading ? <Loader className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                </div>
             </div>
          </div>

          {/* User Details */}
          <h2 className="text-3xl font-bold text-white tracking-wide">{user?.name}</h2>
          <p className="text-indigo-300 font-medium mb-6">@{username}</p>

          <div className="w-full space-y-4 text-left">
             <div className="bg-white/5 rounded-xl p-4 flex items-center border border-white/10">
                <Mail className="w-5 h-5 text-purple-300 mr-3" />
                <div>
                   <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">Email</p>
                   <p className="text-white font-medium">{user?.email}</p>
                </div>
             </div>

             <div className="bg-white/5 rounded-xl p-4 flex items-center border border-white/10">
                <User className="w-5 h-5 text-blue-300 mr-3" />
                <div className="flex-1">
                   <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">Role</p>
                   <select 
                       value={localRole} 
                       onChange={handleRoleChange}
                       className="bg-transparent text-white font-medium outline-none cursor-pointer w-full"
                   >
                       <option value="Normal User" className="text-black">Normal User</option>
                       <option value="ASHA" className="text-black">ASHA</option>
                       {user?.role && !['Normal User', 'ASHA', 'User', 'Health Worker'].includes(user.role) && (
                           <option value={user.role} className="text-black">{user.role}</option>
                       )}
                   </select>
                </div>
             </div>
             
             <div className="bg-white/5 rounded-xl p-4 flex items-center border border-white/10">
                <Calendar className="w-5 h-5 text-green-300 mr-3" />
                <div>
                   <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">Member Since</p>
                   <p className="text-white font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</p>
                </div>
             </div>
          </div>
        </div>
      </GlassCard>

      {/* About Us Button */}
      <button 
         onClick={() => setShowAboutModal(true)}
         className="w-full max-w-sm flex items-center justify-center p-4 bg-blue-500/20 border border-blue-500/40 hover:bg-blue-500/30 rounded-xl text-blue-200 font-bold transition-colors shadow-lg"
      >
         <Info className="w-5 h-5 mr-2" />
         About Us
      </button>

      {/* Logout Button */}
      <button 
         onClick={() => { logout(); navigate('/login'); }}
         className="w-full max-w-sm flex items-center justify-center p-4 bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 rounded-xl text-red-200 font-bold transition-colors shadow-lg"
      >
         <LogOut className="w-5 h-5 mr-2" />
         Logout from CuraPind AI
      </button>

      {/* Back Button */}
      <button 
         onClick={() => navigate('/')}
         className="w-full max-w-sm py-3 text-white/70 hover:text-white transition-colors"
      >
         Back to Dashboard
      </button>

      {/* About Us Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <GlassCard className="max-w-md w-full relative">
            <button 
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-4 pr-8">About CuraPind AI</h2>
            <div className="text-white/80 space-y-4">
              <p>
                Our AI model is designed to provide immediate health triaging and rural healthcare assistance. 
                It leverages advanced natural language processing to listen to patient symptoms, analyze them 
                against medical databases, and suggest potential preliminary diagnoses.
              </p>
              <p>
                <strong>How it works:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Users or health workers (ASHA) input their health data or symptoms.</li>
                <li>The AI processes the inputs locally or via secure cloud APIs.</li>
                <li>Provides actionable next steps, first-aid advice, or alerts for critical conditions.</li>
              </ul>
              <p className="text-sm text-white/60 mt-4 italic">
                Disclaimer: CuraPind AI is an assistant tool and does not replace professional medical advice.
              </p>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
};

export default Profile;
