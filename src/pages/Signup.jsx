import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import api from '../services/api';
import './Auth.scss';

const Signup = ({ onNavigate, onSignupSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/signup', { fullName, email, password });
      if (res.data.success) {
        onSignupSuccess(email, res.data.otpCode);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
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
          <h2>Create Account</h2>
          <p>Start discovering high-intent Google Maps leads today.</p>
        </div>

        {error && <div className="error-banner" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Work Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account & Send Code'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <button onClick={() => onNavigate('login')}>Sign In</button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
