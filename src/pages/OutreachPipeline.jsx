import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Trash2,
  ExternalLink,
  Eye,
  MapPin,
  Phone,
  Star,
  Building,
  Briefcase,
  Layers,
  ChevronDown,
  X,
  Sparkles,
  UserCheck,
  Building2,
  Globe,
  Tag,
  Check
} from 'lucide-react';
import api from '../services/api';
import './OutreachPipeline.scss';

// Platform Brand SVG Icons / Badges (Icon-Only Mode)
const PlatformIcon = ({ platform }) => {
  const p = (platform || '').toLowerCase();
  if (p.includes('google')) {
    return (
      <span className="platform-badge-icon gmaps" title="Google Maps">
        <MapPin size={14} style={{ color: '#4285F4' }} />
      </span>
    );
  }
  if (p.includes('linkedin')) {
    return (
      <span className="platform-badge-icon linkedin" title="LinkedIn">
        <span style={{ color: '#0A66C2', fontWeight: 800, fontSize: '11px' }}>in</span>
      </span>
    );
  }
  if (p.includes('twitter') || p.includes('x')) {
    return (
      <span className="platform-badge-icon twitter" title="Twitter / X">
        <span style={{ color: '#1DA1F2', fontWeight: 800, fontSize: '11px' }}>𝕏</span>
      </span>
    );
  }
  if (p.includes('reddit')) {
    return (
      <span className="platform-badge-icon reddit" title="Reddit">
        <span style={{ color: '#FF4500', fontWeight: 800, fontSize: '11px' }}>r/</span>
      </span>
    );
  }
  if (p.includes('facebook')) {
    return (
      <span className="platform-badge-icon facebook" title="Facebook">
        <span style={{ color: '#1877F2', fontWeight: 800, fontSize: '11px' }}>fb</span>
      </span>
    );
  }
  if (p.includes('tender') || p.includes('govt')) {
    return (
      <span className="platform-badge-icon tender" title="Govt Tenders">
        <Building size={14} style={{ color: '#F59E0B' }} />
      </span>
    );
  }
  if (p.includes('upwork')) {
    return (
      <span className="platform-badge-icon upwork" title="Upwork">
        <span style={{ color: '#14A800', fontWeight: 800, fontSize: '11px' }}>Up</span>
      </span>
    );
  }
  if (p.includes('freelance')) {
    return (
      <span className="platform-badge-icon freelancer" title="Freelancer">
        <Briefcase size={14} style={{ color: '#29B2FE' }} />
      </span>
    );
  }
  if (p.includes('wework') || p.includes('remotely')) {
    return (
      <span className="platform-badge-icon wwr" title="WeWorkRemotely">
        <Globe size={14} style={{ color: '#E25822' }} />
      </span>
    );
  }
  return (
    <span className="platform-badge-icon default" title={platform || 'Web'}>
      <Globe size={14} />
    </span>
  );
};

// Circular Score Ring Chart
const ScoreRing = ({ score = 85 }) => {
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="score-circle-wrapper" title={`AI Confidence Score: ${score}%`}>
      <span className="score-label">AI Match</span>
      <div className="score-svg-container">
        <svg className="score-svg" viewBox="0 0 36 36">
          <circle className="score-bg" cx="18" cy="18" r={radius} />
          <circle
            className="score-fill"
            cx="18"
            cy="18"
            r={radius}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
          <text
            x="18"
            y="18.5"
            className="score-text"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {score}%
          </text>
        </svg>
      </div>
    </div>
  );
};

