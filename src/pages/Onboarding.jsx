import React, { useState } from 'react';
import { Rocket, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import './Auth.scss';

const Onboarding = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // STEP 1: Personal Details
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('Agency Founder');

  // STEP 2: Company Information
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('Web Development');

  // STEP 3: Target Audience
  const [targetCities, setTargetCities] = useState('Chennai, Bangalore, Mumbai');
  const [targetBusinessTypes, setTargetBusinessTypes] = useState('Dental Clinics, HVAC Contractors, Real Estate');

  const handleNext = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!fullName.trim() || !phone.trim() || !jobTitle.trim()) {
        setError('Please fill in all personal details.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!companyName.trim() || !targetIndustry.trim()) {
        setError('Please provide your company name and target industry.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!targetCities.trim() || !targetBusinessTypes.trim()) {
        setError('Please enter your target cities and business types.');
        return;
      }

      setLoading(true);
      try {
        await api.post('/users/onboarding', {
          step1: { fullName, phone, jobTitle },
          step2: { companyName, companyWebsite, targetIndustry },
          step3: {
            targetCities: targetCities.split(',').map((c) => c.trim()),
            targetBusinessTypes: targetBusinessTypes.split(',').map((b) => b.trim()),
          },
        });
        onComplete();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to complete onboarding setup.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card onboarding-card animate-slide-in">
        <div className="auth-brand">
          <div className="brand-icon">
            <Rocket size={26} />
          </div>
          <h2>Welcome to MapFlow AI</h2>
          <p>Let's customize your business discovery engine in 3 simple steps.</p>
        </div>

        {/* Step Progress Bar */}
        <div className="step-indicator">
          <div className={`step-item ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}`}>
            <div className="step-number">{step > 1 ? <CheckCircle2 size={14} /> : '1'}</div>
            <span>Personal</span>
          </div>
          <div className={`step-line ${step > 1 ? 'active' : ''}`}></div>
          <div className={`step-item ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}`}>
            <div className="step-number">{step > 2 ? <CheckCircle2 size={14} /> : '2'}</div>
            <span>Company</span>
          </div>
          <div className={`step-line ${step > 2 ? 'active' : ''}`}></div>
          <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Audience</span>
          </div>
        </div>

        {error && (
          <div className="banner-alert error">
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleNext}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Job Title</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Founder / Sales Director"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label>Company Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Apex Marketing Agency"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Company Website</label>
                <div className="input-wrapper">
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://apexagency.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Target Industry / Offering</label>
                <div className="input-wrapper">
                  <select
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="SEO Agency">SEO Agency</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Solar Services">Solar Services</option>
                    <option value="IT Services">IT Services</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label>Target Cities (Comma Separated)</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={targetCities}
                    onChange={(e) => setTargetCities(e.target.value)}
                    placeholder="Chennai, Mumbai, Bangalore"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Target Business Types (Comma Separated)</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={targetBusinessTypes}
                    onChange={(e) => setTargetBusinessTypes(e.target.value)}
                    placeholder="Dental Clinics, Law Firms, Restaurants"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {step > 1 && (
              <button
                type="button"
                className="btn-submit"
                style={{ background: '#1E2A3E', flex: 1 }}
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}
            <button type="submit" className="btn-submit" style={{ flex: 2 }} disabled={loading}>
              {step < 3
                ? `Continue to Step ${step + 1}`
                : loading
                ? 'Launching Dashboard...'
                : 'Complete Setup & Launch Dashboard 🚀'}
              {step < 3 && <ArrowRight size={16} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
