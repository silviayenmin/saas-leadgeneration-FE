import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../services/api';
import './Auth.scss';

const ForgotPassword = ({ onNavigate, onResetSuccess, initialEmail = '' }) => {
  const [step, setStep] = useState(1); // 1: Email Request, 2: Code Verification & Reset
  const [email, setEmail] = useState(initialEmail);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer for resend code in step 2
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (step === 2 && countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMsg('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setStep(2);
        setCountdown(60);
        setCanResend(false);
        setInfoMsg(res.data.message || `Password reset verification code sent to ${email}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (resetCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        email,
        resetCode: resetCode.trim(),
        newPassword,
      });

      if (res.data.success) {
        onResetSuccess(res.data.message || 'Password updated successfully! Please sign in.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setCountdown(60);
        setCanResend(false);
        setInfoMsg(`A new reset verification code has been sent to ${email}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-slide-in">
        <div className="auth-brand">
          <div className="brand-icon">
            {step === 1 ? <Lock size={26} /> : <KeyRound size={26} />}
          </div>
          <h2>{step === 1 ? 'Forgot Password?' : 'Reset Password'}</h2>
          <p>
            {step === 1
              ? "Enter your business email address and we'll send you a 6-digit verification code to reset your password."
              : `Enter the 6-digit code sent to ${email} along with your new password.`}
          </p>
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

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleRequestCode} autoComplete="off">
            <div className="form-group">
              <label>Business Email</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  name="email"
                  id="resetEmail"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Sending Code...' : 'Send Reset Code'} <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword} autoComplete="off">
            <div className="form-group">
              <label>6-Digit Verification Code</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="resetCode"
                  id="resetCode"
                  autoComplete="one-time-code"
                  data-lpignore="true"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
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

            <div className="form-group">
              <label>New Password</label>
              <div className="input-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  id="newPassword"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-icon"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  id="confirmPassword"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="otp-resend-row">
              <span>Didn't receive code?</span>
              <button
                type="button"
                className="resend-btn"
                onClick={handleResendCode}
                disabled={!canResend || loading}
              >
                {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
              </button>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Resetting Password...' : 'Reset Password & Sign In'} <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div className="auth-footer">
          {step === 2 && (
            <button
              onClick={() => {
                setStep(1);
                setError('');
                setInfoMsg('');
              }}
              style={{ marginRight: '16px' }}
            >
              Change Email
            </button>
          )}
          Remembered your password?
          <button onClick={() => onNavigate('login')}>Back to Sign In</button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
