import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  ShieldCheck,
  Building2,
  Mail,
  Check,
  Lock,
  Terminal,
  ShieldAlert,
  Calendar,
  Webhook,
  Key,
  Link as LinkIcon,
  Save,
  RefreshCw,
  Copy,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import api from '../services/api';
import './ProfileSubscription.scss';
import './OutreachConfig.scss';

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

export default function Profile({ onProfileUpdate, onSwitchTab }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', 'integrations'

  const [user, setUser] = useState(null);
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

  const [tabScrollState, setTabScrollState] = useState({ canScrollLeft: false, canScrollRight: true });
  const tabsRef = useRef(null);
  const tabBtnRefs = useRef({});


  // Integration Health Checklist States
  const [imapHealth, setImapHealth] = useState('Not Configured');
  const [googleSheetsHealth, setGoogleSheetsHealth] = useState('Not Configured');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookHealth, setWebhookHealth] = useState('Inactive');
  const [placesHealth, setPlacesHealth] = useState('Fallback (Playwright)');
  const [developerToken, setDeveloperToken] = useState('silvia_dev_key');
  const [showDevToken, setShowDevToken] = useState(false);
  const [joinedDate, setJoinedDate] = useState('June 19, 2026');

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [msg, setMsg] = useState({ type: '', text: '' });

  const getHeaders = (contentType = 'application/json') => {
    const secretKey = localStorage.getItem('APP_SECRET_KEY') || 'silvia_dev_key';
    const token = localStorage.getItem('mapflow_token') || sessionStorage.getItem('mapflow_token');
    const headers = { 'X-API-Key': secretKey };
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const handleTabsScroll = () => {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setTabScrollState({
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

  const fetchIntegrationHealth = async () => {
    const headers = getHeaders(null);

    const endpoints = [
      '/api/outreach/config',
      '/api/outreach/places',
      '/api/outreach/webhook',
      '/api/config/google-sheets'
    ];

    try {
      const responses = await Promise.all(
        endpoints.map(endpoint => fetch(endpoint, { headers }).then(res => res.ok ? res.json() : null).catch(() => null))
      );

      const [imapData, placesData, webhookData, sheetsData] = responses;

      if (imapData && imapData.config) {
        const config = imapData.config;
        if (config.imap_server && config.imap_email) {
          setImapHealth('Active');
        }
      }

      if (placesData && placesData.places_api_key) {
        setPlacesHealth('Active');
      }

      if (webhookData) {
        setWebhookUrl(webhookData.webhook_url || '');
        if (webhookData.webhook_url) setWebhookHealth('Active');
      }

      if (sheetsData) {
        if (!sheetsData.credentials_active) {
          setGoogleSheetsHealth('Inactive (Credentials Missing)');
        } else if (sheetsData.sheet_id) {
          setGoogleSheetsHealth('Active');
        } else {
          setGoogleSheetsHealth('Not Configured');
        }
      }
      
      const secretKey = localStorage.getItem('APP_SECRET_KEY') || 'silvia_dev_key';
      setDeveloperToken(secretKey);
    } catch (err) {
      console.warn("Failed to load health indicators:", err);
    }
  };

  const fetchData = async () => {
    try {
      const userRes = await api.get('/users/me');

      if (userRes.data.success) {
        const u = userRes.data.data;
        setUser(u);
        setFullName(u.fullName || '');
        setEmail(u.email || '');
        setPhone(u.phone ? u.phone.replace('+', '') : '');
        setJobTitle(u.jobTitle || '');
        setLocation(u.location || '');
        setBio(u.bio || '');
        setCompanyName(u.companyName || u.company || '');
        setCompanyWebsite(u.companyWebsite || u.website || '');
        setTargetIndustry(u.targetIndustry || 'Local Services');
        setServicesOffered(u.servicesOffered || '');
        setTechnologiesUsed(u.technologiesUsed || '');
        
        if (u.createdAt) {
          try {
            setJoinedDate(new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
          } catch (e) {
            setJoinedDate('June 19, 2026');
          }
        }
      }

      await fetchIntegrationHealth();

    } catch (err) {
      console.error('Failed to load profile details:', err);
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
        
        // Synchronize cold pitch core offers
        localStorage.setItem('silvia_agency_info', bio.trim());

        setMsg({ type: 'success', text: 'Profile details updated successfully!' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile details.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMsg({ type: 'error', text: 'Please fill out all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setIsResettingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      if (response.ok) {
        setMsg({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await response.json();
        const errMsg = typeof err.detail === 'string'
          ? err.detail
          : (Array.isArray(err.detail) ? err.detail.map(d => d.msg).join(', ') : 'Failed to change password.');
        setMsg({ type: 'error', text: errMsg });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Security change error: ' + err.message });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSaveWebhook = async () => {
    try {
      const response = await fetch('/api/outreach/webhook', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ webhook_url: webhookUrl.trim() })
      });
      if (response.ok) {
        setMsg({ type: 'success', text: 'CRM Integration URL saved!' });
        setWebhookHealth(webhookUrl ? 'Active' : 'Inactive');
      } else {
        setMsg({ type: 'error', text: 'Failed to save webhook integration.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Webhook integration error: ' + err.message });
    }
  };

  const copyDevToken = () => {
    navigator.clipboard.writeText(developerToken);
    setMsg({ type: 'success', text: 'Developer token copied to clipboard!' });
  };

  // Health Badge Styling Helper
  const getBadgeConfig = (status) => {
    const isActive = status === 'Active';
    const isFallback = status.toLowerCase().includes('fallback') || status === 'Fallback';
    
    if (isActive) {
      return {
        bg: 'rgba(34, 197, 94, 0.06)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        text: '#22c55e',
        dotClass: 'green'
      };
    } else if (isFallback) {
      return {
        bg: 'rgba(245, 158, 11, 0.06)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        text: '#f59e0b',
        dotClass: 'warning'
      };
    } else {
      return {
        bg: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        text: '#ef4444',
        dotClass: 'red'
      };
    }
  };

  const renderHealthBadge = (label, status, icon, onClick, title) => {
    const isAct = status === 'Active';
    const isFall = status.toLowerCase().includes('fallback') || status === 'Fallback';
    const statusClass = isAct ? 'health-active' : (isFall ? 'health-fallback' : 'health-inactive');
    const dotClass = isAct ? 'green' : (isFall ? 'warning' : 'red');

    return (
      <div 
        onClick={onClick}
        className={`interactive-health-badge ${statusClass}`}
        title={title}
      >
        {icon}
        <span>{label}: <strong>{status}</strong></span>
        <span className={`pulse-indicator ${dotClass}`}></span>
      </div>
    );
  };

  return (
    <div className="page-container profile-sub-container animate-fade-in">
      {/* Hero Header Banner */}
      <div className="profile-hero-card">
        <div className="hero-left">
          <div className="hero-avatar">
            {fullName.charAt(0)?.toUpperCase() || user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hero-meta">
            <h2>{fullName || user?.fullName || 'MapFlow User'}</h2>
            <div className="hero-subtext">
              <span><Mail size={14} /> {email || user?.email}</span>
              {companyName && <span><span className="hero-bullet">•</span> <Building2 size={14} /> {companyName}</span>}
              <span><span className="hero-bullet">•</span> Member since: <strong>{joinedDate}</strong></span>
            </div>
          </div>
        </div>

        {/* Horizontal Integration Health Badges */}
        <div className="hero-right">
          <h4>Integration Health</h4>
          <div className="health-badges-grid">
            {renderHealthBadge("Inbox", imapHealth, <Mail size={12} />, () => onSwitchTab && onSwitchTab('outreach-config'), "Click to configure Inbox connection")}
            {renderHealthBadge("Sheets", googleSheetsHealth === 'Active' ? 'Active' : 'Inactive', <Building2 size={12} />, () => onSwitchTab && onSwitchTab('outreach-config'), "Click to configure Google Sheets sync")}
            {renderHealthBadge("Webhook", webhookHealth, <Webhook size={12} />, () => {
              setActiveTab('integrations');
              setTimeout(() => {
                const element = document.getElementById('settings-webhook-url');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element.focus();
                }
              }, 120);
            }, "Click to configure CRM Webhook URL")}
            {renderHealthBadge("Places API", placesHealth === 'Active' ? 'Active' : 'Fallback', <Key size={12} />, () => onSwitchTab && onSwitchTab('outreach-config'), "Click to configure Google Places API keys")}
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {msg.text && (
        <div className={`toast-banner-alert ${msg.type}`} style={{ marginBottom: '1rem' }}>
          <div className="toast-content">
            <div className="toast-icon-wrapper">
              {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            </div>
            <div className="toast-text">
              <strong>{msg.type === 'error' ? 'Failed' : 'Success!'}</strong>
              <p>{msg.text}</p>
            </div>
          </div>
          <button className="btn-dismiss-toast" onClick={() => setMsg({ type: '', text: '' })} aria-label="Dismiss alert">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs Bar */}
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
            ref={(el) => (tabBtnRefs.current['security'] = el)}
            className={`sub-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => handleTabClick('security')}
          >
            <Lock size={16} /> Security / Password
          </button>
          <button
            ref={(el) => (tabBtnRefs.current['integrations'] = el)}
            className={`sub-tab-btn ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => handleTabClick('integrations')}
          >
            <Terminal size={16} /> Developer & CRM
          </button>
        </div>
      </div>

      {/* Forms Column (Full-Width) */}
      <div className="settings-forms-column">
        
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="profile-form-grid">
            <div className="form-card">
              <div className="card-title">
                <User size={18} className="title-icon" />
                <h3>Personal & Professional Profile</h3>
              </div>
              
              <div className="profile-form-fields-grid">

              <div className="form-row">
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Full Name / Display Name</label>
                <div className="input-group-premium">
                  <div className="input-group-icon">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="label-with-badge">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Email Address</label>
                  <span className="verified-badge">
                    <ShieldCheck size={12} /> Verified
                  </span>
                </div>
                <div className="input-group-premium readonly">
                  <div className="input-group-icon">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    readOnly
                  />
                </div>
              </div>

              <div className="form-row">
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Phone Number</label>
                <div className="input-group-premium">
                  <div className="input-group-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div className="phone-input-group-container">
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
                      containerClass="rpi-container-flat"
                      buttonClass="rpi-button-flat"
                      inputClass="rpi-input-flat"
                      dropdownClass="rpi-dropdown-flat"
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Business / Company Name</label>
                <div className="input-group-premium">
                  <div className="input-group-icon">
                    <Building2 size={16} />
                  </div>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Digital Media"
                  />
                </div>
              </div>

              <div className="form-row">
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Company Website</label>
                <div className="input-group-premium">
                  <div className="input-group-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </div>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://company.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Services Offered</label>
                <div className="input-group-premium">
                  <div className="input-group-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  </div>
                  <input
                    type="text"
                    value={servicesOffered}
                    onChange={(e) => setServicesOffered(e.target.value)}
                    placeholder="e.g. Web Design, Local SEO, Lead Gen, PPC"
                  />
                </div>
              </div>

              <div className="form-row" style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Value Pitch Profile & Core Offers</label>
                <div className="input-group-premium">
                  <div className="input-group-icon" style={{ alignSelf: 'flex-start', paddingTop: '0.75rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <textarea
                    rows="3"
                    value={bio}
                    maxLength={500}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. premier design & development services"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {bio.length} / 500
                </div>
              </div>
              
              </div> {/* End of grid layout container */}

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

        {activeTab === 'security' && (
          <div className="form-card settings-card animate-fade-in">
            <div className="card-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: '700', fontSize: '1.15rem' }}>Security / Update Password</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', lineHeight: '1.4' }}>
                Ensure your account stays protected by updating your credentials regularly.
              </span>
            </div>
            
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <label htmlFor="profile-current-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Current Password
                </label>
                <div className="input-group-premium">
                  <div className="input-group-icon">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="profile-current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="profile-new-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  New Password
                </label>
                <div className="input-group-premium">
                  <div className="input-group-icon">
                    <ShieldAlert size={16} />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="profile-new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="profile-confirm-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Confirm New Password
                </label>
                <div className="input-group-premium">
                  <div className="input-group-icon">
                    <ShieldCheck size={16} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="profile-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="password-strength-box" style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--bg-trans-2)', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Password strength check</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: newPassword.length >= 6 ? 'var(--success)' : 'var(--text-muted)' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: newPassword.length >= 6 ? 'var(--success)' : 'var(--text-muted)' }}></div>
                  <span>At least 6 characters</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: (/[0-9]/.test(newPassword) || /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) ? 'var(--success)' : 'var(--text-muted)' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: (/[0-9]/.test(newPassword) || /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) ? 'var(--success)' : 'var(--text-muted)' }}></div>
                  <span>Contains a number or special character</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: (newPassword && newPassword === confirmPassword) ? 'var(--success)' : 'var(--text-muted)' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: (newPassword && newPassword === confirmPassword) ? 'var(--success)' : 'var(--text-muted)' }}></div>
                  <span>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-change-password"
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="settings-stacked-cards animate-fade-in">
            <div className="form-card settings-card">
              <div className="settings-card-header">
                <div className="settings-card-title-row">
                  <Key size={18} />
                  <span className="settings-card-title-text">API Developer Credentials</span>
                </div>
                <div className="verified-badge">
                  <span className="pulse-dot"></span>
                  <span>Active</span>
                </div>
              </div>
              
              <div className="settings-body">
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>API DEVELOPER SECRET KEY</label>
                  <div className="developer-key-row">
                    <div className="input-group-premium readonly">
                      <div className="input-group-icon">
                        <Key size={16} />
                      </div>
                      <input
                        type={showDevToken ? 'text' : 'password'}
                        readOnly
                        value={developerToken}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDevToken(!showDevToken)}
                      >
                        {showDevToken ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <button type="button" onClick={copyDevToken} className="btn-copy-token">
                      <Copy size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-card settings-card">
              <div className="settings-card-header">
                <div className="settings-card-title-row">
                  <Webhook size={18} />
                  <span className="settings-card-title-text">CRM Webhook Integration</span>
                </div>
                <div className={`verified-badge ${webhookHealth === 'Active' ? 'active' : 'inactive'}`}>
                  <span className="pulse-dot"></span>
                  <span>{webhookHealth}</span>
                </div>
              </div>
              
              <div className="settings-body">
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>WEBHOOK TARGET URL</label>
                  <div className="input-group-premium">
                    <div className="input-group-icon">
                      <LinkIcon size={16} />
                    </div>
                    <input
                      type="text"
                      id="settings-webhook-url"
                      placeholder="e.g. https://hooks.zapier.com/..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="settings-card-actions">
                  <button type="button" onClick={handleSaveWebhook} className="btn-change-password">
                    <Save size={14} /> Save Webhook URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
