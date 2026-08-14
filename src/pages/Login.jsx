import React, { useState } from 'react';
import { Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';
import api from '../services/api';
import './Auth.scss';

const Login = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('demo@mapflow.ai');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('mapflow_token', res.data.token);
        localStorage.setItem('mapflow_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-slide-in">
        <div className="auth-brand">
          <div className="brand-icon">
            <Sparkles size={24} />
          </div>
          <h2>Sign In to MapFlow AI</h2>
          <p>Discover Local Businesses. Find Better Leads. Close More Deals.</p>
        </div>

        {error && <div className="error-banner" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Business Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In to MapFlow'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?
          <button onClick={() => onNavigate('signup')}>Sign Up</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
