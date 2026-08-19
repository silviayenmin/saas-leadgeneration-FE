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

  return (
    <div className="page-container profile-sub-container animate-fade-in" style={{ padding: '1rem', gap: '1rem' }}>
      {/* Hero Header Banner */}
      <div className="profile-hero-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div className="hero-left">
          <div className="hero-avatar">
            {fullName.charAt(0)?.toUpperCase() || user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hero-meta">
            <h2>{fullName || user?.fullName || 'MapFlow User'}</h2>
            <div className="hero-subtext" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <span><Mail size={14} /> {email || user?.email}</span>
              {companyName && <span><span className="hero-bullet">•</span> <Building2 size={14} /> {companyName}</span>}
              <span><span className="hero-bullet">•</span> Member since: <strong>{joinedDate}</strong></span>
            </div>
          </div>
        </div>

        {/* Horizontal Integration Health Badges */}
        <div className="hero-right" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'flex-start', position: 'relative' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Integration Health
          </h4>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', position: 'relative' }}>
            
            {/* 1. Inbox Sync Badge */}
            {(() => {
              const cfg = getBadgeConfig(imapHealth);
              return (
                <div 
                  onClick={() => onSwitchTab && onSwitchTab('outreach-config')}
                  className="interactive-health-badge"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 0.85rem', borderRadius: '20px',
                    background: cfg.bg, border: cfg.border, fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer'
                  }}
                  title="Click to configure Inbox connection"
                >
                  <Mail size={12} style={{ color: cfg.text }} />
                  <span>Inbox: <strong style={{ color: cfg.text }}>{imapHealth}</strong></span>
                  <span className={`pulse-indicator ${cfg.dotClass}`}></span>
                </div>
              );
            })()}

            {/* 2. Google Sheets Badge */}
            {(() => {
              const cfg = getBadgeConfig(googleSheetsHealth === 'Active' ? 'Active' : 'Inactive');
              return (
                <div 
                  onClick={() => onSwitchTab && onSwitchTab('outreach-config')}
                  className="interactive-health-badge"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 0.85rem', borderRadius: '20px',
                    background: cfg.bg, border: cfg.border, fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer'
                  }}
                  title="Click to configure Google Sheets sync"
                >
                  <Building2 size={12} style={{ color: cfg.text }} />
                  <span>Sheets: <strong style={{ color: cfg.text }}>{googleSheetsHealth === 'Active' ? 'Active' : 'Inactive'}</strong></span>
                  <span className={`pulse-indicator ${cfg.dotClass}`}></span>
                </div>
              );
            })()}

            {/* 3. CRM Webhook Badge */}
            {(() => {
              const cfg = getBadgeConfig(webhookHealth);
              return (
                <div 
                  onClick={() => {
                    setActiveTab('integrations');
                    setTimeout(() => {
                      const element = document.getElementById('settings-webhook-url');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.focus();
                      }
                    }, 120);
                  }}
                  className="interactive-health-badge"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 0.85rem', borderRadius: '20px',
                    background: cfg.bg, border: cfg.border, fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer'
                  }}
                  title="Click to configure CRM Webhook URL"
                >
                  <Webhook size={12} style={{ color: cfg.text }} />
                  <span>Webhook: <strong style={{ color: cfg.text }}>{webhookHealth}</strong></span>
                  <span className={`pulse-indicator ${cfg.dotClass}`}></span>
                </div>
              );
            })()}

            {/* 4. Google Places API Badge */}
            {(() => {
              const cfg = getBadgeConfig(placesHealth === 'Active' ? 'Active' : 'Fallback');
              return (
                <div 
                  onClick={() => onSwitchTab && onSwitchTab('outreach-config')}
                  className="interactive-health-badge"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 0.85rem', borderRadius: '20px',
                    background: cfg.bg, border: cfg.border, fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer'
                  }}
                  title="Click to configure Google Places API keys"
                >
                  <Key size={12} style={{ color: cfg.text }} />
                  <span>Places API: <strong style={{ color: cfg.text }}>{placesHealth === 'Active' ? 'Active' : 'Fallback'}</strong></span>
                  <span className={`pulse-indicator ${cfg.dotClass}`}></span>
                </div>
              );
            })()}

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
      <div className="settings-forms-column" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
        
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="profile-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-card">
              <div className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <User size={18} className="title-icon" />
                <h3>Personal & Professional Profile</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>

              <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                    style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 0.75rem', height: '38px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div className="label-with-badge" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Email Address</label>
                  <span className="verified-pill" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '2px 8px', borderRadius: '12px' }}>
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
                    style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 0.75rem', height: '38px', color: 'var(--text-muted)', cursor: 'not-allowed', outline: 'none' }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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

              <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                    style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 0.75rem', height: '38px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                    style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 0.75rem', height: '38px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Primary Target Industry</label>
                <div className="input-group-premium">
                  <div className="input-group-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <CustomSelect
                      options={industryOptions}
                      value={targetIndustry}
                      onChange={setTargetIndustry}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                    style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 0.75rem', height: '38px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Value Pitch Profile & Core Offers</label>
                <div className="input-group-premium" style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div className="input-group-icon" style={{ height: 'auto' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <textarea
                    rows="3"
                    value={bio}
                    maxLength={500}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. premier design & development services"
                    style={{ border: 'none', background: 'transparent', flex: 1, padding: '0.75rem', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', minHeight: '80px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {bio.length} / 500
                </div>
              </div>
              
              </div> {/* End of grid layout container */}

              <button type="submit" className={`btn-save-profile ${savingProfile ? 'loading' : ''}`} disabled={savingProfile} style={{ marginTop: '1.5rem', alignSelf: 'flex-start' }}>
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
          <div className="card settings-card animate-fade-in" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', marginBottom: 0 }}>
            <div className="card-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
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
                    style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 2.5rem 0 0.75rem', height: '38px', color: 'var(--text-primary)', outline: 'none' }}
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

              <div className="form-group" style={{ marginBottom: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                    style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 2.5rem 0 0.75rem', height: '38px', color: 'var(--text-primary)', outline: 'none' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                    style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 2.5rem 0 0.75rem', height: '38px', color: 'var(--text-primary)', outline: 'none' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--bg-trans-2)', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                className="btn btn-primary"
                disabled={isResettingPassword}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '38px', borderRadius: '6px', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold' }}
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
          <div className="settings-stacked-cards animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card settings-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', marginBottom: 0 }}>
              <div className="settings-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div className="settings-card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Key size={18} style={{ color: 'var(--primary)' }} />
                  <span className="settings-card-title-text" style={{ fontWeight: '700', fontSize: '1.15rem' }}>API Developer Credentials</span>
                </div>
                <div className="status-pulse-pill status-active" style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '12px', color: 'var(--success)' }}>
                  <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
                  <span>Active</span>
                </div>
              </div>
              
              <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>API DEVELOPER SECRET KEY</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="input-group-premium readonly" style={{ flexGrow: 1 }}>
                      <div className="input-group-icon">
                        <Key size={16} />
                      </div>
                      <input
                        type={showDevToken ? 'text' : 'password'}
                        readOnly
                        style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 2.5rem 0 0.75rem', height: '38px', color: 'var(--text-primary)', fontFamily: 'monospace', outline: 'none', cursor: 'not-allowed' }}
                        value={developerToken}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDevToken(!showDevToken)}
                        style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {showDevToken ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <button type="button" onClick={copyDevToken} className="btn btn-glow-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', height: '38px', padding: '0 0.85rem', cursor: 'pointer', borderRadius: '6px', background: 'transparent', color: 'var(--text-primary)' }}>
                      <Copy size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card settings-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', marginBottom: 0 }}>
              <div className="settings-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div className="settings-card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Webhook size={18} style={{ color: 'var(--primary)' }} />
                  <span className="settings-card-title-text" style={{ fontWeight: '700', fontSize: '1.15rem' }}>CRM Webhook Integration</span>
                </div>
                <div className={`status-pulse-pill ${webhookHealth === 'Active' ? 'status-active' : 'status-inactive'}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', display: 'flex', alignItems: 'center', gap: '4px', background: webhookHealth === 'Active' ? 'var(--success-bg)' : 'var(--bg-trans-3)', border: webhookHealth === 'Active' ? '1px solid var(--success-border)' : '1px solid var(--border-color)', borderRadius: '12px', color: webhookHealth === 'Active' ? 'var(--success)' : 'var(--text-muted)' }}>
                  <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: webhookHealth === 'Active' ? 'var(--success)' : 'var(--text-muted)' }}></span>
                  <span>{webhookHealth}</span>
                </div>
              </div>
              
              <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>WEBHOOK TARGET URL</label>
                  <div className="input-group-premium">
                    <div className="input-group-icon">
                      <LinkIcon size={16} />
                    </div>
                    <input
                      type="text"
                      id="settings-webhook-url"
                      placeholder="e.g. https://hooks.zapier.com/..."
                      style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 0.75rem', height: '38px', color: 'var(--text-primary)', outline: 'none' }}
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="settings-card-actions" style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                  <button type="button" onClick={handleSaveWebhook} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px', padding: '0 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
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
