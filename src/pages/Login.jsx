import React, { useState } from 'react';
import { Sparkles, ArrowRight, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import api from '../services/api';
import './Auth.scss';

const Login = ({ onNavigate, onLoginSuccess, onRequireOtp, successMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState(successMessage || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMsg('');

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        if (rememberMe) {
          localStorage.setItem('mapflow_token', res.data.token);
          localStorage.setItem('mapflow_user', JSON.stringify(res.data.user));
        } else {
          sessionStorage.setItem('mapflow_token', res.data.token);
          sessionStorage.setItem('mapflow_user', JSON.stringify(res.data.user));
        }
        onLoginSuccess(res.data.user);
      } else if (res.data.requiresOtp) {
        onRequireOtp(res.data.email);
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    onNavigate('forgot-password', email);
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-slide-in">
        <div className="auth-brand">
          <div className="brand-icon">
            <Sparkles size={26} />
          </div>
          <h2>MapFlow AI</h2>
          <p>Discover Local Businesses. Find Better Leads. Close More Deals.</p>
        </div>

        {error && (
          <div className="banner-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div className="banner-alert info">
            <span>{infoMsg}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Business Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <span>Password</span>
              <span className="forgot-link" onClick={handleForgotPasswordClick}>
                Forgot Password?
              </span>
            </label>
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
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-checkbox">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember">Remember Me</label>
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
