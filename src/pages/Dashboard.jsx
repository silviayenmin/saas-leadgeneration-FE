import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Send,
  Percent,
  Sparkles,
  TrendingUp,
  FolderOpen,
  Search,
  Calendar,
  ChevronDown,
  ExternalLink,
  ChevronRight,
  Radar
} from 'lucide-react';
import {
  getLeadPlatform,
  getPlatformIcon,
  getLeadAvatarUrl,
  getCompanyLogoUrl,
  getStatusBadgeClass,
  getIntentBadgeClass,
  getCrmBadgeClass,
  parseIsoDate
} from '../utils/helpers';
import './Pages.scss';

export default function Dashboard({ leads = [], searches = [], onOpenLead, onSwitchTab, onUpgradeClick }) {
  // Filters state
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all', 'maps', 'social', 'project'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'sales', 'recruiter'
  const [filterIntent, setFilterIntent] = useState('all');
  const [filterCrm, setFilterCrm] = useState('all');
  
  // Date Picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // AI Recommended leads
  const recommendedLeads = useMemo(() => {
    return leads
      .filter((l) => ['new', 'new discovery', ''].includes((l.crmStatus || 'New').toLowerCase()))
      .slice(0, 3);
  }, [leads]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((l) => {
      const category = l.leadCategory || '';
      if (category) {
        return category === 'High Intent' || category === 'Medium Intent';
      }
      const status = (l.leadStatus || '').toLowerCase();
      return status.includes('qualif') || status.includes('warm') || status.includes('prospect');
    }).length;

    const activeOutreach = leads.filter((l) => {
      const stage = (l.crmStatus || '').toLowerCase();
      return stage === 'drafted' || stage === 'emailed' || stage === 'replied';
    }).length;

    let totalScore = 0;
    let scoreCount = 0;
    leads.forEach((l) => {
      let score = l.leadScore;
      if (score === undefined || score === null) {
        score = parseFloat(l.confidenceScore);
        if (!isNaN(score)) {
          if (score <= 1.0) score = score * 100;
        }
      }
      if (score !== undefined && score !== null && !isNaN(score)) {
        totalScore += score;
        scoreCount++;
      }
    });

    const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

    return { total, qualified, activeOutreach, avgScore };
  }, [leads]);

  // Funnel calculations
  const funnel = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((l) => {
      const category = l.leadCategory || '';
      return category === 'High Intent' || category === 'Medium Intent';
    }).length;
    const outreach = leads.filter((l) => {
      const stage = (l.crmStatus || '').toLowerCase();
      return ['drafted', 'emailed', 'replied'].includes(stage);
    }).length;
    const replied = leads.filter((l) => (l.crmStatus || '').toLowerCase() === 'replied').length;

    const qualifiedPct = total > 0 ? Math.round((qualified / total) * 100) : 0;
    const outreachPct = total > 0 ? Math.round((outreach / total) * 100) : 0;
    const repliedPct = total > 0 ? Math.round((replied / total) * 100) : 0;

    return { total, qualified, outreach, replied, qualifiedPct, outreachPct, repliedPct };
  }, [leads]);

  // Handle date range matching
  const matchDate = (createdAtStr) => {
    if (!startDate && !endDate) return true;
    const date = parseIsoDate(createdAtStr);
    if (isNaN(date.getTime())) return true;

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (date < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (date > end) return false;
    }
    return true;
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const platform = getLeadPlatform(lead);
        if (activeSubTab === 'social') {
          if (!['linkedin', 'facebook', 'twitter'].includes(platform)) return false;
        } else if (activeSubTab === 'maps') {
          if (platform !== 'google_maps') return false;
        } else if (activeSubTab === 'project') {
          if (!['reddit', 'weworkremotely', 'freelancer', 'upwork'].includes(platform)) return false;
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const author = (lead.authorName || '').toLowerCase();
          const company = (lead.companyName || '').toLowerCase();
          if (!author.includes(query) && !company.includes(query)) return false;
        }

        if (filterPlatform !== 'all' && platform !== filterPlatform) return false;

        const searchType = (lead.search_type || 'sales').toLowerCase();
        if (filterMode !== 'all' && searchType !== filterMode) return false;

        const leadStatus = (lead.leadStatus || '').toLowerCase();
        if (filterIntent !== 'all') {
          if (filterIntent === 'Qualified') {
            if (!leadStatus.includes('qualif') && !leadStatus.includes('new lead') && !leadStatus.includes('new')) return false;
          } else if (filterIntent === 'Unqualified') {
            if (!leadStatus.includes('unqualified') && !leadStatus.includes('not qualified') && !leadStatus.includes('disqualified')) return false;
          } else if (filterIntent === 'Warm Lead') {
            if (!leadStatus.includes('warm')) return false;
          } else if (filterIntent === 'Potential Lead') {
            if (!leadStatus.includes('potential') && !leadStatus.includes('cold')) return false;
          } else if (filterIntent === 'Not a Lead') {
            if (!leadStatus.includes('not a lead') && !leadStatus.includes('not lead')) return false;
          } else if (filterIntent === 'Informational') {
            if (!leadStatus.includes('info')) return false;
          } else {
            if (!leadStatus.includes(filterIntent.toLowerCase())) return false;
          }
        }

        const crmStage = (lead.crmStatus || 'New').toLowerCase();
        if (filterCrm !== 'all' && crmStage !== filterCrm.toLowerCase()) return false;

        if (!matchDate(lead.createdAt)) return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [leads, activeSubTab, searchQuery, filterPlatform, filterMode, filterIntent, filterCrm, startDate, endDate]);

  const topLeads = useMemo(() => {
    return filteredLeads.slice(0, 10);
  }, [filteredLeads]);

  const clearDateFilter = (e) => {
    e.stopPropagation();
    setStartDate('');
    setEndDate('');
    setShowDatePicker(false);
  };

  return (
    <div className="page-container animate-fade-in" style={{ padding: '1rem', gap: '1rem' }}>
      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><Users size={22} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-label">Total Leads</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><UserCheck size={22} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{stats.qualified}</div>
            <div className="kpi-label">Qualified Prospect Leads</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Send size={22} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{stats.activeOutreach}</div>
            <div className="kpi-label">Outreach Active</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Percent size={22} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{stats.avgScore}%</div>
            <div className="kpi-label">Avg Match Score</div>
          </div>
        </div>
      </div>

      {/* AI Insights banner */}
      <div className="data-card" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'var(--bg-trans-5)', border: '1px solid rgba(14,165,164,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Sparkles size={16} color="var(--primary)" />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong>MapFlow AI Insight:</strong> Intent analysis identified key local matches and project requirements. Average qualification match score is {stats.avgScore}% today.
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="data-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
          <Radar size={48} style={{ color: 'var(--primary)', marginBottom: '1.25rem', animation: 'pulse 2s infinite' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No leads discovered yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '400px', marginBottom: '1.5rem' }}>Deploy our guided AI scraper to target and score buying signals across networks and maps.</p>
          <button type="button" onClick={() => onSwitchTab('lead-discovery')} className="btn btn-primary">
            Start first scan
          </button>
        </div>
      ) : (
        <>
          {/* Funnel and Recommendations Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Funnel Widget */}
            <div className="data-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="var(--primary)" />
                <span>Outreach Funnel Stage</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Discovered</span>
                    <strong>{funnel.total}</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: 'var(--primary)' }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ready to Contact</span>
                    <strong>{funnel.qualified}</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${funnel.qualifiedPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #10B981)' }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Outreach Active</span>
                    <strong>{funnel.outreach}</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${funnel.outreachPct}%`, height: '100%', background: '#F59E0B' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Widget */}
            <div className="data-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--primary)" />
                <span>AI Recommended Lead Matches</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.50rem' }}>
                {recommendedLeads.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                    No pending matches. Perform scans to collect more records.
                  </div>
                ) : (
                  recommendedLeads.map((lead, idx) => {
                    let score = lead.leadScore;
                    if (score === undefined || score === null) {
                      score = parseFloat(lead.confidenceScore) || 0;
                      if (score <= 1.0 && score > 0) score = Math.round(score * 100);
                      if (score === 0) score = 40;
                    }
                    const isHigh = score >= 75;
                    return (
                      <div
                        key={lead.sourceUrl || idx}
                        onClick={() => onOpenLead(lead)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-main)',
                          border: '1px solid var(--border-color)', cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {lead.platform === 'google_maps' ? lead.companyName : lead.authorName}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {lead.companyName && lead.companyName !== 'Not Specified' ? lead.companyName : (lead.industry || 'Lead Match')}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '12px', background: isHigh ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: isHigh ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
                          {score}% Match
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Full Width Table Card */}
          <div className="data-card">
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', paddingBottom: '0.5rem' }}>
              {[
                { id: 'all', label: 'All Leads' },
                { id: 'maps', label: 'Maps Scans' },
                { id: 'social', label: 'Social Scans' },
                { id: 'project', label: 'Freelance / Projects' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveSubTab(t.id)}
                  style={{
                    padding: '8px 16px', borderRadius: '6px', border: 'none', background: activeSubTab === t.id ? 'var(--primary)' : 'transparent',
                    color: activeSubTab === t.id ? '#fff' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Toolbar Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flexGrow: 1, minWidth: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search name or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '6px 12px 6px 30px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                style={{ padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="all">All Sources</option>
                <option value="linkedin">LinkedIn</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter / X</option>
                <option value="reddit">Reddit</option>
                <option value="google_maps">Google Maps</option>
                <option value="weworkremotely">WeWork</option>
                <option value="freelancer">Freelancer</option>
                <option value="upwork">Upwork</option>
              </select>

              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                style={{ padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="all">All Modes</option>
                <option value="sales">Sales Leads Only</option>
                <option value="recruiter">Candidates Only</option>
              </select>

              <select
                value={filterIntent}
                onChange={(e) => setFilterIntent(e.target.value)}
                style={{ padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="all">All Intent Scores</option>
                <option value="Qualified">Qualified</option>
                <option value="Warm Lead">Warm Lead</option>
                <option value="Potential Lead">Potential Lead</option>
                <option value="Informational">Informational</option>
                <option value="Unqualified">Unqualified</option>
                <option value="Not a Lead">Not a Lead</option>
              </select>

              <select
                value={filterCrm}
                onChange={(e) => setFilterCrm(e.target.value)}
                style={{ padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="all">All CRM Stages</option>
                <option value="New">New</option>
                <option value="Drafted">Drafted</option>
                <option value="Emailed">Emailed</option>
                <option value="Replied">Replied</option>
                <option value="Disqualified">Disqualified</option>
              </select>

              {/* Date Filter */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <Calendar size={13} />
                  <span>{startDate || endDate ? `${startDate || 'Start'} to ${endDate || 'End'}` : 'Select Dates'}</span>
                  {(startDate || endDate) && <span style={{ marginLeft: '4px', cursor: 'pointer', color: 'var(--primary)' }} onClick={clearDateFilter}>✕</span>}
                </button>
                {showDatePicker && (
                  <div style={{ position: 'absolute', top: '35px', right: 0, zIndex: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', width: '220px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Start Date</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '4px 8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>End Date</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '4px 8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                    </div>
                    <button type="button" onClick={() => setShowDatePicker(false)} className="btn btn-primary" style={{ padding: '4px', fontSize: '0.75rem' }}>Apply</button>
                  </div>
                )}
              </div>
            </div>

            {/* Leads Table */}
            {filteredLeads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No leads matching filters. Try adjusting your filter parameters or search queries.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '20%' }}>Platform</th>
                      <th style={{ width: '35%' }}>Lead / Company</th>
                      <th style={{ width: '20%' }}>Match Score</th>
                      <th style={{ width: '20%' }}>Contact Info</th>
                      <th style={{ width: '5%' }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLeads.map((lead, idx) => {
                      const displayAuthor = lead.authorName || 'Unknown Poster';
                      const displayCompany = lead.companyName || 'No Company Details';
                      const displayRole = Array.isArray(lead.serviceRequired)
                        ? lead.serviceRequired.join(', ')
                        : lead.serviceRequired || lead.industry || 'Prospect Partner';

                      let score = lead.leadScore;
                      if (score === undefined || score === null) {
                        score = parseFloat(lead.confidenceScore) || 0;
                        if (score <= 1.0 && score > 0) score = Math.round(score * 100);
                        if (score === 0) score = 40;
                      }

                      let cleanIntent = lead.leadCategory || lead.buyingIntent || 'Low';
                      if (cleanIntent.toLowerCase().includes('high')) cleanIntent = 'High';
                      else if (cleanIntent.toLowerCase().includes('medium') || cleanIntent.toLowerCase().includes('warm')) cleanIntent = 'Medium';
                      else if (cleanIntent.toLowerCase().includes('low')) cleanIntent = 'Low';

                      const emailVal = lead.contactInfo || '';
                      const isEmailValid = emailVal && emailVal.includes('@') && emailVal !== 'hello@company.com';
                      const isEmailVerified = isEmailValid && lead.contactSource !== 'guessed';
                      const emailBadgeLabel = isEmailVerified ? '✓ Verified' : (lead.contactSource === 'guessed' ? '⚡ Guessed' : 'Unverified');
                      const emailBadgeClass = isEmailVerified ? 'intent-badge High' : (lead.contactSource === 'guessed' ? 'intent-badge Medium' : 'intent-badge Low');

                      const platform = getLeadPlatform(lead);

                      return (
                        <tr
                          key={lead.sourceUrl || idx}
                          style={{ cursor: 'pointer' }}
                          onClick={() => onOpenLead(lead)}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {getPlatformIcon(platform, 18)}
                              <span style={{ textTransform: 'capitalize' }}>{platform.replace('_', ' ')}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img 
                                src={lead.platform === 'google_maps' ? getCompanyLogoUrl(displayCompany) : getLeadAvatarUrl(displayAuthor)} 
                                alt="Avatar" 
                                style={{ width: '28px', height: '28px', borderRadius: '6px' }} 
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                  {lead.platform === 'google_maps' ? displayCompany : displayAuthor}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                  {lead.platform === 'google_maps' 
                                    ? (lead.industry || 'Business') 
                                    : `${displayRole}${lead.companyName && lead.companyName !== 'Not Specified' ? ` @ ${lead.companyName}` : ''}`}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 500 }}>
                                <span>{cleanIntent} Intent</span>
                                <span>{score}%</span>
                              </div>
                              <div style={{ width: '100%', height: '5px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${score}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }}></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {isEmailValid ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{emailVal}</span>
                                <span className={emailBadgeClass} style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', marginTop: '3px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>{emailBadgeLabel}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No email found</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <a href={lead.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }} title="View Source Post">
                                <ExternalLink size={13} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
