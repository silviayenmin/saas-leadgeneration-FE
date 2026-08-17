import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, ShieldCheck, Zap, Coins, CheckCircle, AlertCircle, ArrowUpRight, Check, History, Building2, Briefcase, Globe, Phone, Mail, ChevronDown, X, Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import api from '../services/api';
import './ProfileSubscription.scss';

const industryOptions = [
  { value: 'Local Services', label: 'Local Services (Plumbers, Electricians, HVAC, Roofing)' },
  { value: 'Health & Medical', label: 'Health & Medical (Dental, Clinics, Hospitals, Chiro)' },
  { value: 'Real Estate', label: 'Real Estate & Property Management (Agents, Brokers)' },
  { value: 'Restaurants & Hospitality', label: 'Restaurants, Cafes & Hospitality (Hotels, Catering)' },
  { value: 'Professional Services', label: 'Legal, Accounting, Tax & Financial Services' },
  { value: 'Digital Marketing & Web', label: 'Digital Marketing, SEO & Web Design Agencies' },
  { value: 'IT Services & Software', label: 'IT Services, SaaS & Software Development' },
  { value: 'Automotive & Transport', label: 'Automotive Repair, Dealerships & Towing' },
  { value: 'Beauty & Wellness', label: 'Beauty Salons, Spas, Gyms & Fitness' },
  { value: 'Construction & Architecture', label: 'Construction, Architecture & Interior Design' },
  { value: 'E-Commerce & Retail', label: 'E-Commerce & Retail Stores' },
  { value: 'Education & Training', label: 'Education, Tutoring, Schools & Coaching' },
  { value: 'Solar & Clean Energy', label: 'Solar Services, Energy & Sustainability' },
  { value: 'Logistics & Supply Chain', label: 'Logistics, Freight, Moving & Warehousing' },
  { value: 'Events & Entertainment', label: 'Event Planning, Photography & Venues' },
  { value: 'Manufacturing & Industrial', label: 'Manufacturing, Wholesalers & Equipment' },
  { value: 'Consulting & Recruitment', label: 'Management Consulting, HR & Staffing Agencies' },
];

