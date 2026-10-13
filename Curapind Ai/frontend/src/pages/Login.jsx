import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import api from '../api';
import { Stethoscope, UserCheck, Shield } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleDemoLogin = (role = 'Health Worker') => {
    const demoUser = {
      id: 'demo_' + (role === 'Health Worker' ? 'worker' : 'user'),
      name: role === 'Health Worker' ? 'Dr. Asha Devi (ASHA Worker)' : 'Rahul Sharma',
      email: role === 'Health Worker' ? 'asha@curapind.com' : 'rahul@curapind.com',
      role: role
    };
    login('demo_token_' + Date.now(), demoUser);
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        login(res.data.token, res.data.user);
      } else {
        const res = await api.post('/auth/register', formData);
        login(res.data.token, res.data.user);
      }
      navigate('/');
    } catch (err) {
      console.warn('Backend authentication error, checking local fallback:', err);
      // If network error / backend offline (e.g. GitHub Pages static hosting)
      const networkFailed = !err.response || err.code === 'ERR_NETWORK' || err.response?.status >= 500;
      if (networkFailed) {
        // Fallback login so user is never trapped
        const fallbackUser = {
          id: 'user_' + Date.now(),
          name: formData.name || formData.email.split('@')[0] || 'Healthcare User',
          email: formData.email,
          role: 'Health Worker'
        };
        login('local_token_' + Date.now(), fallbackUser);
        navigate('/');
        return;
      }
      setError(err.response?.data?.msg || 'Invalid Credentials or Server Unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-center mb-5">
        <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-4 rounded-full shadow-lg shadow-indigo-500/30">
          <Stethoscope className="text-white w-10 h-10" />
        </div>
      </div>
      <h2 className="text-3xl font-bold text-center text-white mb-1 tracking-tight">CuraPind AI</h2>
      <p className="text-center text-indigo-200 text-xs font-medium mb-2">Predictive Rural Healthcare Triage</p>
      <p className="text-center text-white/70 text-sm mb-6">
        {isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to start triage.'}
      </p>

      {error && <div className="bg-red-500/20 border border-red-500/40 text-red-100 p-3 rounded-xl mb-4 text-center text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-white/80 mb-1 ml-1 text-sm font-medium">Full Name</label>
            <input 
              type="text" 
              name="name" 
              className="glass-input" 
              placeholder="e.g. Dr. Priya Sharma" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
        )}
        <div>
          <label className="block text-white/80 mb-1 ml-1 text-sm font-medium">Email Address</label>
          <input 
            type="email" 
            name="email" 
            className="glass-input" 
            placeholder="asha@curapind.com" 
            value={formData.email} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div>
          <label className="block text-white/80 mb-1 ml-1 text-sm font-medium">Password</label>
          <input 
            type="password" 
            name="password" 
            className="glass-input" 
            placeholder="••••••••" 
            value={formData.password} 
            onChange={handleChange} 
            required 
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="glass-button w-full mt-2 font-semibold shadow-lg disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      {/* Instant Demo Access Button */}
      <div className="mt-5 pt-4 border-t border-white/10 text-center">
        <p className="text-white/60 text-xs mb-3">Testing or evaluating CuraPind AI?</p>
        <button 
          type="button"
          onClick={() => handleDemoLogin('Health Worker')}
          className="w-full flex items-center justify-center py-2.5 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-xl text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition-all shadow-sm"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          One-Click Demo as Health Worker (ASHA)
        </button>
      </div>

      <div className="mt-5 text-center">
        <p className="text-white/70 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            className="text-blue-300 hover:text-white transition-colors font-medium ml-1"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </GlassCard>
  );
};

export default Login;
