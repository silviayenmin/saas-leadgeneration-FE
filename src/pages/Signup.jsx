import React, { useState } from 'react';
import { Sparkles, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../services/api';
import './Auth.scss';

const Signup = ({ onNavigate, onSignupSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { fullName, email, password });
      if (res.data.success) {
        onSignupSuccess(email);
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-slide-in">
        <div className="auth-brand">
          <div className="brand-icon">
            <Sparkles size={26} />
          </div>
          <h2>Create Account</h2>
          <p>Join MapFlow AI to discover local businesses & find better leads.</p>
        </div>

        {error && (
          <div className="banner-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Work Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                placeholder="john@agency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Sending Code...' : 'Create Account & Send Code'} <ArrowRight size={16} />
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
