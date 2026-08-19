import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Mail,
  Server,
  Hash,
  Key,
  Save,
  RefreshCw,
  Cpu,
  Link as LinkIcon,
  MapPin,
  Eye,
  EyeOff,
  User,
  Briefcase,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Webhook,
  Copy,
  Sun,
  Moon,
  Calendar,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { parseIsoDate, getPlatformIcon } from '../utils/helpers';
import './OutreachConfig.scss';

export default function OutreachConfig({ onProfileUpdate, initialSubTab = 'campaign' }) {
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

  const [subTab, setSubTab] = useState(initialSubTab);
  const [activeCampaignSettingTab, setActiveCampaignSettingTab] = useState('imap'); // 'imap', 'sheets', 'api_keys'
  const [activeProfileTab, setActiveProfileTab] = useState('info'); // 'info', 'security', 'integrations'

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // IMAP settings
  const [imapServer, setImapServer] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [imapEmail, setImapEmail] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [imapHealth, setImapHealth] = useState('Not Configured'); // 'Active', 'Not Configured'

  // AI model settings
  const [modelConfig, setModelConfig] = useState(null);
  const [activePreset, setActivePreset] = useState('groq');
  const [providerType, setProviderType] = useState('groq');
  const [modelName, setModelName] = useState('');
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
  const [temperature, setTemperature] = useState(0.7);

  // API keys
  const [placesKey, setPlacesKey] = useState('');
  const [showPlacesKey, setShowPlacesKey] = useState(false);
  const [placesHealth, setPlacesHealth] = useState('Fallback: Playwright');

  const [twitterKey, setTwitterKey] = useState('');
  const [showTwitterKey, setShowTwitterKey] = useState(false);
  const [twitterHealth, setTwitterHealth] = useState('Fallback: Serper');

  // User profile
  const [displayName, setDisplayName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [agencyInfo, setAgencyInfo] = useState('');
  const [emailTone, setEmailTone] = useState('Short & Conversational');
  const [userEmail, setUserEmail] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [developerToken, setDeveloperToken] = useState('silvia_dev_key');
  const [showDevToken, setShowDevToken] = useState(false);

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookHealth, setWebhookHealth] = useState('Inactive');

  // Google Sheets settings
  const [googleSheetId, setGoogleSheetId] = useState('');
  const [googleClientEmail, setGoogleClientEmail] = useState('');
  const [googleCredsActive, setGoogleCredsActive] = useState(false);
  const [googleSheetsHealth, setGoogleSheetsHealth] = useState('Not Configured');

  // Password reset
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Previews test variables
  const [previewTab, setPreviewTab] = useState('email'); // 'email', 'linkedin'
  const [testAuthor, setTestAuthor] = useState('Sarah Jenkins');
  const [testCompany, setTestCompany] = useState('Acme Corp');
  const [testService, setTestService] = useState('React Development');
  const [showToneDropdown, setShowToneDropdown] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modern Toast Popup State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => (prev.message === message ? { ...prev, show: false } : prev));
    }, 3800);
  };


  const toneDropdownRef = useRef(null);

  // Close copywriting tone dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(event.target)) {
        setShowToneDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load configuration on mount
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const secretKey = localStorage.getItem('APP_SECRET_KEY') || 'silvia_dev_key';
    const headers = getHeaders(null);

    // 1. Fetch IMAP
    try {
      const res = await fetch('/api/outreach/config', { headers });
      if (res.ok) {
        const data = await res.json();
        const config = data.config || {};
        setImapServer(config.imap_server || '');
        setImapPort(config.imap_port || '993');
        setImapEmail(config.imap_email || '');
        setImapPassword(config.imap_password || '');
        if (config.imap_server && config.imap_email) {
          setImapHealth('Active');
        }
      }
    } catch (err) {
      console.error(err);
    }

    // 2. Fetch AI model presets
    try {
      const res = await fetch('/api/model-config', { headers });
      if (res.ok) {
        const data = await res.json();
        setModelConfig(data);
        const preset = data.active_provider || 'groq';
        setActivePreset(preset);
        const activeConf = (data.providers || {})[preset] || {};
        setProviderType(activeConf.provider_type || 'groq');
        setModelName(activeConf.model || '');
        setOllamaHost(activeConf.base_url || 'http://localhost:11434');
        setTemperature(activeConf.temperature !== undefined ? activeConf.temperature : 0.7);
      }
    } catch (err) {
      console.error(err);
    }

    // 3. Fetch Places Key
    try {
      const res = await fetch('/api/outreach/places', { headers });
      if (res.ok) {
        const data = await res.json();
        setPlacesKey(data.places_api_key || '');
        if (data.places_api_key) setPlacesHealth('Active');
      }
    } catch (err) {
      console.error(err);
    }

    // 4. Fetch Twitter Key
    try {
      const res = await fetch('/api/outreach/twitter', { headers });
      if (res.ok) {
        const data = await res.json();
        setTwitterKey(data.twitter_api_key || '');
        if (data.twitter_api_key) setTwitterHealth('Active');
      }
    } catch (err) {
      console.error(err);
    }

    // 5. Fetch Webhook CRM URL
    try {
      const res = await fetch('/api/outreach/webhook', { headers });
      if (res.ok) {
        const data = await res.json();
        setWebhookUrl(data.webhook_url || '');
        if (data.webhook_url) setWebhookHealth('Active');
      }
    } catch (err) {
      console.error(err);
    }

    // 5b. Fetch Google Sheets configuration
    try {
      const res = await fetch('/api/config/google-sheets', { headers });
      if (res.ok) {
        const data = await res.json();
        setGoogleSheetId(data.sheet_id || '');
        setGoogleClientEmail(data.client_email || '');
        setGoogleCredsActive(data.credentials_active || false);
        
        if (!data.credentials_active) {
          setGoogleSheetsHealth('Inactive (Credentials Missing)');
        } else if (data.sheet_id) {
          setGoogleSheetsHealth('Active');
        } else {
          setGoogleSheetsHealth('Not Configured');
        }
      }
    } catch (err) {
      console.error(err);
    }

    // 6. Fetch User Profile
    try {
      const res = await fetch('/api/user/profile', { headers });
      if (res.ok) {
        const data = await res.json();
        const profile = data.profile || {};
        setDisplayName(profile.displayName || '');
        setBusinessName(profile.businessName || '');
        setAgencyInfo(profile.agencyInfo || '');
        if (profile.agencyInfo) {
          localStorage.setItem('silvia_agency_info', profile.agencyInfo);
        }
        setUserEmail(profile.email || '');
        setJoinedDate(profile.createdAt ? parseIsoDate(profile.createdAt).toLocaleDateString() : 'June 19, 2026');
        setDeveloperToken(secretKey);

        // Notify App.jsx about profile details loaded
        if (onProfileUpdate) {
          onProfileUpdate({
            email: profile.email || '',
            businessName: profile.businessName || 'LeadFlow'
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveImap = async () => {
    if (!imapServer || !imapPort || !imapEmail || !imapPassword) {
      showToast('Please fill in all IMAP settings fields.', 'error');
      return;
    }
    const secretKey = localStorage.getItem('APP_SECRET_KEY') || 'silvia_dev_key';
    try {
      const response = await fetch('/api/outreach/config', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          imap_server: imapServer.trim(),
          imap_port: imapPort.trim(),
          imap_email: imapEmail.trim(),
          imap_password: imapPassword
        })
      });
      if (response.ok) {
        showToast('IMAP configuration saved successfully!', 'success');
        setImapHealth('Active');
      } else {
        showToast('Failed to save IMAP configuration.', 'error');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    }
  };

  const handleSyncReplies = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    const secretKey = localStorage.getItem('APP_SECRET_KEY') || 'silvia_dev_key';
    try {
      const response = await fetch('/api/outreach/sync-replies', {
        method: 'POST',
        headers: getHeaders(null)
      });
      if (response.ok) {
        const data = await response.json();
        showToast(`Inbox replies synchronized successfully! Found ${data.newRepliesCount || 0} new replies.`, 'success');
        const count = data.newRepliesCount || 0;
        if (count > 0 && data.replies && data.replies.length > 0) {
          const listStr = data.replies.map(r => `- ${r.companyName || 'Unknown'} (${r.email})`).join('\n');
          alert(`Inbox replies synchronized successfully! Found ${count} new replies:\n\n${listStr}\n\nThese leads have been automatically moved to the "Replied" stage in your Outreach Pipeline.`);
        } else {
          alert('Inbox replies synchronized. No new replies found.');
        }
      } else {
        showToast('Failed to sync replies.', 'error');
      }
    } catch (err) {
      showToast('Sync error: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };


  const handleSaveModel = async () => {
    if (!modelConfig) return;
    const secretKey = localStorage.getItem('APP_SECRET_KEY') || 'silvia_dev_key';
    
    // Build payload preserving other providers in the config cache
    const updatedConfig = { ...modelConfig };
    updatedConfig.active_provider = activePreset;
    if (!updatedConfig.providers) updatedConfig.providers = {};
    updatedConfig.providers[activePreset] = {
      provider_type: providerType,
      model: modelName.trim(),
      base_url: ollamaHost.trim(),
      temperature: parseFloat(temperature)
    };

    try {
      const response = await fetch('/api/model-config', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(updatedConfig)
      });
      if (response.ok) {
        showToast('AI Model configuration saved successfully!', 'success');
        setModelConfig(updatedConfig);
      } else {
        showToast('Failed to save AI Model configuration.', 'error');
      }
    } catch (err) {
      showToast('Model config save error: ' + err.message, 'error');
    }
  };

  const handleSavePlaces = async () => {
    const secretKey = localStorage.getItem('APP_SECRET_KEY') || 'silvia_dev_key';
    try {
      const response = await fetch('/api/outreach/places', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ places_api_key: placesKey.trim() })
      });
      if (response.ok) {
        showToast('Google Places key saved!', 'success');
        setPlacesHealth(placesKey ? 'Active' : 'Fallback: Playwright');
      } else {
        showToast('Failed to save Google Places settings.', 'error');
      }
    } catch (err) {
      showToast('Places key save error: ' + err.message, 'error');
    }
  };

  const handleSaveTwitter = async () => {
    const secretKey = localStorage.getItem('APP_SECRET_KEY') || 'silvia_dev_key';
    try {
      const response = await fetch('/api/outreach/twitter', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ twitter_api_key: twitterKey.trim() })
      });
      if (response.ok) {
        showToast('Twitter/X API Key saved!', 'success');
        setTwitterHealth(twitterKey ? 'Active' : 'Fallback: Serper');
      } else {
        showToast('Failed to save Twitter settings.', 'error');
      }
    } catch (err) {
      showToast('Twitter key save error: ' + err.message, 'error');
    }
  };

  const handleSaveGoogleSheets = async () => {
    const headers = getHeaders();

    try {
      const res = await fetch('/api/config/google-sheets', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sheet_id: googleSheetId.trim() })
      });

      if (res.ok) {
        if (!googleCredsActive) {
          setGoogleSheetsHealth('Inactive (Credentials Missing)');
        } else if (googleSheetId.trim()) {
          setGoogleSheetsHealth('Active');
        } else {
          setGoogleSheetsHealth('Not Configured');
        }
        showToast('Google Sheets configuration saved successfully!', 'success');
      } else {
        const errorData = await res.json();
        showToast(`Failed to save Google Sheets configuration: ${errorData.detail || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      showToast(`Error saving Google Sheets configuration: ${err.message}`, 'error');
    }
  };

  const handleSaveProfile = async () => {
    const secretKey = localStorage.getItem('APP_SECRET_KEY') || 'silvia_dev_key';
    try {
      const response = await fetch('/api/user/profile/update', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          displayName: displayName.trim(),
          businessName: businessName.trim(),
          agencyInfo: agencyInfo.trim()
        })
      });
      if (response.ok) {
        localStorage.setItem('silvia_agency_info', agencyInfo.trim());
        showToast('Profile details saved!', 'success');
        if (onProfileUpdate) {
          onProfileUpdate({
            email: userEmail,
            businessName: businessName.trim()
          });
        }
      } else {
        showToast('Failed to save profile changes.', 'error');
      }
    } catch (err) {
      showToast('Profile save error: ' + err.message, 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill out all password fields.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    const secretKey = localStorage.getItem('APP_SECRET_KEY') || 'silvia_dev_key';
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      if (response.ok) {
        showToast('Password updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await response.json();
        showToast(err.detail || 'Failed to change password.', 'error');
      }
    } catch (err) {
      showToast('Security change error: ' + err.message, 'error');
    }
  };

  const handleSaveWebhook = async () => {
    const secretKey = localStorage.getItem('APP_SECRET_KEY') || 'silvia_dev_key';
    try {
      const response = await fetch('/api/outreach/webhook', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ webhook_url: webhookUrl.trim() })
      });
      if (response.ok) {
        showToast('Zapier/Webhook CRM Integration URL saved!', 'success');
        setWebhookHealth(webhookUrl ? 'Active' : 'Inactive');
      } else {
        showToast('Failed to save webhook integration.', 'error');
      }
    } catch (err) {
      showToast('Webhook integration error: ' + err.message, 'error');
    }
  };

  // Preset values changes
  const handlePresetChange = (presetName) => {
    setActivePreset(presetName);
    if (modelConfig) {
      const activeConf = (modelConfig.providers || {})[presetName] || {};
      setProviderType(activeConf.provider_type || 'groq');
      setModelName(activeConf.model || '');
      setOllamaHost(activeConf.base_url || 'http://localhost:11434');
      setTemperature(activeConf.temperature !== undefined ? activeConf.temperature : 0.7);
    }
  };

  // Copy developer token
  const copyDevToken = () => {
    navigator.clipboard.writeText(developerToken);
    showToast('Developer token copied to clipboard!', 'info');
  };

  // Generate copywriting pitch previews
  const previewsText = useMemo(() => {
    const agName = businessName.trim() || 'My Business';
    const agInfo = agencyInfo.trim() || 'premier design & development services';
    
    let emailSubject = `Outreach Pitch - ${agName}`;
    let emailBody = '';
    let linkedinMsg = '';

    if (emailTone === 'Professional & Formal') {
      emailSubject = `Inquiry: Support with ${testService} for ${testCompany} - ${agName}`;
      emailBody = `Dear ${testAuthor},<br><br>
I hope this message finds you well.<br><br>
I am writing on behalf of <strong>${agName}</strong> regarding your recent request for assistance with ${testService} at ${testCompany}.<br><br>
Our organization specializes in delivering premium solutions in the area of ${agInfo}. We have a proven track record of helping companies optimize their operations and implement high-performing technologies.<br><br>
I would welcome the opportunity to schedule a formal introduction call next week to discuss how we can support your team in achieving its goals. Please let me know your availability.<br><br>
Sincerely,<br>
The ${agName} Team`;
      
      linkedinMsg = `Hello ${testAuthor}. I trust you are having a productive week. I observed your inquiry regarding support for ${testService} at ${testCompany}. ${agName} offers extensive expertise in ${agInfo}, and we would be pleased to evaluate your project needs. Let me know if we can arrange a brief introductory call.`;
    } else if (emailTone === 'Value Pitch (Free Audit)') {
      emailSubject = `Free audit: ${testService} optimization for ${testCompany}`;
      emailBody = `Hi ${testAuthor},<br><br>
I noticed ${testCompany} is sourcing support for ${testService}. We specialize in ${agInfo} at <strong>${agName}</strong>.<br><br>
To show you the value we can bring, we would love to conduct a complimentary audit of your current system or setup. No strings attached—we will simply identify 3 key performance or design bottlenecks and send over our recommendations.<br><br>
Would you be open to a quick 10-minute session to kick off this audit?<br><br>
Best regards,<br>
The ${agName} Team`;

      linkedinMsg = `Hi ${testAuthor}! Saw you're looking for support with ${testService}. We run ${agName} (specialists in ${agInfo}). To show you how we work, we'd love to run a free audit on your current setup and share 3 actionable optimization tips. Open to this?`;
    } else if (emailTone === 'Aggressive Pitch (Meeting link)') {
      emailSubject = `10x your ${testService} delivery - ${agName} + ${testCompany}`;
      emailBody = `Hi ${testAuthor},<br><br>
If you're looking for help with ${testService}, let's get straight to the point. Most agencies promise results but fail to deliver. At <strong>${agName}</strong>, we are experts in ${agInfo}.<br><br>
We guarantee to streamline your ${testService} pipeline and deliver robust, production-ready code in half the time of standard timelines.<br><br>
Let's skip the endless back-and-forth. Pick a time directly on my calendar here to discuss: <strong>calendly.com/${agName.toLowerCase().replace(/[^a-z0-9]/g, '')}/demo</strong><br><br>
Thanks,<br>
The ${agName} Team`;

      linkedinMsg = `Hey ${testAuthor} - saw your post about ${testService} for ${testCompany}. We build high-velocity ${agInfo} at ${agName}. Let's hop on a quick 5-min call to see if we can help you hit your milestones ahead of schedule: calendly.com/${agName.toLowerCase().replace(/[^a-z0-9]/g, '')}/demo`;
    } else {
      // Default: Short & Conversational
      emailSubject = `Outreach Pitch - ${agName}`;
      emailBody = `Hi ${testAuthor},<br><br>
I saw your recent post mentioning that ${testCompany} is looking for support with ${testService}.<br><br>
We run <strong>${agName}</strong>, specializing in ${agInfo}. Given your requirements, I think our background aligns perfectly.<br><br>
Are you open to a brief chat or a free code review this week?<br><br>
Best,<br>
The ${agName} Team`;

      linkedinMsg = `Hey ${testAuthor}! Saw your post about ${testCompany} looking for help with ${testService}. At ${agName}, we build ${agInfo}. I think our design/dev capabilities match your request exactly. Do you have 5 minutes to discuss this?`;
    }

    return { emailSubject, emailBody, linkedinMsg };
  }, [businessName, agencyInfo, emailTone, testAuthor, testCompany, testService]);

  return (
    <div id="view-settings" className="tab-view active">
      <div className="settings-view-header">
        <div>
          <h2>Outreach Config & Settings</h2>
          <p>Customize parameters to optimize personalized pitches and developer configurations.</p>
        </div>
        
        {/* Toggle between Outreach Config elements and User Profile elements */}
        <div className="settings-main-tabs-container">
          <button
            type="button"
            className={`settings-main-tab ${subTab === 'campaign' ? 'active' : ''}`}
            onClick={() => setSubTab('campaign')}
          >
            <Cpu size={15} />
            <span>Campaign Configuration</span>
          </button>
          <button
            type="button"
            className={`settings-main-tab ${subTab === 'profile' ? 'active' : ''}`}
            onClick={() => setSubTab('profile')}
          >
            <User size={15} />
            <span>Workspace & Profile</span>
          </button>
        </div>
      </div>

      {subTab === 'campaign' ? (
        /* Outreach Campaign & API keys */
        <div className="settings-split-layout">
          {/* Left Column: Form Settings Tabs */}
          <div className="settings-forms-column">
            {/* Inner settings tabs navigation */}
            <div className="settings-inner-tabs">
              <button
                type="button"
                className={`settings-inner-tab ${activeCampaignSettingTab === 'imap' ? 'active' : ''}`}
                onClick={() => setActiveCampaignSettingTab('imap')}
              >
                <Mail size={16} />
                <span>Email Sync</span>
              </button>
              
              <button
                type="button"
                className={`settings-inner-tab ${activeCampaignSettingTab === 'sheets' ? 'active' : ''}`}
                onClick={() => setActiveCampaignSettingTab('sheets')}
              >
                <LinkIcon size={16} />
                <span>Google Sheets</span>
              </button>

              <button
                type="button"
                className={`settings-inner-tab ${activeCampaignSettingTab === 'model' ? 'active' : ''}`}
                onClick={() => setActiveCampaignSettingTab('model')}
              >
                <Cpu size={16} />
                <span>AI Model</span>
              </button>
              
              <button
                type="button"
                className={`settings-inner-tab ${activeCampaignSettingTab === 'api_keys' ? 'active' : ''}`}
                onClick={() => setActiveCampaignSettingTab('api_keys')}
              >
                <Key size={16} />
                <span>API Keys</span>
              </button>
            </div>

            {/* Render selected settings card */}
            <div className="settings-active-card-container">
              {activeCampaignSettingTab === 'imap' && (
                <div className="card settings-card animate-fade-in" style={{ marginBottom: 0 }}>
                  <div className="settings-card-header">
                    <div className="settings-card-title-row">
                      <Mail size={18} style={{ color: 'var(--primary)' }} />
                      <span className="settings-card-title-text">Inbox Sync Configuration (IMAP)</span>
                    </div>
                    <div className="settings-card-status-row">
                      <div className={`status-pulse-pill ${imapHealth === 'Active' ? 'status-active' : 'status-inactive'}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem' }}>
                        <span className="pulse-dot"></span>
                        <span className="status-text">{imapHealth}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: 0, width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="settings-imap-server">IMAP Server</label>
                        <div className="input-wrapper">
                          <Server className="input-icon" size={14} />
                          <input
                            type="text"
                            id="settings-imap-server"
                            className="form-control"
                            placeholder="e.g. imap.gmail.com"
                            autoComplete="off"
                            value={imapServer}
                            onChange={(e) => setImapServer(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="settings-imap-port">IMAP Port</label>
                        <div className="input-wrapper">
                          <Hash className="input-icon" size={14} />
                          <input
                            type="text"
                            id="settings-imap-port"
                            className="form-control"
                            placeholder="e.g. 993"
                            autoComplete="off"
                            value={imapPort}
                            onChange={(e) => setImapPort(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="settings-imap-email">Email Address</label>
                        <div className="input-wrapper">
                          <Mail className="input-icon" size={14} />
                          <input
                            type="email"
                            id="settings-imap-email"
                            className="form-control"
                            placeholder="e.g. name@gmail.com"
                            autoComplete="off"
                            value={imapEmail}
                            onChange={(e) => setImapEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="settings-imap-password">App Password</label>
                        <div className="input-wrapper">
                          <Key className="input-icon" size={14} />
                          <input
                            type="password"
                            id="settings-imap-password"
                            className="form-control"
                            placeholder="App password..."
                            autoComplete="new-password"
                            value={imapPassword}
                            onChange={(e) => setImapPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="settings-card-actions">
                        <button type="button" onClick={handleSaveImap} className="btn btn-primary flex-1">
                          <Save size={14} style={{ marginRight: '6px' }} /> Save Settings
                        </button>
                        <button 
                          type="button" 
                          onClick={handleSyncReplies} 
                          className="btn btn-glow-outline flex-1"
                          disabled={isSyncing}
                        >
                          <RefreshCw size={14} className={isSyncing ? "spin-animation" : ""} style={{ marginRight: '6px' }} /> 
                          {isSyncing ? 'Syncing...' : 'Sync Replies'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeCampaignSettingTab === 'sheets' && (
                <div className="card settings-card animate-fade-in" style={{ marginBottom: 0 }}>
                  <div className="settings-card-header">
                    <div className="settings-card-title-row">
                      <LinkIcon size={18} style={{ color: 'var(--primary)' }} />
                      <span className="settings-card-title-text">Google Sheets Synchronization</span>
                    </div>
                    <div className="settings-card-status-row">
                      <div className={`status-pulse-pill ${googleSheetsHealth === 'Active' ? 'status-active' : 'status-inactive'}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem' }}>
                        <span className="pulse-dot"></span>
                        <span className="status-text">{googleSheetsHealth}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: 0, width: '100%' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="settings-sheets-id">Google Sheet ID or URL</label>
                      <div className="input-wrapper" style={{ marginTop: '0.35rem', position: 'relative' }}>
                        <LinkIcon className="input-icon" size={14} />
                        <input
                          type="text"
                          id="settings-sheets-id"
                          className="form-control"
                          placeholder="e.g. 1aBCdEfGhIJKlMnOpQrStUvWxYz..."
                          style={{ paddingLeft: '2.25rem' }}
                          value={googleSheetId}
                          onChange={(e) => setGoogleSheetId(e.target.value)}
                        />
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Paste either the full spreadsheet URL or just the Spreadsheet ID.
                      </p>
                    </div>
                    
                    {googleCredsActive ? (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="settings-sheets-email">Service Account Email</label>
                        <div className="input-wrapper" style={{ marginTop: '0.35rem', position: 'relative', display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            id="settings-sheets-email"
                            className="form-control"
                            readOnly
                            style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-secondary)' }}
                            value={googleClientEmail}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ width: 'auto', padding: '0 0.85rem', height: '36px' }}
                            onClick={() => {
                              navigator.clipboard.writeText(googleClientEmail);
                              showToast('Service Account email copied to clipboard!', 'info');
                            }}
                            title="Copy email to clipboard"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: '500' }}>
                          * In Google sheets click <strong>Share</strong> and then give this email as an <strong>Editor</strong>.
                        </p>
                      </div>
                    ) : (
                      <div className="settings-warning-banner">
                        <ShieldAlert size={16} />
                        <span>
                          <code>google_credentials.json</code> file is missing in the backend root directory. Place your Google Service Account credentials JSON file to enable sync.
                        </span>
                      </div>
                    )}
                    
                    <div className="settings-card-actions">
                      <button type="button" onClick={handleSaveGoogleSheets} className="btn btn-primary">
                        <Save size={16} /> Save Sheets Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeCampaignSettingTab === 'model' && (
                <div className="card settings-card animate-fade-in" style={{ marginBottom: 0 }}>
                  <div className="settings-card-header">
                    <div className="settings-card-title-row">
                      <Cpu size={18} style={{ color: 'var(--primary)' }} />
                      <span className="settings-card-title-text">AI LLM Model Configuration</span>
                    </div>
                  </div>
                  
                  <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: 0, width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="settings-model-preset-select">Active Preset</label>
                        <div className="input-wrapper" style={{ marginTop: '0.35rem' }}>
                          <Cpu className="input-icon" size={14} style={{ color: 'var(--primary)' }} />
                          <select
                            id="settings-model-preset-select"
                            className="form-control"
                            style={{ paddingLeft: '2.25rem' }}
                            value={activePreset}
                            onChange={(e) => handlePresetChange(e.target.value)}
                          >
                            {modelConfig && modelConfig.providers ? (
                              Object.keys(modelConfig.providers).map((presetName) => (
                                <option key={presetName} value={presetName}>
                                  {presetName}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="groq">groq</option>
                                <option value="openai">openai</option>
                                <option value="ollama">ollama</option>
                                <option value="anthropic">anthropic</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="settings-model-type-select">Provider Type</label>
                        <div className="input-wrapper" style={{ marginTop: '0.35rem' }}>
                          <Server className="input-icon" size={14} style={{ color: 'var(--primary)' }} />
                          <select
                            id="settings-model-type-select"
                            className="form-control"
                            style={{ paddingLeft: '2.25rem' }}
                            value={providerType}
                            onChange={(e) => setProviderType(e.target.value)}
                          >
                            <option value="groq">Groq</option>
                            <option value="openai">OpenAI</option>
                            <option value="ollama">Ollama</option>
                            <option value="anthropic">Anthropic (Claude)</option>
                          </select>
                        </div>
                      </div>

                      {providerType === 'ollama' && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label htmlFor="settings-model-host">Ollama Server Host</label>
                          <div className="input-wrapper" style={{ marginTop: '0.35rem' }}>
                            <Server className="input-icon" size={14} style={{ color: 'var(--primary)' }} />
                            <input
                              type="text"
                              id="settings-model-host"
                              className="form-control"
                              style={{ paddingLeft: '2.25rem' }}
                              value={ollamaHost}
                              onChange={(e) => setOllamaHost(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="settings-model-name-input">Model Name</label>
                        <div className="input-wrapper" style={{ marginTop: '0.35rem' }}>
                          <Hash className="input-icon" size={14} style={{ color: 'var(--primary)' }} />
                          <input
                            type="text"
                            id="settings-model-name-input"
                            className="form-control"
                            style={{ paddingLeft: '2.25rem' }}
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            placeholder={providerType === 'groq' ? 'llama-3.1-70b-versatile' : 'model name'}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="settings-model-temp" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Temperature: {temperature}</label>
                        </div>
                        <input
                          type="range"
                          id="settings-model-temp"
                          min="0"
                          max="1.2"
                          step="0.1"
                          className="slider-input"
                          style={{
                            width: '100%',
                            marginTop: '0.5rem',
                            background: `linear-gradient(to right, #85e8e9ff 0%, #037172 ${((temperature - 0) / (1.2 - 0)) * 100}%, rgba(0,0,0,0.12) ${((temperature - 0) / (1.2 - 0)) * 100}%, rgba(0,0,0,0.12) 100%)`
                          }}
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="settings-card-actions">
                      <button
                        type="button"
                        onClick={handleSaveModel}
                        className="btn btn-primary"
                      >
                        <Save size={16} /> Save Model Configuration
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeCampaignSettingTab === 'api_keys' && (
                <div className="settings-stacked-cards animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Google Places API Key */}
                  <div className="card settings-card" style={{ marginBottom: 0 }}>
                  <div className="settings-card-header">
                    <div className="settings-card-title-row">
                      <MapPin size={18} style={{ color: 'var(--primary)' }} />
                      <span className="settings-card-title-text">Google Places API Configuration</span>
                    </div>
                    <div className="settings-card-status-row">
                      <div className={`status-pulse-pill ${placesHealth === 'Active' ? 'status-active' : 'status-inactive'}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem' }}>
                        <span className="pulse-dot"></span>
                        <span className="status-text">{placesHealth}</span>
                      </div>
                    </div>
                  </div>
                    
                    <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: 0, width: '100%' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="settings-places-key">Google Places API Key</label>
                        <div className="input-wrapper" style={{ marginTop: '0.35rem', position: 'relative' }}>
                          <Key className="input-icon" size={14} style={{ color: 'var(--warning)' }} />
                          <input
                            type={showPlacesKey ? 'text' : 'password'}
                            id="settings-places-key"
                            className="form-control"
                            placeholder="e.g. AIzaSy..."
                            style={{ paddingLeft: '2.25rem', fontFamily: 'monospace' }}
                            value={placesKey}
                            onChange={(e) => setPlacesKey(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPlacesKey(!showPlacesKey)}
                            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          >
                            {showPlacesKey ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          If empty, Google Maps scanner falls back to local browser Playwright scraping.
                        </p>
                      </div>
                      <div className="settings-card-actions">
                        <button type="button" onClick={handleSavePlaces} className="btn btn-primary">
                          <Save size={16} /> Save Places Settings
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Twitter API Key */}
                  <div className="card settings-card" style={{ marginBottom: 0 }}>
                    <div className="settings-card-header">
                      <div className="settings-card-title-row">
                        {getPlatformIcon('twitter', 18, { color: 'var(--primary)' })}
                        <span className="settings-card-title-text">Twitter / X API Configuration</span>
                      </div>
                      <div className="settings-card-status-row">
                        <div className={`status-pulse-pill ${twitterHealth === 'Active' ? 'status-active' : 'status-inactive'}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem' }}>
                          <span className="pulse-dot"></span>
                          <span className="status-text">{twitterHealth}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: 0, width: '100%' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="settings-twitter-key">Twitter API Key</label>
                        <div className="input-wrapper" style={{ marginTop: '0.35rem', position: 'relative' }}>
                          <Key className="input-icon" size={14} style={{ color: 'var(--warning)' }} />
                          <input
                            type={showTwitterKey ? 'text' : 'password'}
                            id="settings-twitter-key"
                            className="form-control"
                            placeholder="e.g. consumer key..."
                            style={{ paddingLeft: '2.25rem', fontFamily: 'monospace' }}
                            value={twitterKey}
                            onChange={(e) => setTwitterKey(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowTwitterKey(!showTwitterKey)}
                            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          >
                            {showTwitterKey ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          If empty, scraping falls back to Serper API search engine crawling.
                        </p>
                      </div>
                      <div className="settings-card-actions">
                        <button type="button" onClick={handleSaveTwitter} className="btn btn-primary">
                          <Save size={16} /> Save Twitter Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Unified Preview (Always Visible) */}
          <div className="settings-previews-column">
            <div className="unified-preview-browser" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="browser-header-bar">
                <div className="browser-header-left">
                  <div className="browser-window-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <div className="browser-tabs-container">
                    <button
                      type="button"
                      className={`browser-tab-button preview-tab-btn ${previewTab === 'email' ? 'active' : ''}`}
                      onClick={() => setPreviewTab('email')}
                    >
                      <Mail size={12} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} /> Email Draft
                    </button>
                    <button
                      type="button"
                      className={`browser-tab-button preview-tab-btn ${previewTab === 'linkedin' ? 'active' : ''}`}
                      onClick={() => setPreviewTab('linkedin')}
                    >
                      {getPlatformIcon('linkedin', 12, { marginRight: '4px', verticalAlign: 'text-bottom' })} LinkedIn DM
                    </button>
                  </div>
                </div>
              </div>

              {/* Variables Mockup bar */}
              <div className="browser-toolbar-row">
                <div className="preview-vars-toolbar" style={{ flexWrap: 'wrap', gap: '4px' }}>
                  <div className="variable-tag-pill">
                    <span className="tag-name">{"{Author}"}</span>
                    <input
                      type="text"
                      className="tag-input"
                      value={testAuthor}
                      onChange={(e) => setTestAuthor(e.target.value)}
                    />
                  </div>
                  <div className="variable-tag-pill">
                    <span className="tag-name">{"{Company}"}</span>
                    <input
                      type="text"
                      className="tag-input"
                      value={testCompany}
                      onChange={(e) => setTestCompany(e.target.value)}
                    />
                  </div>
                  <div className="variable-tag-pill">
                    <span className="tag-name">{"{Service}"}</span>
                    <input
                      type="text"
                      className="tag-input"
                      value={testService}
                      onChange={(e) => setTestService(e.target.value)}
                    />
                  </div>

                  {/* Copywriting tone */}
                  <div
                    ref={toneDropdownRef}
                    className="variable-tag-pill custom-tone-dropdown-pill"
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'stretch'
                    }}
                  >
                    <div className="tag-name">Tone</div>
                    <button
                      type="button"
                      className="custom-tone-trigger"
                      onClick={() => setShowToneDropdown(!showToneDropdown)}
                    >
                      <span>{emailTone}</span>
                      <ChevronDown size={12} className={`caret-icon ${showToneDropdown ? 'rotated' : ''}`} />
                    </button>

                    {showToneDropdown && (
                      <div className="custom-tone-menu">
                        {[
                          "Short & Conversational",
                          "Professional & Formal",
                          "Value Pitch (Free Audit)",
                          "Aggressive Pitch (Meeting link)"
                        ].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`custom-tone-item ${emailTone === opt ? 'active' : ''}`}
                            onClick={() => {
                              setEmailTone(opt);
                              setShowToneDropdown(false);
                            }}
                          >
                            <span>{opt}</span>
                            {emailTone === opt && <span className="check-dot"></span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content mockup */}
              <div className="browser-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {previewTab === 'email' ? (
                  <div className="composer-window" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none' }}>
                    <div className="composer-fields" style={{ padding: '8px 16px' }}>
                      <div className="composer-field-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="field-label" style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subject:</span>
                        <span className="field-value" style={{ fontWeight: 500, fontSize: '0.75rem', color: 'var(--text-primary)' }}>{previewsText.emailSubject}</span>
                      </div>
                    </div>
                    <div
                      className="composer-body preview-body-content"
                      style={{ flexGrow: 1, padding: '1.25rem', overflowY: 'auto', minHeight: '300px', outline: 'none', fontSize: '0.78rem', color: 'var(--text-primary)', borderTop: '1px solid var(--border-color)' }}
                      dangerouslySetInnerHTML={{ __html: previewsText.emailBody }}
                    />
                  </div>
                ) : (
                  <div className="chat-window" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none' }}>
                    <div className="chat-header" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-trans-1)' }}>
                      <div className="chat-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.82rem', marginRight: '0.75rem' }}>
                        {testAuthor.split(' ').map((w) => w.charAt(0)).join('').substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div className="chat-user-details" style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="chat-username" style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)' }}>{testAuthor}</span>
                        <div className="chat-status-row" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span className="chat-status-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                          <span className="chat-status-text" style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 500 }}>Active now</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="chat-history" style={{ flexGrow: 1, padding: '1.25rem', overflowY: 'auto', background: 'var(--bg-trans-1)', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <div className="chat-message-bubble-container sent" style={{ alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '85%' }}>
                        <div
                          className="chat-message-bubble preview-body-content"
                          style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem 1rem', borderRadius: '12px 12px 0 12px', fontSize: '0.82rem', lineHeight: 1.5, outline: 'none' }}
                        >
                          {previewsText.linkedinMsg}
                        </div>
                        <span className="chat-message-time" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>1:56 PM · Sent</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Workspace Details & Security Password */
        <div className="settings-split-layout">
          {/* Left Column: Profile settings tabs */}
          <div className="settings-forms-column">
            {/* Inner profile tabs navigation */}
            <div className="settings-inner-tabs">
              <button
                type="button"
                className={`settings-inner-tab ${activeProfileTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveProfileTab('info')}
              >
                <User size={16} />
                <span>Profile</span>
              </button>
              
              <button
                type="button"
                className={`settings-inner-tab ${activeProfileTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveProfileTab('security')}
              >
                <Lock size={16} />
                <span>Security</span>
              </button>
              
              <button
                type="button"
                className={`settings-inner-tab ${activeProfileTab === 'integrations' ? 'active' : ''}`}
                onClick={() => setActiveProfileTab('integrations')}
              >
                <Terminal size={16} />
                <span>Developer / CRM</span>
              </button>
            </div>

            {/* Active profile card container */}
            <div className="settings-active-card-container">
              {activeProfileTab === 'info' && (
                <div className="card settings-card animate-fade-in" style={{ marginBottom: 0 }}>
                  <div className="settings-card-header">
                    <div className="settings-card-title-row">
                      <User size={18} style={{ color: 'var(--primary)' }} />
                      <span className="settings-card-title-text">Account Information</span>
                    </div>
                  </div>
                  <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
                      <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
                        <label htmlFor="profile-display-name">Display Name</label>
                        <div className="input-wrapper">
                          <User className="input-icon" size={14} />
                          <input
                            type="text"
                            id="profile-display-name"
                            className="form-control"
                            style={{ paddingLeft: '2.25rem' }}
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
                        <label htmlFor="profile-business-name">Business / Company Name</label>
                        <div className="input-wrapper">
                          <Briefcase className="input-icon" size={14} />
                          <input
                            type="text"
                            id="profile-business-name"
                            className="form-control"
                            style={{ paddingLeft: '2.25rem' }}
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
                        <label htmlFor="profile-agency-info">Value Pitch Profile & Core Offers</label>
                        <textarea
                          id="profile-agency-info"
                          className="form-control"
                          style={{ height: '100px', resize: 'vertical', padding: '0.65rem 0.85rem' }}
                          value={agencyInfo}
                          onChange={(e) => setAgencyInfo(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="settings-card-actions">
                      <button type="button" onClick={handleSaveProfile} className="btn btn-primary">
                        <Save size={14} /> Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'security' && (
                <div className="card settings-card animate-fade-in" style={{ marginBottom: 0 }}>
                  <div className="card-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Lock size={18} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontWeight: '700', fontSize: '1.15rem' }}>Security / Update Password</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', lineHeight: '1.4' }}>
                      Ensure your account stays protected by updating your credentials regularly.
                    </span>
                  </div>
                  
                  <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
                      <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
                        <label htmlFor="profile-current-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          Current Password
                        </label>
                        <div className="input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <Lock className="input-icon" size={14} style={{ color: 'var(--text-muted)' }} />
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            id="profile-current-password"
                            className="form-control"
                            style={{ paddingRight: '2.5rem' }}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            style={{
                              position: 'absolute',
                              right: '0.75rem',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '4px',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            title={showCurrentPassword ? 'Hide Password' : 'Show Password'}
                          >
                            {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
                        <label htmlFor="profile-new-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          New Password
                        </label>
                        <div className="input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <ShieldAlert className="input-icon" size={14} style={{ color: 'var(--text-muted)' }} />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            id="profile-new-password"
                            className="form-control"
                            style={{ paddingRight: '2.5rem' }}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            style={{
                              position: 'absolute',
                              right: '0.75rem',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '4px',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            title={showNewPassword ? 'Hide Password' : 'Show Password'}
                          >
                            {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
                        <label htmlFor="profile-confirm-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          Confirm New Password
                        </label>
                        <div className="input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <ShieldCheck className="input-icon" size={14} style={{ color: 'var(--text-muted)' }} />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="profile-confirm-password"
                            className="form-control"
                            style={{ paddingRight: '2.5rem' }}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                              position: 'absolute',
                              right: '0.75rem',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '4px',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                          >
                            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Password requirements checker */}
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'var(--bg-trans-2)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem',
                        width: '100%',
                        marginTop: '0.25rem'
                      }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>
                          Password strength check
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: newPassword.length >= 6 ? 'var(--success)' : 'var(--text-muted)', transition: 'color 0.2s', fontSize: '0.82rem' }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: newPassword.length >= 6 ? 'var(--success)' : 'var(--text-muted)',
                            boxShadow: newPassword.length >= 6 ? '0 0 6px var(--success)' : 'none',
                            transition: 'background 0.2s, box-shadow 0.2s'
                          }}></div>
                          <span>At least 6 characters</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: (/[0-9]/.test(newPassword) || /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) ? 'var(--success)' : 'var(--text-muted)', transition: 'color 0.2s', fontSize: '0.82rem' }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: (/[0-9]/.test(newPassword) || /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) ? 'var(--success)' : 'var(--text-muted)',
                            boxShadow: (/[0-9]/.test(newPassword) || /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) ? '0 0 6px var(--success)' : 'none',
                            transition: 'background 0.2s, box-shadow 0.2s'
                          }}></div>
                          <span>Contains a number or special character</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: (newPassword && newPassword === confirmPassword) ? 'var(--success)' : 'var(--text-muted)', transition: 'color 0.2s', fontSize: '0.82rem' }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: (newPassword && newPassword === confirmPassword) ? 'var(--success)' : 'var(--text-muted)',
                            boxShadow: (newPassword && newPassword === confirmPassword) ? '0 0 6px var(--success)' : 'none',
                            transition: 'background 0.2s, box-shadow 0.2s'
                          }}></div>
                          <span>Passwords match</span>
                        </div>
                      </div>
                    </div>

                    <div className="settings-card-actions">
                      <button type="button" onClick={handleResetPassword} className="btn btn-primary">
                        <RefreshCw size={14} /> Change Password
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'integrations' && (
                <div className="settings-stacked-cards animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* API Developer Credentials */}
                  <div className="card settings-card" style={{ marginBottom: 0 }}>
                    <div className="settings-card-header">
                      <div className="settings-card-title-row">
                        <Key size={18} style={{ color: 'var(--primary)' }} />
                        <span className="settings-card-title-text">API Developer Credentials</span>
                      </div>
                      <div className="settings-card-status-row">
                        <div className="status-pulse-pill status-active" style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem' }}>
                          <span className="pulse-dot"></span>
                          <span className="status-text">Active</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: 0 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>API DEVELOPER SECRET KEY</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                          <div className="input-wrapper" style={{ flexGrow: 1, position: 'relative' }}>
                            <Key className="input-icon" size={14} style={{ color: 'var(--warning)' }} />
                            <input
                              type={showDevToken ? 'text' : 'password'}
                              className="form-control"
                              readOnly
                              style={{ paddingLeft: '2.25rem', fontFamily: 'monospace', background: 'var(--bg-trans-2)' }}
                              value={developerToken}
                            />
                            <button
                              type="button"
                              onClick={() => setShowDevToken(!showDevToken)}
                              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                              {showDevToken ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          <button type="button" onClick={copyDevToken} className="btn btn-glow-outline" style={{ width: 'auto', padding: '0 0.85rem' }}>
                            <Copy size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CRM Webhook Integration */}
                  <div className="card settings-card" style={{ marginBottom: 0 }}>
                    <div className="settings-card-header">
                      <div className="settings-card-title-row">
                        <Webhook size={18} style={{ color: 'var(--primary)' }} />
                        <span className="settings-card-title-text">CRM Webhook Integration</span>
                      </div>
                      <div className="settings-card-status-row">
                        <div className={`status-pulse-pill ${webhookHealth === 'Active' ? 'status-active' : 'status-inactive'}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem' }}>
                          <span className="pulse-dot"></span>
                          <span className="status-text">{webhookHealth}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: 0 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>WEBHOOK TARGET URL</label>
                        <div className="input-wrapper" style={{ marginTop: '0.35rem' }}>
                          <LinkIcon className="input-icon" size={14} />
                          <input
                            type="text"
                            id="settings-webhook-url"
                            className="form-control"
                            placeholder="e.g. https://hooks.zapier.com/..."
                            style={{ paddingLeft: '2.25rem' }}
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="settings-card-actions">
                        <button type="button" onClick={handleSaveWebhook} className="btn btn-primary">
                          <Save size={14} /> Save Webhook URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Profile details dashboard */}
          <div className="settings-previews-column">
            <div className="card profile-dashboard-card" style={{ height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                <div className="profile-avatar-large" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '2rem', boxShadow: '0 8px 24px rgba(0, 180, 216, 0.2)' }}>
                  {displayName.split(' ').map((w) => w.charAt(0)).join('').substring(0, 2).toUpperCase() || 'US'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{displayName || 'User'}</h3>
                  <p style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{businessName || 'Workspace'}</p>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'var(--bg-trans-3)', padding: '0.25rem 0.65rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                    {userEmail}
                  </span>
                </div>
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  <Calendar size={14} style={{ color: 'var(--primary)' }} />
                  <span>Member since: <strong>{joinedDate}</strong></span>
                </div>
                
                {/* Integration Health Checklist */}
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Integration Health
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'var(--bg-trans-2)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Inbox Sync (IMAP)</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: imapHealth === 'Active' ? 'var(--success)' : 'var(--text-muted)' }}>
                      {imapHealth}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'var(--bg-trans-2)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Google Sheets Sync</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: googleSheetsHealth === 'Active' ? 'var(--success)' : 'var(--text-muted)' }}>
                      {googleSheetsHealth === 'Active' ? 'Active' : 'Not Configured'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'var(--bg-trans-2)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>CRM Webhook</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: webhookHealth === 'Active' ? 'var(--success)' : 'var(--text-muted)' }}>
                      {webhookHealth}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'var(--bg-trans-2)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Google Places API</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: placesHealth === 'Active' ? 'var(--success)' : 'var(--text-muted)' }}>
                      {placesHealth === 'Active' ? 'Active' : 'Fallback (Playwright)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Toast Notification Popup */}
      {toast.show && (
        <div className={`modern-toast-popup ${toast.type}`}>
          <div className="toast-icon-box">
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
          </div>
          <div className="toast-message-content">{toast.message}</div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            title="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
