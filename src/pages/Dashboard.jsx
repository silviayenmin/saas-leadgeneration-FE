import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronLeft,
  ArrowRight,
  Radar,
  MapPin,
  X
} from 'lucide-react';
import {
  getLeadPlatform,
  getPlatformIcon,
  getLeadAvatarUrl,
  getCompanyLogoUrl,
  getStatusBadgeClass,
  getIntentBadgeClass,
  getCrmBadgeClass,
  parseIsoDate,
  getLeadScoreVal
} from '../utils/helpers';
import './Pages.scss';

function ModernFilterSelect({ value, options, onChange, minWidth = '145px' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || { label: value, value };

  return (
    <div ref={dropdownRef} className={`modern-custom-select filter-select ${isOpen ? 'open' : ''}`} style={{ minWidth }}>
      <button
        type="button"
        className="modern-select-trigger filter-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="modern-select-label">{selectedOption.label || value}</span>
        <ChevronDown size={13} className={`caret-icon ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="modern-select-dropdown filter-dropdown">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`modern-select-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span>{opt.label || opt.value}</span>
              {value === opt.value && <span className="check-dot"></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ leads = [], searches = [], onOpenLead, onSwitchTab, onUpgradeClick }) {
  // Filters state
  const [activeSubTab, setActiveSubTab] = useState('maps'); // Default to 'maps'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'sales', 'recruiter'
  const [filterIntent, setFilterIntent] = useState('all');
  const [filterCrm, setFilterCrm] = useState('all');
  
  // Pagination state (5 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Date Picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState('');

  const formatDateForInput = (d) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDatePreset = (presetType) => {
    const now = new Date();
    setActivePreset(presetType === 'clear' ? '' : presetType);
    if (presetType === 'today') {
      const dStr = formatDateForInput(now);
      setStartDate(dStr);
      setEndDate(dStr);
    } else if (presetType === 'last7') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      setStartDate(formatDateForInput(start));
      setEndDate(formatDateForInput(now));
    } else if (presetType === 'last30') {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      setStartDate(formatDateForInput(start));
      setEndDate(formatDateForInput(now));
    } else if (presetType === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDateForInput(start));
      setEndDate(formatDateForInput(now));
    } else if (presetType === 'clear') {
      setStartDate('');
      setEndDate('');
    }
  };

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

        if (filterIntent !== 'all') {
          const score = getLeadScoreVal(lead);
          if (filterIntent === 'Qualified') {
            if (score <= 75) return false;
          } else if (filterIntent === 'Potential Lead') {
            if (score < 40 || score > 75) return false;
          } else if (filterIntent === 'Warm Lead') {
            if (score >= 40) return false;
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

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPlatform, filterMode, filterIntent, filterCrm, startDate, endDate, activeSubTab]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / itemsPerPage));

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage, itemsPerPage]);

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
            {/* Filter Tabs - Maps Scans Only + View More Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveSubTab('maps')}
                  style={{
                    padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--primary)',
                    color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <MapPin size={15} />
                  <span>Maps Scans</span>
                </button>
              </div>

              <button
                type="button"
                className="btn btn-glow-outline"
                onClick={() => onSwitchTab && onSwitchTab('maps-scans')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <span>View More</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Toolbar Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="modern-search-input-wrapper" style={{ flexGrow: 1, minWidth: '180px' }}>
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  className="modern-search-input"
                  placeholder="Search name or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <ModernFilterSelect
                value={filterPlatform}
                onChange={setFilterPlatform}
                minWidth="115px"
                options={[
                  { value: 'all', label: 'All Sources' },
                  { value: 'linkedin', label: 'LinkedIn' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'twitter', label: 'Twitter / X' },
                  { value: 'reddit', label: 'Reddit' },
                  { value: 'google_maps', label: 'Google Maps' },
                  { value: 'weworkremotely', label: 'WeWork' },
                  { value: 'freelancer', label: 'Freelancer' },
                  { value: 'upwork', label: 'Upwork' }
                ]}
              />

              <ModernFilterSelect
                value={filterMode}
                onChange={setFilterMode}
                minWidth="105px"
                options={[
                  { value: 'all', label: 'All Modes' },
                  { value: 'sales', label: 'Sales Leads Only' },
                  { value: 'recruiter', label: 'Candidates Only' }
                ]}
              />

              <ModernFilterSelect
                value={filterIntent}
                onChange={setFilterIntent}
                options={[
                  { value: 'all', label: 'All Intent Scores' },
                  { value: 'Qualified', label: 'Qualified' },
                  { value: 'Potential Lead', label: 'Potential Lead' },
                  { value: 'Warm Lead', label: 'Warm Lead' }
                ]}
              />

              <ModernFilterSelect
                value={filterCrm}
                onChange={setFilterCrm}
                minWidth="120px"
                options={[
                  { value: 'all', label: 'All CRM Stages' },
                  { value: 'New', label: 'New' },
                  { value: 'Drafted', label: 'Drafted' },
                  { value: 'Emailed', label: 'Emailed' },
                  { value: 'Replied', label: 'Replied' },
                  { value: 'Disqualified', label: 'Disqualified' }
                ]}
              />

              {/* Date Filter */}
              {/* Date Picker Trigger & Popover */}
              <div className={`date-picker-wrapper ${showDatePicker ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className={`btn-date-trigger ${(startDate || endDate) ? 'active' : ''}`}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <Calendar size={14} />
                  <span>
                    {startDate || endDate
                      ? `${startDate || '...'} to ${endDate || '...'}`
                      : 'Date Range'}
                  </span>
                </button>

                {showDatePicker && (
                  <div className="date-popover">
                    <div className="popover-header">
                      <div className="popover-title">
                        <Calendar size={14} className="title-icon" />
                        <span>Filter Date Range</span>
                      </div>
                      {(startDate || endDate) && (
                        <button
                          type="button"
                          className="btn-clear-date"
                          onClick={() => handleDatePreset('clear')}
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {/* Quick Presets Chips */}
                    <div className="quick-presets-row">
                      <button
                        type="button"
                        className={`preset-chip ${activePreset === 'today' ? 'active' : ''}`}
                        onClick={() => handleDatePreset('today')}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        className={`preset-chip ${activePreset === 'last7' ? 'active' : ''}`}
                        onClick={() => handleDatePreset('last7')}
                      >
                        7 Days
                      </button>
                      <button
                        type="button"
                        className={`preset-chip ${activePreset === 'last30' ? 'active' : ''}`}
                        onClick={() => handleDatePreset('last30')}
                      >
                        30 Days
                      </button>
                      <button
                        type="button"
                        className={`preset-chip ${activePreset === 'thisMonth' ? 'active' : ''}`}
                        onClick={() => handleDatePreset('thisMonth')}
                      >
                        This Month
                      </button>
                    </div>

                    {/* Custom Date Inputs Container */}
                    <div className="date-inputs-grid">
                      <div className="date-input-group">
                        <label>Start Date</label>
                        <div className="input-with-icon">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                              setStartDate(e.target.value);
                              setActivePreset('');
                            }}
                          />
                        </div>
                      </div>
                      <div className="date-input-group">
                        <label>End Date</label>
                        <div className="input-with-icon">
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                              setEndDate(e.target.value);
                              setActivePreset('');
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Popover Footer Actions */}
                    <div className="popover-footer">
                      <button
                        type="button"
                        className="btn-apply-date"
                        onClick={() => setShowDatePicker(false)}
                      >
                        Apply Range
                      </button>
                    </div>
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
              <>
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
                    {paginatedLeads.map((lead, idx) => {
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

              {/* Modern Pagination Bar (Full Card Width Alignment) */}
              <div className="modern-pagination-bar" style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                paddingTop: '1rem',
                marginTop: '1.25rem',
                borderTop: '1px solid var(--border-color)',
                flexWrap: 'wrap',
                gap: '1rem',
                width: '100%'
              }}>
                {/* Left: Info Chip */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.45rem 0.95rem',
                  background: 'var(--bg-trans-2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></span>
                  <span>Showing <strong style={{ color: 'var(--text-primary)' }}>{Math.min((currentPage - 1) * itemsPerPage + 1, filteredLeads.length)}</strong>–<strong style={{ color: 'var(--text-primary)' }}>{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{filteredLeads.length}</strong> Maps Scans</span>
                </div>

                {/* Right: Page Controls Group (Pushed to Far Right Edge) */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  background: 'var(--bg-trans-2)',
                  border: '1px solid var(--border-color)',
                  padding: '0.25rem',
                  borderRadius: '8px',
                  marginLeft: 'auto'
                }}>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '0.35rem 0.65rem',
                      height: '32px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      opacity: currentPage === 1 ? 0.4 : 1,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: 'none',
                        background: pageNum === currentPage ? 'var(--primary)' : 'transparent',
                        color: pageNum === currentPage ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        boxShadow: pageNum === currentPage ? '0 3px 10px var(--primary-glow)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '0.35rem 0.65rem',
                      height: '32px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      opacity: currentPage === totalPages ? 0.4 : 1,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
