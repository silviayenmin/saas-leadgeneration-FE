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
import { getLeadScoreVal } from '../utils/helpers';
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
  { value: 'ALL', label: 'All Intent Scores' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Potential Lead', label: 'Potential Lead' },
  { value: 'Warm Lead', label: 'Warm Lead' }
];

const OutreachPipeline = ({
  leads: propsLeads,
  onUpdateLead,
  onOpenLead,
  onRefresh,
  onDeleteLeads,
}) => {
  // Local state if propsLeads is not provided
  const [internalLeads, setInternalLeads] = useState([]);
  const activeLeads = (propsLeads && propsLeads.length > 0 ? propsLeads : internalLeads).filter((l) => l.isConverted === true);

  // Filter Toolbar State
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [intentFilter, setIntentFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL'); // 'ALL' | 'sales' | 'recruiter'
  const [filterMode, setFilterMode] = useState('sales'); // 'sales' | 'recruiter'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState('');
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

    // Intent Filter (>75 -> Qualified, 40-75 -> Potential Lead, <40 -> Warm Lead)
    if (intentFilter !== 'ALL') {
      const score = getLeadScoreVal(lead);
      if (intentFilter === 'Qualified' && score <= 75) return false;
      if (intentFilter === 'Potential Lead' && (score < 40 || score > 75)) return false;
      if (intentFilter === 'Warm Lead' && score >= 40) return false;
    }

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
                       const name = lead.companyName || lead.authorName || 'Business Lead';
                       const getInitial = (s) => (s ? s.trim().charAt(0).toUpperCase() : 'B');
                       const initial = getInitial(name);
                       
                       // Generate beautiful premium gradients based on name monogram
                       let gradient = 'linear-gradient(135deg, #0ea5a9 0%, #3b82f6 100%)';
                       if ('AEIOU'.includes(initial)) {
                         gradient = 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)';
                       } else if ('BCDFG'.includes(initial)) {
                         gradient = 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)';
                       } else if ('HJKLM'.includes(initial)) {
                         gradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                       } else if ('NPRST'.includes(initial)) {
                         gradient = 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)';
                       }

                       const score = lead.leadScore !== undefined ? lead.leadScore : 85;
                       let scoreColor = '#EF4444'; 
                       let scoreBg = 'rgba(239, 68, 68, 0.08)';
                       if (score >= 80) {
                         scoreColor = '#10B981'; 
                         scoreBg = 'rgba(16, 185, 129, 0.08)';
                       } else if (score >= 50) {
                         scoreColor = '#F59E0B'; 
                         scoreBg = 'rgba(245, 158, 11, 0.08)';
                       }

                       const platformName = lead.platform || 'Google Maps';
                       const isGmaps = platformName.toLowerCase().includes('maps') || platformName.toLowerCase().includes('google');

                       return (
                         <div
                           key={lead._id || lead.sourceUrl || idx}
                           className="kanban-card"
                           draggable
                           onDragStart={(e) => handleDragStart(e, lead)}
                           onClick={() => handleCardClick(lead)}
                           style={{ transition: 'all 0.2s ease-in-out' }}
                         >
                            {/* Hover Delete Action Button */}
                            <button
                              className="btn-delete-card-hover"
                              title="Delete Lead"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCard(lead, e);
                              }}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.15)',
                                color: '#EF4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                opacity: 0,
                                transition: 'all 0.2s ease',
                                zIndex: 10
                              }}
                            >
                              <Trash2 size={12} />
                            </button>

                           {/* Header Row */}
                           <div className="card-header-row" style={{ alignItems: 'flex-start' }}>
                             <div className="author-info" style={{ gap: '10px' }}>
                               <div style={{
                                 width: '32px',
                                 height: '32px',
                                 borderRadius: '8px',
                                 background: gradient,
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 fontWeight: '700',
                                 color: '#fff',
                                 fontSize: '0.85rem',
                                 boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                 flexShrink: 0
                               }}>
                                 {initial}
                               </div>
                               <div className="author-text">
                                 <span className="author-name" style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.25' }}>
                                   {name}
                                 </span>
                               </div>
                             </div>
                           </div>

                           {/* Body Content - Platform Specific */}
                           <div className="card-body-content" style={{ gap: '8px' }}>
                             {/* Styled Brand Platform Tag */}
                             <div>
                               <span style={{
                                 display: 'inline-flex',
                                 alignItems: 'center',
                                 gap: '4px',
                                 fontSize: '0.65rem',
                                 fontWeight: '700',
                                 color: isGmaps ? '#4285F4' : '#0EA5A4',
                                 background: isGmaps ? 'rgba(66, 133, 244, 0.08)' : 'rgba(14, 165, 164, 0.08)',
                                 border: isGmaps ? '1px solid rgba(66, 133, 244, 0.15)' : '1px solid rgba(14, 165, 164, 0.15)',
                                 padding: '3px 8px',
                                 borderRadius: '12px',
                                 textTransform: 'uppercase',
                                 letterSpacing: '0.3px'
                               }}>
                                 <MapPin size={10} />
                                 {platformName}
                               </span>
                             </div>

                             {/* Contact Info Overview Box */}
                             {(lead.contactInfo || lead.phone) && (
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', borderTop: '1px dashed rgba(255, 255, 255, 0.06)', paddingTop: '6px' }}>
                                 {lead.contactInfo && (
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-secondary)' }} title={lead.contactInfo}>
                                     <span style={{ color: '#0EA5A4', fontSize: '0.8rem' }}>✉</span>
                                     <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                       {lead.contactInfo}
                                     </span>
                                   </div>
                                 )}
                                 {lead.phone && (
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                     <span style={{ color: '#0EA5A4', fontSize: '0.8rem' }}>📞</span>
                                     <span>{lead.phone}</span>
                                   </div>
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
                           <div className="card-footer-metrics" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px', marginTop: '8px' }}>
                             {lead.rating ? (
                               <div className="rating-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#F59E0B', fontWeight: 600 }}>
                                 <Star size={11} fill="#F59E0B" stroke="#F59E0B" />
                                 <span>{lead.rating} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({lead.reviews || 0})</span></span>
                               </div>
                             ) : (
                               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                 No rating
                               </div>
                             )}

                             <div className="score-tag" style={{ fontSize: '0.68rem', fontWeight: 700, color: scoreColor, background: scoreBg, padding: '3px 8px', borderRadius: '4px', border: `1px solid ${scoreColor}20` }}>
                               Match: {score}%
                             </div>
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
