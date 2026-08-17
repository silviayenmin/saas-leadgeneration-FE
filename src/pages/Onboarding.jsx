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
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  // STEP 2: Company Information
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('Local Services');
  const [servicesOffered, setServicesOffered] = useState('');
  const [technologiesUsed, setTechnologiesUsed] = useState('');

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
          step1: { fullName, phone, jobTitle, location, bio },
          step2: { companyName, companyWebsite, targetIndustry, servicesOffered, technologiesUsed },
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

              <div className="form-group">
                <label>City / Base Location</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA or Chennai, India"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Founder Bio / Pitch Tagline</label>
                <div className="input-wrapper">
                  <textarea
                    rows="2"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Helping local businesses acquire high-intent leads using MapFlow AI."
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
                    <option value="Local Services">Local Services (Plumbers, Electricians, HVAC, Roofing)</option>
                    <option value="Health & Medical">Health & Medical (Dental, Clinics, Hospitals, Chiro)</option>
                    <option value="Real Estate">Real Estate & Property Management (Agents, Brokers)</option>
                    <option value="Restaurants & Hospitality">Restaurants, Cafes & Hospitality (Hotels, Catering)</option>
                    <option value="Professional Services">Legal, Accounting, Tax & Financial Services</option>
                    <option value="Digital Marketing & Web">Digital Marketing, SEO & Web Design Agencies</option>
                    <option value="IT Services & Software">IT Services, SaaS & Software Development</option>
                    <option value="Automotive & Transport">Automotive Repair, Dealerships & Towing</option>
                    <option value="Beauty & Wellness">Beauty Salons, Spas, Gyms & Fitness</option>
                    <option value="Construction & Architecture">Construction, Architecture & Interior Design</option>
                    <option value="E-Commerce & Retail">E-Commerce & Retail Stores</option>
                    <option value="Education & Training">Education, Tutoring, Schools & Coaching</option>
                    <option value="Solar & Clean Energy">Solar Services, Energy & Sustainability</option>
                    <option value="Logistics & Supply Chain">Logistics, Freight, Moving & Warehousing</option>
                    <option value="Events & Entertainment">Event Planning, Photography & Venues</option>
                    <option value="Manufacturing & Industrial">Manufacturing, Wholesalers & Equipment</option>
                    <option value="Consulting & Recruitment">Management Consulting, HR & Staffing Agencies</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Services Offered</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={servicesOffered}
                    onChange={(e) => setServicesOffered(e.target.value)}
                    placeholder="e.g. Web Design, Local SEO, Lead Gen, PPC"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Technologies & Tools Used</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={technologiesUsed}
                    onChange={(e) => setTechnologiesUsed(e.target.value)}
                    placeholder="e.g. React, WordPress, Node.js, HubSpot, Python"
                  />
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