const CustomSelect = ({ options, value, onChange, dropUp = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`custom-dropdown-wrapper ${dropUp ? 'drop-up' : ''}`} ref={dropdownRef}>
      <div
        className={`custom-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption.label}</span>
        <ChevronDown size={16} className="chevron-icon" />
      </div>

      {isOpen && (
        <div className="custom-dropdown-menu">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`dropdown-item ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={16} className="check-icon" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileSubscription = ({ onUpgradeSuccess, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'subscription', 'transactions'
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('Local Services');
  const [servicesOffered, setServicesOffered] = useState('');
  const [technologiesUsed, setTechnologiesUsed] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [upgradingPlanKey, setUpgradingPlanKey] = useState(null);

  const [tabScrollState, setTabScrollState] = useState({ canScrollLeft: false, canScrollRight: true });
  const [tableScrollState, setTableScrollState] = useState({ canScrollLeft: false, canScrollRight: true });
  const tabsRef = useRef(null);
  const tableRef = useRef(null);
  const tabBtnRefs = useRef({});

  const handleTabsScroll = () => {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setTabScrollState({
      canScrollLeft: scrollLeft > 8,
      canScrollRight: scrollLeft + clientWidth < scrollWidth - 8,
    });
  };

  const handleTableScroll = () => {
    if (!tableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
    setTableScrollState({
      canScrollLeft: scrollLeft > 8,
      canScrollRight: scrollLeft + clientWidth < scrollWidth - 8,
    });
  };

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    const targetEl = tabBtnRefs.current[tabKey];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleTabsScroll();
      handleTableScroll();
      if (tabBtnRefs.current[activeTab]) {
        tabBtnRefs.current[activeTab].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 100);
    window.addEventListener('resize', handleTabsScroll);
    window.addEventListener('resize', handleTableScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleTabsScroll);
      window.removeEventListener('resize', handleTableScroll);
    };
  }, [activeTab]);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Fetch initial profile, subscription, and plans data
  const fetchData = async () => {
    try {
      const [userRes, subRes, plansRes, txRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/subscription/current'),
        api.get('/subscription/plans'),
        api.get('/credits/transactions').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (userRes.data.success) {
        const u = userRes.data.data;
        setUser(u);
        setFullName(u.fullName || '');
        setEmail(u.email || '');
        // Phone stored as full number (e.g. 919345681200) — PhoneInput handles splitting
        setPhone(u.phone || '');
        setJobTitle(u.jobTitle || '');
        setLocation(u.location || '');
        setBio(u.bio || '');
        setCompanyName(u.companyName || u.company || '');
        setCompanyWebsite(u.companyWebsite || u.website || '');
        setTargetIndustry(u.targetIndustry || 'Local Services');
        setServicesOffered(u.servicesOffered || '');
        setTechnologiesUsed(u.technologiesUsed || '');
      }

      if (subRes.data.success) {
        setSubscription(subRes.data.data);
      }

      if (plansRes.data.success) {
        setPlans(plansRes.data.data);
      }

      if (txRes.data?.success) {
        setTransactions(txRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (msg.text) {
      const timer = setTimeout(() => {
        setMsg({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await api.put('/users/profile', {
        fullName,
        phone: phone ? `+${phone}` : '',
        jobTitle,
        location,
        bio,
        company: companyName,
        companyName,
        website: companyWebsite,
        companyWebsite,
        targetIndustry,
        servicesOffered,
        technologiesUsed,
      });

      if (res.data.success) {
        const updatedUser = res.data.data;
        setUser(updatedUser);
        if (onProfileUpdate) {
          onProfileUpdate(updatedUser);
        }
        localStorage.setItem('mapflow_user', JSON.stringify(updatedUser));
        setMsg({ type: 'success', text: 'Profile details updated successfully!' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile details.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpgradePlan = async (planKey) => {
    setUpgradingPlanKey(planKey);
    setMsg({ type: '', text: '' });

    try {
      const res = await api.post(`/subscription/upgrade?plan_key=${planKey}`);
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        // Refresh credit & sub state
        const subRes = await api.get('/subscription/current');
        if (subRes.data.success) {
          setSubscription(subRes.data.data);
        }
        if (onUpgradeSuccess) {
          onUpgradeSuccess();
        }
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to upgrade plan.' });
    } finally {
      setUpgradingPlanKey(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ color: 'var(--text-muted)' }}>Loading Profile & Subscription settings...</p>
      </div>
    );
  }

  const currentPlanKey = subscription?.plan || 'FREE';
  const creditsRemaining = subscription?.creditsRemaining ?? 25;
  const creditLimit = subscription?.creditLimit ?? 25;
  const usagePct = Math.min(100, Math.round(((creditLimit - creditsRemaining) / creditLimit) * 100)) || 0;

  return (
    <div className="page-container profile-sub-container animate-fade-in">
      {/* Hero Header Banner */}
      <div className="profile-hero-card">
        <div className="hero-left">
          <div className="hero-avatar">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hero-meta">
            <h2>{user?.fullName || 'MapFlow User'}</h2>
            <div className="hero-subtext">
              <span><Mail size={14} /> {user?.email}</span>
              {user?.companyName && <span><span className="hero-bullet">•</span> <Building2 size={14} /> {user.companyName}</span>}
              {user?.jobTitle && <span><span className="hero-bullet">•</span> <Briefcase size={14} /> {user.jobTitle}</span>}
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className={`plan-pill ${currentPlanKey}`}>
            <Zap size={14} />
            <span>{currentPlanKey.replace('_', ' ')} PLAN</span>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {msg.text && (
        <div className={`toast-banner-alert ${msg.type}`}>
          <div className="toast-content">
            <div className="toast-icon-wrapper">
              {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            </div>
            <div className="toast-text">
              <strong>{msg.type === 'error' ? 'Update Failed' : 'Success!'}</strong>
              <p>{msg.text}</p>
            </div>
          </div>
          <button className="btn-dismiss-toast" onClick={() => setMsg({ type: '', text: '' })} aria-label="Dismiss alert">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs Bar with Dynamic Left & Right Scroll Smog Effect */}
      <div
        className={`sub-tabs-wrapper ${tabScrollState.canScrollLeft ? 'show-left-smog' : ''} ${tabScrollState.canScrollRight ? 'show-right-smog' : ''}`}
      >
        <div className="sub-tabs-bar" ref={tabsRef} onScroll={handleTabsScroll}>
          <button
            ref={(el) => (tabBtnRefs.current['profile'] = el)}
            className={`sub-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabClick('profile')}
          >
            <User size={16} /> Profile Details
          </button>
          <button
            ref={(el) => (tabBtnRefs.current['subscription'] = el)}
            className={`sub-tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
            onClick={() => handleTabClick('subscription')}
          >
            <Zap size={16} /> Subscription & Credits
          </button>
          <button
            ref={(el) => (tabBtnRefs.current['transactions'] = el)}
            className={`sub-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => handleTabClick('transactions')}
          >
            <History size={16} /> Credit History
          </button>
        </div>
      </div>

      {/* TAB 1: Profile & Company Details */}
      {activeTab === 'profile' && (
        <form className="profile-form-grid" onSubmit={handleSaveProfile}>
          <div className="form-card">
            <div className="card-title">
              <User size={18} className="title-icon" />
              <h3>Personal & Professional Profile</h3>
            </div>

            <div className="form-row">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                required
              />
            </div>

            <div className="form-row">
              <div className="label-with-badge">
                <label>Email Address</label>
                <span className="verified-pill"><ShieldCheck size={13} /> Verified</span>
              </div>
              <input
                type="email"
                value={email}
                readOnly
                className="input-readonly"
              />
            </div>

            <div className="form-row">
              <label>Phone Number</label>
              <div className="phone-input-package-wrapper">
                <PhoneInput
                  country={'us'}
                  value={phone}
                  onChange={(value) => setPhone(value)}
                  enableSearch
                  searchPlaceholder="Search country..."
                  inputProps={{
                    name: 'phone',
                    placeholder: 'Enter phone number',
                  }}
                  containerClass="rpi-container"
                  buttonClass="rpi-button"
                  inputClass="rpi-input"
                  dropdownClass="rpi-dropdown"
                  searchClass="rpi-search"
                />
              </div>
            </div>

            <div className="form-row">
              <label>Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Growth Marketing Director"
              />
            </div>

            <div className="form-row">
              <label>City / Base Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or Chennai, India"
              />
            </div>

            <div className="form-row">
              <label>Founder Bio / Pitch Tagline</label>
              <textarea
                rows="2"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Helping local businesses acquire high-intent leads using MapFlow AI."
              />
            </div>
          </div>

          <div className="form-card">
            <div className="card-title">
              <Building2 size={18} className="title-icon" />
              <h3>Company & Target Settings</h3>
            </div>

            <div className="form-row">
              <label>Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Digital Media"
              />
            </div>

            <div className="form-row">
              <label>Company Website</label>
              <input
                type="url"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://company.com"
              />
            </div>

            <div className="form-row">
              <label>Primary Target Industry</label>
              <CustomSelect
                options={industryOptions}
                value={targetIndustry}
                onChange={setTargetIndustry}
              />
            </div>

            <div className="form-row">
              <label>Services Offered</label>
              <input
                type="text"
                value={servicesOffered}
                onChange={(e) => setServicesOffered(e.target.value)}
                placeholder="e.g. Web Design, Local SEO, Lead Gen, PPC"
              />
            </div>

            <div className="form-row">
              <label>Technologies & Tools Used</label>
              <input
                type="text"
                value={technologiesUsed}
                onChange={(e) => setTechnologiesUsed(e.target.value)}
                placeholder="e.g. React, WordPress, Node.js, HubSpot, Python"
              />
            </div>

            <button type="submit" className={`btn-save-profile ${savingProfile ? 'loading' : ''}`} disabled={savingProfile}>
              {savingProfile ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Subscription & Plans */}
      {activeTab === 'subscription' && (
        <>
          {/* Credit Usage Summary Box */}
          <div className="credit-usage-card">
            <div className="usage-header">
              <div className="usage-title">
                <Coins size={20} className="coins-icon" />
                <span>Credit Balance & Consumption</span>
              </div>
              <div className="usage-stats">
                <span>{creditsRemaining}</span> / {creditLimit} Credits Available
              </div>
            </div>

            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${100 - usagePct}%` }}
              ></div>
            </div>

            <div className="usage-sub">
              Your credits reset automatically each billing cycle based on your selected plan.
            </div>
          </div>

          {/* Pricing Plans Cards */}
          <div className="plans-grid">
            {/* Free Plan */}
            <div className={`plan-card ${currentPlanKey === 'FREE' ? 'current' : ''}`}>
              <div className="plan-header">
                <h4>Free Explorer</h4>
                <div className="price-tag">
                  <span className="amount">$0</span>
                  <span className="period">/ month</span>
                </div>
                <div className="credits-pill">25 Lead Discovery Credits</div>
              </div>

              <div className="plan-features">
                <div className="feature-item"><Check size={16} className="check-icon" /> Basic Google Maps Lead Search</div>
                <div className="feature-item"><Check size={16} className="check-icon" /> Standard Email & Phone Extraction</div>
                <div className="feature-item"><Check size={16} className="check-icon" /> CSV Lead Export</div>
              </div>

              <button
                className={`btn-plan-action ${currentPlanKey === 'FREE' ? 'active-plan' : 'btn-upgrade'}`}
                disabled={currentPlanKey === 'FREE' || upgradingPlanKey === 'FREE'}
                onClick={() => handleUpgradePlan('FREE')}
              >
                {currentPlanKey === 'FREE'
                  ? 'Current Plan'
                  : upgradingPlanKey === 'FREE'
                  ? 'Updating...'
                  : 'Downgrade to Free'}
              </button>
            </div>

            {/* Starter Plan */}
            <div className={`plan-card popular ${currentPlanKey === 'STARTER' ? 'current' : ''}`}>
              <div className="popular-badge">Most Popular</div>
              <div className="plan-header">
                <h4>Starter Pro</h4>
                <div className="price-tag">
                  <span className="amount">$29</span>
                  <span className="period">/ month</span>
                </div>
                <div className="credits-pill">500 Lead Discovery Credits</div>
              </div>

              <div className="plan-features">
                <div className="feature-item"><Check size={16} className="check-icon" /> Advanced Local Maps Lead Discovery</div>
                <div className="feature-item"><Check size={16} className="check-icon" /> Deep Email & Social Profile Enrichment</div>
                <div className="feature-item"><Check size={16} className="check-icon" /> AI Cold Outreach Pitch Generator</div>
                <div className="feature-item"><Check size={16} className="check-icon" /> CRM Outreach Pipeline Tracking</div>
              </div>

              <button
                className={`btn-plan-action ${currentPlanKey === 'STARTER' ? 'active-plan' : 'btn-upgrade'}`}
                disabled={currentPlanKey === 'STARTER' || upgradingPlanKey === 'STARTER'}
                onClick={() => handleUpgradePlan('STARTER')}
              >
                {currentPlanKey === 'STARTER'
                  ? 'Current Plan'
                  : upgradingPlanKey === 'STARTER'
                  ? 'Upgrading...'
                  : 'Upgrade to Starter ($29/mo)'}
              </button>
            </div>

            {/* Agency Pro Plan */}
            <div className={`plan-card ${currentPlanKey === 'AGENCY_PRO' ? 'current' : ''}`}>
              <div className="plan-header">
                <h4>Agency Pro</h4>
                <div className="price-tag">
                  <span className="amount">$79</span>
                  <span className="period">/ month</span>
                </div>
                <div className="credits-pill">2,500 Lead Discovery Credits</div>
              </div>

              <div className="plan-features">
                <div className="feature-item"><Check size={16} className="check-icon" /> Unlimited Map Scans & Lead Scraping</div>
                <div className="feature-item"><Check size={16} className="check-icon" /> Full AI Website Intelligence & Audit</div>
                <div className="feature-item"><Check size={16} className="check-icon" /> Automated Multi-Channel Cold Pitches</div>
                <div className="feature-item"><Check size={16} className="check-icon" /> Priority API & Integration Connectors</div>
              </div>

              <button
                className={`btn-plan-action ${currentPlanKey === 'AGENCY_PRO' ? 'active-plan' : 'btn-upgrade'}`}
                disabled={currentPlanKey === 'AGENCY_PRO' || upgradingPlanKey === 'AGENCY_PRO'}
                onClick={() => handleUpgradePlan('AGENCY_PRO')}
              >
                {currentPlanKey === 'AGENCY_PRO'
                  ? 'Current Plan'
                  : upgradingPlanKey === 'AGENCY_PRO'
                  ? 'Upgrading...'
                  : 'Upgrade to Agency Pro ($79/mo)'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* TAB 3: Credit Transactions History */}
      {activeTab === 'transactions' && (
        <div className="data-card">
          <div className="card-header-flex">
            <h3>Credit Activity & Transaction Log</h3>
            <span className="card-sub-info">Showing recent activity</span>
          </div>

          <div
            className={`table-responsive ${tableScrollState.canScrollLeft ? 'show-left-smog' : ''} ${tableScrollState.canScrollRight ? 'show-right-smog' : ''}`}
            ref={tableRef}
            onScroll={handleTableScroll}
          >
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Activity Description</th>
                  <th>Credits Consumed</th>
                  <th>Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx, idx) => (
                    <tr key={idx}>
                      <td>{new Date(tx.timestamp || Date.now()).toLocaleString()}</td>
                      <td><strong>{tx.action || 'Lead Discovery Search'}</strong></td>
                      <td style={{ color: 'var(--error)', fontWeight: 'bold' }}>-{tx.amount || 1}</td>
                      <td>{tx.balanceAfter ?? creditsRemaining}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No credit transactions logged yet. Perform a Google Maps scan to view activity!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSubscription;
