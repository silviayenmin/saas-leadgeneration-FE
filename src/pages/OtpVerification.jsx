import React, { useState } from 'react';
import { KeyRound, ArrowRight } from 'lucide-react';
import api from '../services/api';
import './Auth.scss';

const OtpVerification = ({ email, otpCodeHint, onVerifySuccess }) => {
  const [otpCode, setOtpCode] = useState(otpCodeHint || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', { email, otpCode });
      if (res.data.success) {
        localStorage.setItem('mapflow_token', res.data.token);
        localStorage.setItem('mapflow_user', JSON.stringify(res.data.user));
        onVerifySuccess(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-slide-in">
        <div className="auth-brand">
          <div className="brand-icon">
            <KeyRound size={24} />
          </div>
          <h2>Email OTP Verification</h2>
          <p>We sent a 6-digit verification code to <strong>{email}</strong></p>
        </div>

        {error && <div className="error-banner" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}

        <form className="auth-form" onSubmit={handleVerify}>
          <div className="form-group">
            <label>6-Digit Verification Code</label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              style={{ letterSpacing: '6px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code & Continue'} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OtpVerification;
