import React, { useState, useEffect } from 'react';
import { KeyRound, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import './Auth.scss';

const OtpVerification = ({ email, onVerifySuccess }) => {
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState(`Verification code sent to ${email}`);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

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
      setError(err.response?.data?.detail || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    try {
      const res = await api.post('/auth/resend-otp', { email });
      if (res.data.success) {
        setCountdown(60);
        setCanResend(false);
        setInfoMsg(`A new 6-digit code has been sent to ${email}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-slide-in">
        <div className="auth-brand">
          <div className="brand-icon">
            <KeyRound size={26} />
          </div>
          <h2>OTP Verification</h2>
          <p>We sent a 6-digit verification code to <strong>{email}</strong></p>
        </div>

        {error && (
          <div className="banner-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div className="banner-alert info">
            <CheckCircle size={16} />
            <span>{infoMsg}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleVerify}>
          <div className="form-group">
            <label>6-Digit Verification Code</label>
            <div className="input-wrapper">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="──────"
                style={{
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                }}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="otp-resend-row">
            <span>Didn't receive code?</span>
            <button
              type="button"
              className="resend-btn"
              onClick={handleResend}
              disabled={!canResend}
            >
              {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
            </button>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Verifying Code...' : 'Verify Code & Continue'} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OtpVerification;
