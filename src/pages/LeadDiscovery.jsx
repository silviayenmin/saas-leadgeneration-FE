import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Map,
  Search,
  Sliders,
  Sparkles,
  Building,
  MapPin,
  Calendar,
  Database,
  Users,
  ArrowLeft,
  RefreshCw,
  Hash,
  Activity,
  Check,
  FileText,
  AlertTriangle,
  X,
  CreditCard
} from 'lucide-react';
import { getPlatformIcon } from '../utils/helpers';
import api from '../services/api';

export default function LeadDiscovery({ leads, setLeads, searches, setSearches, onSwitchTab, onOpenLead }) {
  const [goalMode, setGoalMode] = useState('social'); // Google Maps only (defaulted to social scan wrapper)
  const [step, setStep] = useState(1);

  // Modern Alert Modal State
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'error',
    isCreditError: false
  });

  const showAlert = (message, title = 'Notice', type = 'error') => {
    const isCredit = (message || '').toLowerCase().includes('credit') || (message || '').toLowerCase().includes('upgrade');
    setAlertModal({
      show: true,
      title: isCredit ? 'Insufficient Credits' : title,
      message,
      type,
      isCreditError: isCredit
    });
  };

  const closeAlert = () => {
    setAlertModal((prev) => ({ ...prev, show: false }));
  };

  // Portal selection state for Government Tenders Card (All default to checked)
  const [selectedPortals, setSelectedPortals] = useState({
    cppp: true,
    gem: true,
    tamil_nadu: true,
    karnataka: true,
    maharashtra: true
  });

  const togglePortal = (portalKey) => {
    setSelectedPortals((prev) => ({
      ...prev,
      [portalKey]: !prev[portalKey]
    }));
  };

  const handleStartTenderSync = async () => {
    const activePortals = Object.keys(selectedPortals).filter((k) => selectedPortals[k]);
    if (activePortals.length === 0) {
      showAlert('Please select at least one portal to sync.', 'Portal Required', 'warning');
      return;
    }

    try {
      localStorage.setItem('SELECTED_TENDER_PORTALS', JSON.stringify(activePortals));
    } catch (e) {}

    setIsScanning(true);
    setScanProgress(15);
    setScanStatusText(`Connecting to ${activePortals.map((p) => p.toUpperCase()).join(', ')} procurement gateways...`);

    try {
      const res = await api.post('/tenders/sync', { portals: activePortals });
      console.log('[Tender Sync API] Task initiated:', res.data);

      setScanProgress(40);
      setScanStatusText('Tender sync task initiated on server. Ingesting data...');

      let isCompleted = false;
      let attempts = 0;
      const maxAttempts = 30; // Max 45 seconds (30 * 1.5s)

      while (!isCompleted && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500));
        attempts++;

        try {
          const statusRes = await api.get('/tenders/sync/status');
          const statusData = statusRes.data;
          console.log('[Tender Sync Status Poll]:', statusData);
          if (statusData.status === 'completed') {
            isCompleted = true;
            break;
          } else if (statusData.status === 'failed') {
            throw new Error(statusData.error || 'Sync task failed on backend.');
          } else {
            // Running or pending, update progress dynamically
            const pct = Math.min(95, 40 + Math.round((attempts / maxAttempts) * 50));
            setScanProgress(pct);
            setScanStatusText('Scraping active tenders, parsing SOW documents & scoring intent...');
          }
        } catch (pollErr) {
          console.warn('[Tender Sync Poll Error]:', pollErr);
        }
      }

      setScanProgress(100);
      
      // Reload leads and searches
      const resLeads = await api.get('/leads');
      if (resLeads.data && resLeads.data.leads) setLeads(resLeads.data.leads);
      const resSearches = await api.get('/searches');
      if (resSearches.data && resSearches.data.searches) setSearches(resSearches.data.searches);

      setTimeout(() => {
        setIsScanning(false);
        setScanProgress(0);
        if (onSwitchTab) {
          onSwitchTab('dashboard');
        }
      }, 500);
    } catch (err) {
      console.error('[Tender Sync API Error]:', err);
      setIsScanning(false);
      setScanProgress(0);
      if (onSwitchTab) {
        onSwitchTab('dashboard');
      }
    }
  };

  // Form inputs state
  const [platform, setPlatform] = useState('google_maps');
  const [keyword, setKeyword] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [timeframe, setTimeframe] = useState('qdr:m3');
  const [limit, setLimit] = useState(10);
  const [isOpenLimitDropdown, setIsOpenLimitDropdown] = useState(false);
  const [matchType, setMatchType] = useState('partial');
  const [minIntentScore, setMinIntentScore] = useState(40);
  const [searchType, setSearchType] = useState('sales');

  // Scanner status state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('Starting search...');

  // Reset wizard
  const resetWizard = () => {
    setGoalMode('social');
    setStep(1);
    setKeyword('');
    setIndustry('');
    setLocation('');
    setTimeframe('qdr:m3');
    setLimit(10);
    setMatchType('partial');
    setMinIntentScore(40);
    setSearchType('sales');
    setIsScanning(false);
    setScanProgress(0);
  };



  // Handle mode select
  const selectMode = (mode) => {
    setGoalMode(mode);
    setStep(1);
  };

  const handleNext = (e) => {
    if (e) e.preventDefault();
    if (step === 2 && !keyword.trim()) {
      showAlert('Please enter a search intent keyword.', 'Missing Keyword', 'warning');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Launch AI Scraper
  const handleLaunch = async (e) => {
    e.preventDefault();
    setIsScanning(true);
    setScanProgress(5);
    setScanStatusText(`Connecting to ${platform.toUpperCase()} api gateways...`);

    // Progress simulation
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) return prev;
        const add = Math.floor(Math.random() * 8) + 2;
        const next = prev + add;
        if (next > 30 && next < 60) {
          setScanStatusText('Analyzing post relevance with Llama-3.3 Agent...');
        } else if (next >= 60) {
          setScanStatusText('Extracting details and scoring lead quality...');
        }
        return next;
      });
    }, 1200);

    try {
      const response = await api.post('/search', {
        keyword,
        timeframe,
        limit: parseInt(limit),
        platform,
        match_type: matchType,
        location,
        industry,
        search_type: searchType,
      });

      const initData = response.data;
      const taskId = initData.task_id;
      
      if (!taskId) {
        throw new Error("No task ID returned from server.");
      }

      let isDone = false;
      let taskData = null;

      while (!isDone) {
        // Wait 3 seconds between status checks
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        const statusResponse = await api.get(`/search/status/${taskId}`);
        taskData = statusResponse.data;
        
        if (taskData.status === 'completed') {
          isDone = true;
        } else if (taskData.status === 'failed') {
          throw new Error(taskData.error || 'Scraper task failed.');
        }
      }

      clearInterval(progressInterval);
      setScanProgress(100);
      setScanStatusText('Parsing and mapping leads database successfully!');

      // Reload leads and searches
      const resLeads = await api.get('/leads');
      if (resLeads.data && resLeads.data.leads) setLeads(resLeads.data.leads);
      const resSearches = await api.get('/searches');
      if (resSearches.data && resSearches.data.searches) setSearches(resSearches.data.searches);

      setTimeout(() => {
        resetWizard();
        onSwitchTab('dashboard');
      }, 800);
    } catch (err) {
      clearInterval(progressInterval);
      setIsScanning(false);
      const errMsg = err.response?.data?.detail || err.message || String(err);
      showAlert(errMsg, 'Lead Scraper Error');
    }
  };

  // Estimation metrics
  const estimateMin = Math.max(1, Math.round(30 - minIntentScore / 3));
  const estimateMax = Math.max(2, Math.round(55 - minIntentScore / 2.2));

  return (
    <div id="view-discovery" className="tab-view active" style={{ padding: '1rem' }}>
      <div className="discovery-wizard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="view-header" style={{ marginBottom: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Guided AI scraper targeting buying signals across LinkedIn, Facebook, Google Maps, and other directories.</p>
        </div>

        {isScanning ? (
          /* Scanning Loader Progress Panel */
          <div id="loading-state" className="loading-container loading-state-panel" style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
            <div className="card loading-state-card" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem' }}>
              <div className="pulsing-ai-indicator loading-ai-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <div className="pulsing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite' }}></div>
                <span style={{ fontWeight: 'bold' }}>MapFlow AI scraper engaged...</span>
              </div>
              <div id="loading-status-text" className="loading-text loading-status-text" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                {scanStatusText}
              </div>
              <div className="loading-bar-container" style={{ width: '100%', height: '6px', background: 'var(--bg-trans-5)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  id="loading-progress"
                  className="loading-bar-progress"
                  style={{ width: `${scanProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }}
                ></div>
              </div>
            </div>
          </div>
        ) : !goalMode ? (
          /* Goal/Mode Selection Landing Panel */
          <div className="discovery-modes-panel" id="discovery-modes-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="modes-heading">
              <h3>Choose Discovery Goal</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Select how you want to search and qualify new targets today.</p>
            </div>
            <div className="modes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', width: '100%' }}>
              <div className="mode-card" style={{ cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} onClick={() => selectMode('social')}>
                <div className="mode-icon-wrapper" style={{ color: 'var(--primary)' }}>
                  <Users size={28} />
                </div>
                <h4 className="mode-title">Social Intent Scans</h4>
                <p className="mode-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexGrow: 1 }}>
                  Scan networks like LinkedIn, Facebook, Google Maps, and Twitter to find companies posting about hiring or service needs.
                </p>
                <button type="button" className="btn btn-secondary mode-btn" style={{ alignSelf: 'flex-start' }}>
                  Start Social Scan
                </button>
              </div>

              <div className="mode-card" style={{ cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} onClick={() => selectMode('project')}>
                <div className="mode-icon-wrapper" style={{ color: 'var(--primary)' }}>
                  <Database size={28} />
                </div>
                <h4 className="mode-title">Direct Client Briefs</h4>
                <p className="mode-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexGrow: 1 }}>
                  Search specialized remote portals and project bidding sites (Reddit, WeWorkRemotely, Freelancer) for direct client requirements.
                </p>
                <button type="button" className="btn btn-secondary mode-btn" style={{ alignSelf: 'flex-start' }}>
                  Find Project Briefs
                </button>
              </div>

              {/* Card 3: Government Tender Scans */}
              <div className="mode-card" style={{ cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} onClick={() => selectMode('tenders')}>
                <div className="mode-icon-wrapper" style={{ color: 'var(--primary)' }}>
                  <FileText size={28} />
                </div>
                <h4 className="mode-title">Government Tender Scans</h4>
                <p className="mode-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexGrow: 1 }}>
                  Collect newly published government tenders across CPPP, GeM, and State E-Procurement portals for AI tech parsing.
                </p>
                <button type="button" className="btn btn-secondary mode-btn" style={{ alignSelf: 'flex-start' }}>
                  Start Tender Scan
                </button>
              </div>
            </div>
          </div>
        ) : goalMode === 'tenders' ? (
          /* Government Tender Portal Sync Wizard View */
          <div className="discovery-wizard-card" style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
            <div className="discovery-wizard-panel" style={{ display: 'block' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem' }}
                  onClick={handleBack}
                >
                  <ArrowLeft size={14} /> Back to Goal Selection
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(14, 165, 164, 0.12)', border: '1px solid rgba(14, 165, 164, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={26} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Government Tender Portal Sync
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '0.9rem', margin: 0 }}>
                    Select public procurement portals to scrape active tenders, parse Scope of Work, and rank leads with AI.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem', alignItems: 'start' }}>
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={18} color="var(--primary)" />
                    Select Portals to Crawl & Sync:
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {[
                      { key: 'cppp', label: 'CPPP (Central Public Procurement)', tag: 'Central Govt', desc: 'Central Ministries, Railways, Defense & Public Utilities' },
                      { key: 'gem', label: 'GeM (Government e-Marketplace)', tag: 'National e-Market', desc: 'Official Indian government IT services & procurement portal' },
                      { key: 'tamil_nadu', label: 'Tamil Nadu eProcurement', tag: 'TN State', desc: 'State Government procurement and Smart City tenders' },
                      { key: 'karnataka', label: 'Karnataka eProcurement', tag: 'KA State', desc: 'State Universities, City Corporations & Engineering departments' },
                      { key: 'maharashtra', label: 'Maharashtra eTender', tag: 'MH State', desc: 'Public Utilities, Municipalities & IT Infrastructure bids' }
                    ].map((portal) => {
                      const isSelected = selectedPortals[portal.key];
                      return (
                        <div
                          key={portal.key}
                          onClick={() => togglePortal(portal.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem 1.25rem',
                            borderRadius: '12px',
                            background: isSelected ? 'var(--bg-trans-5)' : 'var(--bg-card)',
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePortal(portal.key)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{portal.label}</strong>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                {portal.tag}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                              {portal.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} color="var(--primary)" />
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      AI Sync Pipeline Summary
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span>
                      <span><strong>Playwright Scraper:</strong> Crawls active procurement listings automatically.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span>
                      <span><strong>AI PDF Parser:</strong> Extracts Scope of Work (SOW), Tech Stack & Contact Info.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span>
                      <span><strong>Lead Score Ranking:</strong> Ranks high-intent leads (0 to 100).</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleStartTenderSync}
                      disabled={!Object.values(selectedPortals).some(Boolean)}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1.25rem',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.6rem',
                        borderRadius: '10px',
                        cursor: !Object.values(selectedPortals).some(Boolean) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <RefreshCw size={18} />
                      <span>Start Tender Sync</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleBack}
                      style={{ width: '100%', marginTop: '0.75rem', padding: '0.6rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Discovery Wizard Form Panel */
          <div className="discovery-wizard-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
            <div className="discovery-wizard-panel" id="discovery-wizard-panel" style={{ display: 'block' }}>
              {step > 1 && (
                <div className="wizard-header-actions" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    id="btn-wizard-back"
                    className="btn-text-back btn-wizard-back"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    onClick={handleBack}
                  >
                    <ArrowLeft size={14} /> Back to Step {step - 1}
                  </button>
                </div>
              )}

              {/* Stepper Node header indicators */}
              <div className="stepper-header" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '1.25rem', padding: '0 1rem' }}>
                <div className="stepper-line" style={{ position: 'absolute', top: '18px', left: '2rem', right: '2rem', height: '2px', background: 'var(--border-color)', zIndex: 1 }}>
                  <div
                    className="stepper-progress-fill"
                    id="wizard-progress-fill"
                    style={{ width: `${((step - 1) / 2) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }}
                  ></div>
                </div>
                {[
                  { label: 'Audience', icon: <Users size={14} />, s: 1 },
                  { label: 'Filters', icon: <Sliders size={14} />, s: 2 },
                  { label: 'Qualify', icon: <Sparkles size={14} />, s: 3 }
                ].map((node) => (
                  <div key={node.s} className={`stepper-node ${step >= node.s ? 'active' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2, cursor: 'pointer' }} onClick={() => step >= node.s && setStep(node.s)}>
                    <div className="stepper-circle" style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: step >= node.s ? 'var(--primary)' : 'var(--bg-card)',
                      border: `2px solid ${step >= node.s ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: step >= node.s ? '#fff' : 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {node.icon}
                    </div>
                    <span className="stepper-label" style={{ fontSize: '0.72rem', fontWeight: 600, color: step >= node.s ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{node.label}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={step === 3 ? handleLaunch : handleNext} id="search-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Step 1: Define Audience */}
                {step === 1 && (
                  <div className="wizard-step-panel active" data-step="1" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="step-heading">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} color="var(--primary)" />
                        Define Target Audience
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Specify the search keywords and industry context for our Llama-3.3 AI scanner.</p>
                    </div>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label htmlFor="keyword" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Search Intent Query / Keyword</label>
                      <div className="input-wrapper" style={{ position: 'relative' }}>
                        <Map className="input-icon" size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-secondary)' }} />
                        <input
                          type="text"
                          id="keyword"
                          className="form-control"
                          placeholder="e.g. logo designers, software companies, restaurants"
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px 8px 30px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                          required
                        />
                      </div>
                      <span className="wizard-help-text" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Llama-3.3 will auto-expand this query to match varied social phrasing.</span>
                    </div>

                    <div className="wizard-grid-2" style={{ display: 'grid', gridTemplateColumns: platform === 'google_maps' ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                      {platform !== 'google_maps' && (
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label htmlFor="wizard-industry" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Target Industry (Optional)</label>
                          <div className="input-wrapper" style={{ position: 'relative' }}>
                            <Building className="input-icon" size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-secondary)' }} />
                            <input
                              type="text"
                              id="wizard-industry"
                              className="form-control"
                              placeholder="e.g. E-commerce, FinTech"
                              value={industry}
                              onChange={(e) => setIndustry(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px 8px 30px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="wizard-location" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Target Location (Optional)</label>
                        <div className="input-wrapper" style={{ position: 'relative' }}>
                          <MapPin className="input-icon" size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-secondary)' }} />
                          <input
                            type="text"
                            id="wizard-location"
                            className="form-control"
                            placeholder="e.g. United States, London"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px 8px 30px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Configure Filters */}
                {step === 2 && (
                  <div className="wizard-step-panel active" data-step="2" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="step-heading">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sliders size={18} color="var(--primary)" />
                        Configure Filters & Thresholds
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tune recency limits, search strictness, and the maximum results to crawl.</p>
                    </div>
                    <div className="wizard-grid-3" style={{ display: 'grid', gridTemplateColumns: platform === 'google_maps' ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                      {platform !== 'google_maps' && (
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label htmlFor="timeframe" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Post Recency</label>
                          <div className="input-wrapper" style={{ position: 'relative' }}>
                            <Calendar className="input-icon" size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-secondary)' }} />
                            <select
                              id="timeframe"
                              className="form-control"
                              value={timeframe}
                              onChange={(e) => setTimeframe(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px 8px 30px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                            >
                              <option value="qdr:d">Past 24 Hours</option>
                              <option value="qdr:w">Past Week</option>
                              <option value="qdr:m">Past Month</option>
                              <option value="qdr:m2">Past 2 Months</option>
                              <option value="qdr:m3">Past 3 Months</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Maximum Records Scanned</label>
                        <div className="input-wrapper" style={{ position: 'relative' }}>
                          <Hash className="input-icon" size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-secondary)', zIndex: 10 }} />
                          
                          <div className="custom-select-wrapper" style={{ position: 'relative', width: '100%' }}>
                            {/* Trigger Button */}
                            <div
                              onClick={() => setIsOpenLimitDropdown(!isOpenLimitDropdown)}
                              className="form-control"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                padding: '8px 12px 8px 30px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem',
                                minHeight: '38px',
                                userSelect: 'none'
                              }}
                            >
                              <span>
                                {limit === 5 ? '5 Results' :
                                 limit === 10 ? '10 Results (Quick)' :
                                 limit === 20 ? '20 Results (Standard)' :
                                 limit === 50 ? '50 Results (Deep)' :
                                 '100 Results (Thorough)'}
                              </span>
                              <span style={{ 
                                fontSize: '0.65rem', 
                                color: 'var(--text-secondary)', 
                                transition: 'transform 0.2s', 
                                transform: isOpenLimitDropdown ? 'rotate(180deg)' : 'rotate(0deg)' 
                              }}>
                                ▼
                              </span>
                            </div>

                            {/* Dropdown Options List */}
                            {isOpenLimitDropdown && (
                              <>
                                {/* Overlay backdrop to close dropdown on outer click */}
                                <div
                                  onClick={() => setIsOpenLimitDropdown(false)}
                                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 4px)',
                                    left: 0,
                                    right: 0,
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    boxShadow: 'var(--shadow-lg)',
                                    zIndex: 999,
                                    overflow: 'hidden',
                                    padding: '4px 0'
                                  }}
                                >
                                  {[
                                    { value: 5, label: '5 Results' },
                                    { value: 10, label: '10 Results (Quick)' },
                                    { value: 20, label: '20 Results (Standard)' },
                                    { value: 50, label: '50 Results (Deep)' },
                                    { value: 100, label: '100 Results (Thorough)' }
                                  ].map((opt) => {
                                    const isSelected = opt.value === limit;
                                    return (
                                      <div
                                        key={opt.value}
                                        onClick={() => {
                                          setLimit(opt.value);
                                          setIsOpenLimitDropdown(false);
                                        }}
                                        className="custom-select-option"
                                        style={{
                                          padding: '8px 16px',
                                          fontSize: '0.85rem',
                                          color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                                          background: isSelected ? 'var(--bg-trans-5)' : 'transparent',
                                          cursor: 'pointer',
                                          transition: 'all 0.15s ease',
                                          fontWeight: isSelected ? 600 : 400
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = 'var(--bg-hover)';
                                          e.currentTarget.style.color = 'var(--primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = isSelected ? 'var(--bg-trans-5)' : 'transparent';
                                          e.currentTarget.style.color = isSelected ? 'var(--primary)' : 'var(--text-primary)';
                                        }}
                                      >
                                        {opt.label}
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {platform !== 'google_maps' && (
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label htmlFor="match-type" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Search Match Type</label>
                          <div className="input-wrapper" style={{ position: 'relative' }}>
                            <Sliders className="input-icon" size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-secondary)' }} />
                            <select
                              id="match-type"
                              className="form-control"
                              value={matchType}
                              onChange={(e) => setMatchType(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px 8px 30px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                            >
                              <option value="partial">Partial Match (Broader)</option>
                              <option value="exact">Exact Match (Strict)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: AI Qualification & Estimate */}
                {step === 3 && (
                  <div className="wizard-step-panel active" data-step="3" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="step-heading">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} color="var(--primary)" />
                        Review & Launch Scraper
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Verify the configuration summary below before deploying the automated search.</p>
                    </div>

                    <div className="review-summary-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span className="summary-label" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={14} /> Target Audience
                        </span>
                        <strong className="summary-value" style={{ color: 'var(--text-primary)' }}>
                          {keyword} {industry ? `(${industry})` : ''} {location ? `in ${location}` : ''}
                        </strong>
                      </div>
                      <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span className="summary-label" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Database size={14} /> Platform Source
                        </span>
                        <strong className="summary-value" style={{ color: 'var(--text-primary)' }}>
                          {platform.toUpperCase()}
                        </strong>
                      </div>
                      <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span className="summary-label" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={14} /> Recency / Limits
                        </span>
                        <strong className="summary-value" style={{ color: 'var(--text-primary)' }}>
                          {platform === 'google_maps' ? `${limit} leads max` : `${timeframe === 'qdr:d' ? 'Past Day' : timeframe === 'qdr:w' ? 'Past Week' : 'Past 1-3 Months'} (${limit} leads max)`}
                        </strong>
                      </div>
                    </div>

                    <div className="estimate-leads-panel" style={{ background: 'rgba(14, 165, 164, 0.05)', border: '1px solid rgba(14, 165, 164, 0.15)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
                      <div className="estimate-count" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {estimateMin} - {estimateMax}
                      </div>
                      <div className="estimate-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>Estimated qualified lead targets</div>
                      <span className="estimate-help-text" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>Based on your filter metrics, matching history, and domain indexes.</span>
                    </div>
                  </div>
                )}

                <div className="form-actions-row wizard-actions-row" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  {step < 3 ? (
                    <button
                      type="button"
                      id="btn-wizard-continue"
                      className="btn btn-primary"
                      onClick={handleNext}
                      style={{ flexGrow: 1, justifyContent: 'center' }}
                    >
                      Continue
                    </button>
                  ) : (
                    <button type="submit" id="btn-search" className="btn btn-primary btn-wizard-submit" style={{ flexGrow: 1, justifyContent: 'center' }}>
                      <Sparkles size={14} style={{ marginRight: '6px' }} /> Launch AI scan
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modern UI Popup Modal - Portaled to document.body for 100% Dead Center Alignment */}
      {alertModal.show && createPortal(
        <div className="global-modal-overlay">
          <div className="modern-alert-card">
            <button
              type="button"
              className="modal-close-btn"
              onClick={closeAlert}
              title="Close dialog"
            >
              <X size={14} />
            </button>

            {/* Icon Aura */}
            <div className={`alert-icon-aura ${alertModal.isCreditError ? 'credit-aura' : 'error-aura'}`}>
              {alertModal.isCreditError ? <CreditCard size={30} /> : <AlertTriangle size={30} />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              <h3 className="alert-title">
                {alertModal.title}
              </h3>
              <p className="alert-message">
                {alertModal.message}
              </p>
            </div>

            <div className="alert-actions-row">
              {alertModal.isCreditError ? (
                <>
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={closeAlert}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-modal-primary"
                    onClick={() => {
                      closeAlert();
                      if (onSwitchTab) onSwitchTab('profile-subscription');
                    }}
                  >
                    <CreditCard size={14} />
                    <span>Upgrade Plan</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-modal-primary"
                  onClick={closeAlert}
                  style={{ width: '100%' }}
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