// Custom Glassmorphic Select Component
const CustomPipelineSelect = ({ options, value, onChange }) => {
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
    <div className={`custom-pipeline-select ${isOpen ? 'is-open' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className={`select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : ''}</span>
        <ChevronDown size={15} className={`chevron-icon ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="select-dropdown-menu">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`select-item ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={14} className="check-icon" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WORKFLOW_MODE_OPTIONS = [
  { value: 'sales', label: 'Sales Workflow Mode' },
  { value: 'recruiter', label: 'Recruiter Workflow Mode' },
];

const PLATFORM_OPTIONS = [
  { value: 'ALL', label: 'All Platforms' },
  { value: 'Google Maps', label: 'Google Maps' },
  { value: 'Govt Tenders', label: 'Govt Tenders' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Twitter', label: 'Twitter / X' },
  { value: 'Reddit', label: 'Reddit' },
  { value: 'WeWorkRemotely', label: 'WeWorkRemotely' },
  { value: 'Freelancer', label: 'Freelancer' },
  { value: 'Upwork', label: 'Upwork' },
];

const INTENT_OPTIONS = [
  { value: 'ALL', label: 'All Intents' },
  { value: 'HIGH', label: 'High Intent (80%+)' },
  { value: 'MEDIUM', label: 'Medium Intent (50-79%)' },
  { value: 'LOW', label: 'Low Intent (<50%)' },
];

// Initial Demo Leads Fallback
const DEFAULT_DEMO_LEADS = [
  {
    _id: '1',
    sourceUrl: 'https://maps.google.com/?cid=1001',
    isConverted: false,
    crmStatus: 'New',
    createdAt: '2026-08-16T10:00:00Z',
    authorName: 'Apex Dental Care',
    companyName: 'Apex Dental Clinic',
    platform: 'Google Maps',
    leadCategory: 'Dental & Health',
    search_type: 'sales',
    leadScore: 94,
    confidenceScore: 92,
    serviceRequired: 'Local SEO & Google Ads Management',
    needDescription: 'Looking for a digital agency to overhaul GMB ranking and run local search ads for dental implants in Austin.',
    rating: 4.8,
    reviews: 142,
    phone: '+1 (555) 234-5678',
    location: 'Austin, TX',
  },
  {
    _id: '2',
    sourceUrl: 'https://weworkremotely.com/jobs/dev-lead-01',
    isConverted: false,
    crmStatus: 'New',
    createdAt: '2026-08-15T14:20:00Z',
    authorName: 'Sarah Jenkins',
    companyName: 'CloudScale Tech',
    platform: 'WeWorkRemotely',
    leadCategory: 'Senior React Architect',
    search_type: 'recruiter',
    leadScore: 96,
    confidenceScore: 90,
    serviceRequired: 'Fullstack React & Node Specialist',
    needDescription: 'Senior Frontend Architect with 6+ years experience in React, TypeScript, and WebSockets.',
    location: 'Remote (US)',
    experienceLevel: 'Senior (6+ yrs)',
    workPreference: 'Full-time Remote',
    skills: 'React, TypeScript, Node.js, GraphQL',
  },
  {
    _id: '3',
    sourceUrl: 'https://tenders.gov/req-88912',
    isConverted: false,
    crmStatus: 'Drafted',
    createdAt: '2026-08-14T09:15:00Z',
    authorName: 'Dept of Urban Transport',
    companyName: 'Austin Municipal Govt',
    platform: 'Govt Tenders',
    leadCategory: 'Smart Traffic GIS Mapping',
    search_type: 'sales',
    leadScore: 89,
    confidenceScore: 85,
    serviceRequired: 'GIS & Real-time Location Analytics',
    needDescription: 'RFP for cloud-based traffic density mapping and automated lead dispatch system for public transit.',
    location: 'Austin, TX',
  },
  {
    _id: '4',
    sourceUrl: 'https://linkedin.com/posts/techcorp-lead-401',
    isConverted: false,
    crmStatus: 'Emailed',
    createdAt: '2026-08-13T11:45:00Z',
    authorName: 'David Miller',
    companyName: 'Starlight Media SaaS',
    platform: 'LinkedIn',
    leadCategory: 'B2B Lead Generation',
    search_type: 'sales',
    leadScore: 82,
    confidenceScore: 84,
    serviceRequired: 'Outbound Cold Email Automation',
    needDescription: 'We need an automated cold email infrastructure setup to target SMB healthcare directors.',
    location: 'San Francisco, CA',
  },
  {
    _id: '5',
    sourceUrl: 'https://upwork.com/jobs/~01fe92841ab',
    isConverted: false,
    crmStatus: 'Replied',
    createdAt: '2026-08-12T16:30:00Z',
    authorName: 'Marcus Vance',
    companyName: 'Vance Capital',
    platform: 'Upwork',
    leadCategory: 'AI Automation Workflow',
    search_type: 'sales',
    leadScore: 91,
    confidenceScore: 89,
    serviceRequired: 'Custom OpenAI Agent Development',
    needDescription: 'Build a Python FastAPI backend to auto-parse incoming PDF quotes and populate Hubspot CRM.',
    location: 'New York, NY',
  },
  {
    _id: '6',
    sourceUrl: 'https://twitter.com/dev_hiring/status/19823412',
    isConverted: false,
    crmStatus: 'Disqualified',
    createdAt: '2026-08-10T08:10:00Z',
    authorName: 'TechRecruiter_X',
    companyName: 'NextGen Staffing',
    platform: 'Twitter / X',
    leadCategory: 'Python Backend Dev',
    search_type: 'recruiter',
    leadScore: 42,
    confidenceScore: 50,
    serviceRequired: 'Junior Django Developer',
    needDescription: 'Hiring junior devs with 1 yr experience.',
    location: 'Chicago, IL',
    experienceLevel: 'Junior (1 yr)',
    workPreference: 'On-site Chicago',
    skills: 'Python, Django',
  }
];

const OutreachPipeline = ({
  leads: propsLeads,
  onUpdateLead,
  onOpenLead,
  onRefresh,
  onDeleteLeads,
}) => {
  // Local state if propsLeads is not provided
  const [internalLeads, setInternalLeads] = useState(DEFAULT_DEMO_LEADS);
  const activeLeads = propsLeads && propsLeads.length > 0 ? propsLeads : internalLeads;

  // Filter Toolbar State
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [intentFilter, setIntentFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL'); // 'ALL' | 'sales' | 'recruiter'
  const [filterMode, setFilterMode] = useState('sales'); // 'sales' | 'recruiter'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Date Preset Handler
  const formatDateForInput = (d) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDatePreset = (presetType) => {
    const now = new Date();
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

  // Drag State
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Selected Lead Modal Preview
  const [selectedLeadModal, setSelectedLeadModal] = useState(null);

  const datePickerRef = useRef(null);

  // Close date popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Columns & Stages Configuration depending on Workflow Mode
  const STAGE_CONFIGS = {
    sales: [
      { id: 'New', label: 'New Leads', statusKey: 'New', color: '#3B82F6' },
      { id: 'Drafted', label: 'Drafted Pitch', statusKey: 'Drafted', color: '#8B5CF6' },
      { id: 'Emailed', label: 'Emailed Out', statusKey: 'Emailed', color: '#F59E0B' },
      { id: 'Replied', label: 'Replied', statusKey: 'Replied', color: '#10B981' },
      { id: 'Disqualified', label: 'Disqualified', statusKey: 'Disqualified', color: '#EF4444' },
    ],
    recruiter: [
      { id: 'New', label: 'Discovered', statusKey: 'Discovered', color: '#3B82F6' },
      { id: 'Drafted', label: 'Contacted', statusKey: 'Contacted', color: '#8B5CF6' },
      { id: 'Emailed', label: 'Screening', statusKey: 'Screening', color: '#F59E0B' },
      { id: 'Replied', label: 'Interviewing', statusKey: 'Interviewing', color: '#10B981' },
      { id: 'Disqualified', label: 'Rejected', statusKey: 'Rejected', color: '#EF4444' },
    ],
  };

  const currentStages = STAGE_CONFIGS[filterMode] || STAGE_CONFIGS.sales;

  // Filtered Leads Calculation
  const filteredLeads = activeLeads.filter((lead) => {
    // Search Query (authorName or companyName)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (lead.authorName || '').toLowerCase().includes(q);
      const compMatch = (lead.companyName || '').toLowerCase().includes(q);
      if (!nameMatch && !compMatch) return false;
    }

    // Platform Filter
    if (platformFilter !== 'ALL') {
      const p = (lead.platform || '').toLowerCase();
      if (!p.includes(platformFilter.toLowerCase())) return false;
    }

    // Intent Filter
    const score = lead.leadScore || 50;
    if (intentFilter === 'HIGH' && score < 80) return false;
    if (intentFilter === 'MEDIUM' && (score < 50 || score >= 80)) return false;
    if (intentFilter === 'LOW' && score >= 50) return false;

    // Mode Select (Sales vs Recruiter)
    if (modeFilter !== 'ALL' && lead.search_type && lead.search_type !== modeFilter) {
      return false;
    }

    // Date Range Filter
    if (startDate) {
      const leadDate = new Date(lead.createdAt);
      if (leadDate < new Date(startDate)) return false;
    }
    if (endDate) {
      const leadDate = new Date(lead.createdAt);
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      if (leadDate > endD) return false;
    }

    return true;
  });

  // Handle Drag & Drop
  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.setData('text/plain', lead.sourceUrl);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggedLead) return;

    const sourceUrl = draggedLead.sourceUrl;
    // Map stage target
    if (onUpdateLead) {
      onUpdateLead(sourceUrl, { crmStatus: targetStage });
    } else {
      // Update local state
      setInternalLeads((prev) =>
        prev.map((l) => (l.sourceUrl === sourceUrl ? { ...l, crmStatus: targetStage } : l))
      );
    }
    setDraggedLead(null);
  };

  // Handle Refresh Click
  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // Handle Delete Lead
  const handleDeleteCard = (lead, e) => {
    e.stopPropagation();
    if (onDeleteLeads) {
      onDeleteLeads([lead.sourceUrl]);
    } else {
      setInternalLeads((prev) => prev.filter((l) => l.sourceUrl !== lead.sourceUrl));
    }
  };

  // Handle Open Lead Modal
  const handleCardClick = (lead) => {
    setSelectedLeadModal(lead);
    if (onOpenLead) {
      onOpenLead(lead);
    }
  };

  return (
    <div className="outreach-pipeline-container animate-fade-in">
      {/* Top Filter Toolbar */}
      <div className="pipeline-toolbar-card">
        <div className="toolbar-header">
          <div className="title-group">
            <div className="title-icon">
              <Layers size={22} />
            </div>
            <div>
              <h2>Outreach CRM Pipeline</h2>
              <p>Drag and drop leads to track engagement across sales & recruitment workflows</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className={`btn-refresh ${isRefreshing ? 'spinning' : ''}`}
              onClick={handleRefreshClick}
              title="Refresh pipeline leads"
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="toolbar-filters">
          {/* Search Input */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by author or company name..."
            />
          </div>

          {/* Workflow Mode Select */}
          {/* <CustomPipelineSelect
            options={WORKFLOW_MODE_OPTIONS}
            value={filterMode}
            onChange={(val) => {
              setFilterMode(val);
              setModeFilter(val);
            }}
          /> */}

          {/* Platform Filter */}
          <CustomPipelineSelect
            options={PLATFORM_OPTIONS}
            value={platformFilter}
            onChange={(val) => setPlatformFilter(val)}
          />

          {/* Intent Filter */}
          <CustomPipelineSelect
            options={INTENT_OPTIONS}
            value={intentFilter}
            onChange={(val) => setIntentFilter(val)}
          />

          {/* Date Picker Trigger */}
          <div className={`date-picker-wrapper ${showDatePicker ? 'is-open' : ''}`} ref={datePickerRef}>
            <button
              className={`btn-date-trigger ${(startDate || endDate) ? 'active' : ''}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <Calendar size={15} />
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
                    <Calendar size={15} className="title-icon" />
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
                    className="preset-chip"
                    onClick={() => handleDatePreset('today')}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="preset-chip"
                    onClick={() => handleDatePreset('last7')}
                  >
                    7 Days
                  </button>
                  <button
                    type="button"
                    className="preset-chip"
                    onClick={() => handleDatePreset('last30')}
                  >
                    30 Days
                  </button>
                  <button
                    type="button"
                    className="preset-chip"
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
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="date-input-group">
                    <label>End Date</label>
                    <div className="input-with-icon">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
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
      </div>

      {/* Kanban Board Grid */}
      <div className="kanban-board-wrapper">
        <div className="kanban-board-grid">
          {currentStages.map((stage) => {
            // Find leads matching stage
            const stageLeads = filteredLeads.filter((l) => {
              const status = l.crmStatus || 'New';
              // Check direct match or fallback index match
              if (status === stage.statusKey || status === stage.id) return true;
              if (filterMode === 'sales' && stage.id === 'New' && (status === 'Discovered' || status === 'New')) return true;
              if (filterMode === 'recruiter' && stage.id === 'New' && (status === 'New' || status === 'Discovered')) return true;
              return false;
            });

            const isOver = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`kanban-column ${isOver ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.statusKey)}
              >
                {/* Column Header */}
                <div className="column-header">
                  <div className="header-title-group">
                    <span
                      className="stage-dot"
                      style={{ backgroundColor: stage.color, color: stage.color }}
                    />
                    <h3>{stage.label}</h3>
                  </div>
                  <span className="count-badge">{stageLeads.length}</span>
                </div>

                {/* Cards List */}
                <div className="column-cards-container">
                  {stageLeads.length === 0 ? (
                    <div className="empty-column-state">
                      <Sparkles size={20} style={{ opacity: 0.4 }} />
                      <p>No leads in {stage.label}</p>
                    </div>
                  ) : (
                    stageLeads.map((lead, idx) => {
                      const name = lead.authorName || lead.companyName || 'Business Lead';
                      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        name
                      )}&background=0EA5A4&color=fff&bold=true`;

                      return (
                        <div
                          key={lead._id || lead.sourceUrl || idx}
                          className="kanban-card"
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onClick={() => handleCardClick(lead)}
                        >
                          {/* Hover Quick Actions Overlay */}
                          <div className="card-hover-overlay">
                            <button
                              title="Expand Lead Details"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(lead);
                              }}
                            >
                              <Eye size={14} />
                            </button>
                            <a
                              href={lead.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="View Source Post"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={14} />
                            </a>
                            <button
                              className="btn-delete"
                              title="Delete Lead"
                              onClick={(e) => handleDeleteCard(lead, e)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Header Row */}
                          <div className="card-header-row">
                            <div className="author-info">
                              <img
                                src={avatarUrl}
                                alt={name}
                                className="avatar-img"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                }}
                              />
                              <div className="author-text">
                                <span className="author-name">{name}</span>
                                {lead.companyName && (
                                  <span className="company-name">{lead.companyName}</span>
                                )}
                              </div>
                            </div>

                            <PlatformIcon platform={lead.platform} />
                          </div>

                          {/* Body Content - Platform Specific */}
                          <div className="card-body-content">
                            {lead.needDescription && (
                              <p className="req-description">{lead.needDescription}</p>
                            )}

                            {/* Google Maps Details */}
                            {lead.platform === 'Google Maps' && (
                              <div className="gmaps-spec">
                                {lead.rating && (
                                  <span className="star-rating">
                                    <Star size={12} fill="#F59E0B" /> {lead.rating} ({lead.reviews || 0})
                                  </span>
                                )}
                                {lead.phone && (
                                  <span className="phone-info">
                                    <Phone size={12} /> {lead.phone}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Govt Tenders Details */}
                            {lead.platform === 'Govt Tenders' && (
                              <div className="tender-spec">
                                <span>🏛️ {lead.authorName || 'Public Agency'}</span>
                                <span>💵 Est. $50k+</span>
                              </div>
                            )}

                            {/* Freelance (Upwork / Freelancer) Details */}
                            {(lead.platform === 'Upwork' || lead.platform === 'Freelancer') && (
                              <div className="freelance-spec">
                                <span>💼 Freelance Project</span>
                                <span>💵 Fixed / Hourly</span>
                              </div>
                            )}

                            {/* Candidate / Recruiter Badges */}
                            {(lead.search_type === 'recruiter' || filterMode === 'recruiter') && (
                              <div className="recruiter-spec">
                                {lead.experienceLevel && (
                                  <span className="exp-tag">{lead.experienceLevel}</span>
                                )}
                                {lead.workPreference && (
                                  <span className="skill-tag">{lead.workPreference}</span>
                                )}
                                {lead.skills && (
                                  <span className="skill-tag">{lead.skills}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Footer Metrics */}
                          <div className="card-footer-metrics">
                            <div className="location-tag">
                              <MapPin size={13} />
                              <span>{lead.location || lead.platform || 'Global'}</span>
                            </div>

                            <ScoreRing score={lead.leadScore || 85} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-Over Modal Preview */}
      {selectedLeadModal && (
        <div className="lead-modal-backdrop" onClick={() => setSelectedLeadModal(null)}>
          <div className="lead-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    selectedLeadModal.authorName || selectedLeadModal.companyName || 'Lead'
                  )}&background=0EA5A4&color=fff&bold=true`}
                  alt="Lead Avatar"
                  className="modal-avatar"
                />
                <div>
                  <h3>{selectedLeadModal.authorName || selectedLeadModal.companyName}</h3>
                  <p>{selectedLeadModal.companyName} • {selectedLeadModal.platform}</p>
                </div>
              </div>
              <button
                className="btn-close-modal"
                onClick={() => setSelectedLeadModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-grid-info">
              <div className="info-card">
                <span className="info-label">AI Match Score</span>
                <span className="info-val" style={{ color: '#0EA5A4' }}>
                  {selectedLeadModal.leadScore || 85}%
                </span>
              </div>
              <div className="info-card">
                <span className="info-label">Category / Service</span>
                <span className="info-val">{selectedLeadModal.leadCategory || 'General SaaS'}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Location</span>
                <span className="info-val">{selectedLeadModal.location || 'Remote'}</span>
              </div>
              <div className="info-card">
                <span className="info-label">CRM Stage</span>
                <span className="info-val">{selectedLeadModal.crmStatus}</span>
              </div>
            </div>

            <div className="modal-section">
              <h4>Extracted Need Description</h4>
              <p>{selectedLeadModal.needDescription || 'No detailed description available.'}</p>
            </div>

            {selectedLeadModal.phone && (
              <div className="modal-section">
                <h4>Direct Phone / Contact</h4>
                <p>📞 {selectedLeadModal.phone}</p>
              </div>
            )}

            <div className="modal-footer-actions">
              <a
                href={selectedLeadModal.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-visit-source"
              >
                <span>View Source Post</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutreachPipeline;
