import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import api from '../api';
import { Stethoscope } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
      setError(err.response?.data?.msg || 'Something went wrong');
    }
  };

  return (
    <GlassCard className="animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-center mb-6">
        <div className="bg-white/20 p-4 rounded-full">
          <Stethoscope className="text-white w-12 h-12" />
        </div>
      </div>
      <h2 className="text-3xl font-bold text-center text-white mb-2">CuraPind AI</h2>
      <p className="text-center text-white/70 mb-8">
        {isLogin ? 'Welcome back! Please login.' : 'Create an account to continue.'}
      </p>

      {error && <div className="bg-red-500/20 text-red-100 p-3 rounded-xl mb-4 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <div>
            <label className="block text-white/80 mb-1 ml-1 text-sm">Full Name</label>
            <input type="text" name="name" className="glass-input" placeholder="e.g. Rahul Kumar" value={formData.name} onChange={handleChange} required />
          </div>
        )}
        <div>
          <label className="block text-white/80 mb-1 ml-1 text-sm">Email Address</label>
          <input type="email" name="email" className="glass-input" placeholder="name@example.com" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-white/80 mb-1 ml-1 text-sm">Password</label>
          <input type="password" name="password" className="glass-input" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
        </div>
        <button type="submit" className="glass-button w-full mt-4">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-white/70 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-300 hover:text-white transition-colors font-medium">
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </GlassCard>
  );
};

export default Login;
