import React, { useState } from 'react';
import { Rocket, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import './Auth.scss';

const Onboarding = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('Agency Owner');

  // Step 2
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('Web Development');

  // Step 3
  const [targetCities, setTargetCities] = useState('Chennai, Mumbai');
  const [targetBusinessTypes, setTargetBusinessTypes] = useState('Dental Clinics, Real Estate Agencies');

  const handleNext = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-slide-in" style={{ maxWidth: '520px' }}>
        <div className="auth-brand">
          <div className="brand-icon">
            <Rocket size={24} />
          </div>
          <h2>MapFlow AI Setup</h2>
          <p>Step {step} of 3 — Tailor your lead discovery experience</p>
        </div>

        <form className="auth-form" onSubmit={handleNext}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" required />
              </div>
              <div className="form-group">
                <label>Job Title</label>
                <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label>Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Company Website</label>
                <input type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://myagency.com" />
              </div>
              <div className="form-group">
                <label>Target Industry</label>
                <select value={targetIndustry} onChange={(e) => setTargetIndustry(e.target.value)}>
                  <option value="Web Development">Web Development</option>
                  <option value="SEO Agency">SEO Agency</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="Solar Services">Solar Services</option>
                  <option value="IT Services">IT Services</option>
                  <option value="Consulting">Consulting</option>
                </select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label>Target Cities (Comma separated)</label>
                <input type="text" value={targetCities} onChange={(e) => setTargetCities(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Target Business Types (Comma separated)</label>
                <input type="text" value={targetBusinessTypes} onChange={(e) => setTargetBusinessTypes(e.target.value)} required />
              </div>
            </>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {step < 3 ? 'Continue Step ' + (step + 1) : loading ? 'Finalizing Setup...' : 'Complete Setup & Launch Dashboard 🚀'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
