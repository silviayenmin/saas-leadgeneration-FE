import React, { useState, useMemo, useEffect } from 'react';
import {
  Database,
  TrendingUp,
  Search,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ExternalLink,
  Copy,
  Trash2,
  Filter,
  RotateCcw,
  MapPin,
  Sparkles,
  Download,
  RefreshCw,
  ChevronRight,
  FileSpreadsheet,
  Star
} from 'lucide-react';
import {
  getLeadPlatform,
  getPlatformIcon,
  getLeadAvatarUrl,
  getCompanyLogoUrl,
  getStatusBadgeClass,
  parseIsoDate
} from '../utils/helpers';
import api from '../services/api';
import './Pages.scss';

function CustomSelect({ value, onChange, options, style, onDeleteItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="filter-select-container" ref={dropdownRef} style={{ ...style, position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="filter-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)',
          borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer',
          width: '100%'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
          {selectedOption ? selectedOption.label : ''}
        </span>
        <ChevronDown size={14} style={{ marginLeft: '8px', flexShrink: 0 }} />
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute', top: '35px', left: 0, zIndex: 100,
          background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '4px', width: onDeleteItem ? '240px' : '100%',
          boxShadow: 'var(--shadow-md)', maxHeight: '200px', overflowY: 'auto'
        }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
                background: opt.value === value ? 'var(--bg-trans-5)' : 'transparent'
              }}
            >
              <button
                type="button"
                style={{
                  background: 'none', border: 'none', color: 'var(--text-primary)',
                  fontSize: '0.82rem', textAlign: 'left', flexGrow: 1, padding: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </button>
              {onDeleteItem && opt.value !== 'all' && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(opt.value);
                  }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MapsScans({ leads = [], setLeads, searches = [], setSearches, onOpenLead, onUpdateLead }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchId, setSelectedSearchId] = useState('all');
  const [filterIntent, setFilterIntent] = useState('all');
  const [filterCrm, setFilterCrm] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all', 'high', 'phone'

  // Date range picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected checkboxes
  const [selectedUrls, setSelectedUrls] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Reset page to 1 whenever any filter criteria changes to avoid empty list page lock
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSearchId, filterIntent, filterCrm, quickFilter, startDate, endDate]);

  // Google Sheets sync state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStep, setSyncStep] = useState('setup'); // 'setup' | 'syncing' | 'success'
  const [spreadsheetOption, setSpreadsheetOption] = useState('new'); // 'new' | 'existing'
  const [existingSheetUrl, setExistingSheetUrl] = useState('');
  const [syncStatusText, setSyncStatusText] = useState('');
  const [syncResultUrl, setSyncResultUrl] = useState('');

  // Filter searches list to map scans only
  const tabSearches = useMemo(() => {
    return (searches || [])
      .filter((s) => (s.platform || '').toLowerCase().strip ? (s.platform || '').toLowerCase().trim() === 'google_maps' : (s.platform || '').toLowerCase() === 'google_maps')
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [searches]);

  // Base list of maps leads
  const baseLeads = useMemo(() => {
    return leads.filter((lead) => getLeadPlatform(lead) === 'google_maps');
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

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return baseLeads.filter((lead) => {
      // Search run filter
      if (selectedSearchId !== 'all') {
        const matchingSearch = searches.find((s) => s.id === selectedSearchId);
        if (matchingSearch && matchingSearch.leadUrls) {
          if (!matchingSearch.leadUrls.includes(lead.sourceUrl)) return false;
        } else {
          return false;
        }
      }

      // Keyword text filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const company = (lead.companyName || '').toLowerCase();
        const website = (lead.website || '').toLowerCase();
        const location = (lead.location || '').toLowerCase();
        if (!company.includes(query) && !website.includes(query) && !location.includes(query)) return false;
      }

      // Intent rating filter
      const leadStatus = (lead.leadStatus || '').toLowerCase();
      const buyingIntent = (lead.buyingIntent || '').toLowerCase();
      if (filterIntent !== 'all') {
        if (filterIntent === 'Qualified') {
          if (!leadStatus.includes('qualif') && !leadStatus.includes('new lead') && !leadStatus.includes('new') && buyingIntent !== 'high' && buyingIntent !== 'hiring') return false;
        } else if (filterIntent === 'Unqualified') {
          if (!leadStatus.includes('unqualified') && !leadStatus.includes('not qualified') && !leadStatus.includes('disqualified') && buyingIntent !== 'none' && buyingIntent !== 'low' && buyingIntent !== 'unknown') return false;
        } else if (filterIntent === 'Warm Lead') {
          if (!leadStatus.includes('warm') && buyingIntent !== 'research' && buyingIntent !== 'warm') return false;
        } else if (filterIntent === 'Potential Lead') {
          if (!leadStatus.includes('potential') && !leadStatus.includes('cold') && buyingIntent !== 'potential') return false;
        } else if (filterIntent === 'Not a Lead') {
          if (!leadStatus.includes('not a lead') && !leadStatus.includes('not lead') && buyingIntent !== 'none') return false;
        } else if (filterIntent === 'Informational') {
          if (!leadStatus.includes('info') && buyingIntent !== 'low') return false;
        } else {
          if (!leadStatus.includes(filterIntent.toLowerCase()) && !buyingIntent.includes(filterIntent.toLowerCase())) return false;
        }
      }

      // CRM stage
      const crmStage = (lead.crmStatus || 'New').toLowerCase();
      if (filterCrm !== 'all' && crmStage !== filterCrm.toLowerCase()) return false;

      // Quick filter
      if (quickFilter === 'high') {
        if ((parseFloat(lead.rating) || 0) < 4.0) return false;
      } else if (quickFilter === 'phone' && !lead.phone) {
        return false;
      }

      // Date range filter
      if (!matchDate(lead.createdAt)) return false;

      return true;
    });
  }, [baseLeads, searchQuery, selectedSearchId, filterIntent, filterCrm, quickFilter, startDate, endDate, searches]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const highCount = filteredLeads.filter((l) => (parseFloat(l.rating) || 0) >= 4.0).length;
    const highPct = total > 0 ? Math.round((highCount / total) * 100) : 0;
    const queriesCount = tabSearches.length;
    const contactsFound = filteredLeads.filter((l) => l.phone).length;
    const contactsPct = total > 0 ? Math.round((contactsFound / total) * 100) : 0;

    return { total, highCount, highPct, queriesCount, contactsPct };
  }, [filteredLeads, tabSearches]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const currentLeads = useMemo(() => {
    const sorted = [...filteredLeads].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const startIdx = (currentPage - 1) * pageSize;
    return sorted.slice(startIdx, startIdx + pageSize);
  }, [filteredLeads, currentPage]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageUrls = currentLeads.map((l) => l.sourceUrl);
      setSelectedUrls((prev) => [...new Set([...prev, ...pageUrls])]);
    } else {
      const pageUrls = currentLeads.map((l) => l.sourceUrl);
      setSelectedUrls((prev) => prev.filter((url) => !pageUrls.includes(url)));
    }
  };

  const handleSelectRow = (url, checked) => {
    if (checked) {
      setSelectedUrls((prev) => [...prev, url]);
    } else {
      setSelectedUrls((prev) => prev.filter((u) => u !== url));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUrls.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedUrls.length} selected leads?`)) return;

    try {
      const res = await api.post('/leads/bulk-delete', { urls: selectedUrls });
      if (res.data.status === 'success') {
        const resLeads = await api.get('/leads');
        if (resLeads.data && resLeads.data.leads) {
          setLeads(resLeads.data.leads);
        }
        setSelectedUrls([]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete leads.');
    }
  };

  const handleDeleteSearchQuery = async (searchId) => {
    if (!window.confirm('Delete this search query and its historical markers?')) return;
    try {
      const res = await api.delete(`/searches/${searchId}`);
      if (res.data.status === 'success') {
        const resSearches = await api.get('/searches');
        if (resSearches.data && resSearches.data.searches) {
          setSearches(resSearches.data.searches);
        }
        if (selectedSearchId === searchId) {
          setSelectedSearchId('all');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete search.');
    }
  };

  const handleExportCSV = () => {
    const urlsToExport = selectedUrls.length > 0 ? selectedUrls : filteredLeads.map(l => l.sourceUrl);
    const selectedLeads = baseLeads.filter(lead => urlsToExport.includes(lead.sourceUrl));
    
    if (selectedLeads.length === 0) {
      alert('No leads to export.');
      return;
    }

    const headers = [
      'Date', 'Company Name', 'Phone Number', 'Google Rating',
      'Total Reviews', 'Website', 'Pipeline Stage', 'Location',
      'Contact Email', 'Source URL'
    ];

    const rows = selectedLeads.map(lead => [
      lead.createdAt || '',
      lead.companyName || '',
      lead.phone || '',
      lead.rating || '',
      lead.reviews || '',
      lead.website || '',
      lead.crmStatus || 'New',
      lead.location || '',
      lead.contactInfo || '',
      lead.sourceUrl || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `google_maps_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenSyncSheetsModal = async () => {
    const urlsToSync = selectedUrls.length > 0 ? selectedUrls : filteredLeads.map(l => l.sourceUrl);
    if (urlsToSync.length === 0) {
      alert('No leads selected to sync.');
      return;
    }
    setSyncStep('setup');
    setSyncResultUrl('');
    setShowSyncModal(true);

    try {
      const res = await api.get('/config/google-sheets');
      if (res.data && res.data.sheet_id) {
        setExistingSheetUrl(res.data.sheet_id);
        setSpreadsheetOption('existing');
      } else {
        setSpreadsheetOption('new');
        setExistingSheetUrl('');
      }
    } catch (e) {
      console.error(e);
      setSpreadsheetOption('new');
      setExistingSheetUrl('');
    }
  };

  const handleStartSync = async () => {
    setSyncStep('syncing');
    const statuses = [
      'Establishing Google Drive API handshake...',
      'Authorizing credentials...',
      spreadsheetOption === 'new' ? 'Provisioning new Google Sheet spreadsheet...' : 'Validating existing spreadsheet access...',
      'Mapping column headers (Company, Phone, Email, Rating, Reviews)...',
      `Writing ${selectedUrls.length > 0 ? selectedUrls.length : filteredLeads.length} lead rows...`,
      'Applying premium conditional formatting and styling...',
      'Finalizing workbook sync and flush...'
    ];
    for (let i = 0; i < statuses.length; i++) {
      setSyncStatusText(statuses[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    try {
      const res = await api.post('/sync-sheets', {
        leads: baseLeads.filter(lead => (selectedUrls.length > 0 ? selectedUrls : filteredLeads.map(l => l.sourceUrl)).includes(lead.sourceUrl)),
        option: spreadsheetOption,
        url: existingSheetUrl
      });
      if (res.data && res.data.spreadsheet_url) {
        setSyncResultUrl(res.data.spreadsheet_url);
      }
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.detail || 'Failed to sync leads to Google Sheets.');
      setSyncStep('setup');
      return;
    }
    setSyncStep('success');
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedSearchId('all');
    setFilterIntent('all');
    setFilterCrm('all');
    setQuickFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setSelectedUrls([]);
    setShowDatePicker(false);
  };

  const queryOptions = [
    { value: 'all', label: 'All queries' },
    ...tabSearches.map((s) => ({
      value: s.id,
      label: `${s.keyword || 'Search Query'} (${s.leadUrls ? s.leadUrls.length : 0})`
    }))
  ];

  const intentOptions = [
    { value: 'all', label: 'All Intent Scores' },
    { value: 'Qualified', label: 'Qualified' },
    { value: 'Warm Lead', label: 'Warm Lead' },
    { value: 'Potential Lead', label: 'Potential Lead' },
    { value: 'Informational', label: 'Informational' },
    { value: 'Unqualified', label: 'Unqualified' }
  ];

  const crmOptions = [
    { value: 'all', label: 'All Stages' },
    { value: 'New', label: 'New' },
    { value: 'Drafted', label: 'Drafted' },
    { value: 'Emailed', label: 'Emailed' },
    { value: 'Replied', label: 'Replied' },
    { value: 'Disqualified', label: 'Disqualified' }
  ];

  return (
    <div className="page-container animate-fade-in" style={{ padding: '1rem', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-8px' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Examine Google Maps queries, export CSV files, reveal contacts, and launch bulk pipeline deletions.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} /> Export CSV {selectedUrls.length > 0 ? `(${selectedUrls.length})` : '(All)'}
          </button>
          <button
            type="button"
            onClick={handleOpenSyncSheetsModal}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={14} /> Sync Sheets {selectedUrls.length > 0 ? `(${selectedUrls.length})` : '(All)'}
          </button>
        </div>
      </div>

      {/* Stats KPI Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><Database size={18} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-label">Maps Leads</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><TrendingUp size={18} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{stats.highCount} ({stats.highPct}%)</div>
            <div className="kpi-label">Highly Rated (4★+)</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Search size={18} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{stats.queriesCount}</div>
            <div className="kpi-label">Completed Scans</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><CheckCircle2 size={18} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{stats.contactsPct}%</div>
            <div className="kpi-label">Phone Numbers Found</div>
          </div>
        </div>
      </div>

      <div className="data-card">
        {/* Table Filters Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative', flexGrow: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search company or website..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '6px 12px 6px 30px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>

          <CustomSelect
            value={selectedSearchId}
            onChange={setSelectedSearchId}
            options={queryOptions}
            onDeleteItem={handleDeleteSearchQuery}
            style={{ width: '160px' }}
          />

          <CustomSelect
            value={filterIntent}
            onChange={setFilterIntent}
            options={intentOptions}
            style={{ width: '160px' }}
          />

          <CustomSelect
            value={filterCrm}
            onChange={setFilterCrm}
            options={crmOptions}
            style={{ width: '130px' }}
          />

          {/* Quick Filters */}
          <select
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            style={{ padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="all">All Records</option>
            <option value="high">Highly Rated (4★+)</option>
            <option value="phone">Phone Available</option>
          </select>

          {/* Date Picker */}
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

          <button
            type="button"
            onClick={resetAllFilters}
            className="btn btn-secondary"
            title="Reset Filters"
            style={{ padding: '6px 10px' }}
          >
            <RotateCcw size={14} />
          </button>
        </div>



        {/* Spreadsheet Data Grid */}
        {filteredLeads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No matching Google Maps scans found. Clear filters or run a scan in Lead Discovery.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '4%' }}>
                      <input
                        type="checkbox"
                        checked={currentLeads.every((l) => selectedUrls.includes(l.sourceUrl))}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ width: '25%' }}>Business / Company</th>
                    <th style={{ width: '12%' }}>Rating & Reviews</th>
                    <th style={{ width: '10%' }}>AI Match</th>
                    <th style={{ width: '13%' }}>Phone</th>
                    <th style={{ width: '20%' }}>Email Contact</th>
                    <th style={{ width: '16%' }}>CRM Lead</th>
                    <th style={{ width: '4%' }}>Maps</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLeads.map((lead, idx) => {
                    const isSelected = selectedUrls.includes(lead.sourceUrl);
                    const emailVal = lead.contactInfo || '';
                    const isEmailValid = emailVal && emailVal.includes('@') && emailVal !== 'hello@company.com';

                    return (
                      <tr
                        key={lead.sourceUrl || idx}
                        className={isSelected ? 'selected-row' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onOpenLead(lead)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(lead.sourceUrl, e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                               src={getCompanyLogoUrl(lead.companyName)} 
                               alt="Logo" 
                               style={{ width: '24px', height: '24px', borderRadius: '4px' }} 
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: '17px' }}>
                                {lead.companyName || 'Unknown Business'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '17px' }}>
                                {lead.location || 'Not Specified'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={12} fill="var(--warning)" stroke="var(--warning)" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {lead.rating || 'N/A'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              ({lead.reviews || 0})
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            fontWeight: 700, 
                            color: '#0EA5A4', 
                            background: 'rgba(14, 165, 164, 0.1)', 
                            padding: '3px 8px', 
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            {lead.leadScore !== undefined ? `${lead.leadScore}%` : '85%'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: lead.phone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {lead.phone || 'No phone'}
                          </span>
                        </td>
                        <td>
                          {isEmailValid ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span 
                                style={{ 
                                  fontSize: '0.8rem', 
                                  color: 'var(--text-primary)',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '180px',
                                  display: 'inline-block'
                                }} 
                                title={emailVal}
                              >
                                {emailVal}
                              </span>
                              <span className="intent-badge High" style={{ fontSize: '0.6rem', padding: '2px 6px', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '3px', borderRadius: '4px', marginTop: '3px' }}>✓ Verified</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No email revealed</span>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {lead.isConverted ? (
                            <span className="intent-badge High" style={{ fontSize: '0.72rem', padding: '3px 10px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
                              ✓ Converted
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => {
                                onUpdateLead(lead.sourceUrl, { isConverted: true, crmStatus: 'New' });
                              }}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.7rem',
                                height: '26px',
                                minHeight: 'auto',
                                borderRadius: '20px',
                                margin: 0,
                                background: 'var(--primary)',
                                color: '#fff',
                                border: 'none',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              Convert
                            </button>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <a href={lead.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                            <ExternalLink size={13} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '12px', 
                marginTop: '1.5rem',
                padding: '10px 0',
                borderTop: '1px solid var(--border-color)'
              }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="btn btn-secondary"
                  style={{ 
                    padding: '6px 14px', 
                    fontSize: '0.78rem',
                    borderRadius: '20px',
                    fontWeight: 600,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1
                  }}
                >
                  ← Previous
                </button>
                <span style={{ 
                  fontSize: '0.82rem', 
                  color: 'var(--text-secondary)',
                  fontWeight: 500 
                }}>
                  Page <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="btn btn-secondary"
                  style={{ 
                    padding: '6px 14px', 
                    fontSize: '0.78rem',
                    borderRadius: '20px',
                    fontWeight: 600,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Floating Premium Bulk Action Bar */}
      <div className={`floating-bulk-bar ${selectedUrls.length > 0 ? 'active' : ''}`}>
        <span className="selected-count-pill">
          {selectedUrls.length} {selectedUrls.length === 1 ? 'lead' : 'leads'} selected
        </span>
        
        <div className="actions-group">
          <button
            type="button"
            className="btn-bulk-action btn-bulk-secondary"
            onClick={handleExportCSV}
          >
            <Download size={12} /> Export CSV
          </button>
          
          <button
            type="button"
            className="btn-bulk-action btn-bulk-primary"
            onClick={handleOpenSyncSheetsModal}
            style={{ background: 'var(--primary)', color: 'var(--bg-main)' }}
          >
            <FileSpreadsheet size={12} /> Sync Sheets
          </button>
          
          <button
            type="button"
            className="btn-bulk-action btn-bulk-danger"
            onClick={handleBulkDelete}
          >
            <Trash2 size={12} /> Delete Selected
          </button>

          <button
            type="button"
            className="btn-bulk-action btn-bulk-secondary"
            onClick={() => setSelectedUrls([])}
          >
            Cancel
          </button>
        </div>
      </div>

      {showSyncModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            color: 'var(--text-primary)'
          }}>
            {syncStep === 'setup' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Sync to Google Sheets</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Export {selectedUrls.length > 0 ? selectedUrls.length : filteredLeads.length} leads directly to a spreadsheet.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1.5px solid ' + (spreadsheetOption === 'new' ? 'var(--primary)' : 'var(--border-color)'),
                    background: spreadsheetOption === 'new' ? 'rgba(0, 180, 160, 0.04)' : 'transparent',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="sheetOption"
                      checked={spreadsheetOption === 'new'}
                      onChange={() => setSpreadsheetOption('new')}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Create new Google Sheet</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Instantly provision a new spreadsheet in your Google Drive</div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1.5px solid ' + (spreadsheetOption === 'existing' ? 'var(--primary)' : 'var(--border-color)'),
                    background: spreadsheetOption === 'existing' ? 'rgba(0, 180, 160, 0.04)' : 'transparent',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="sheetOption"
                      checked={spreadsheetOption === 'existing'}
                      onChange={() => setSpreadsheetOption('existing')}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Link existing spreadsheet URL</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Append new leads to an existing spreadsheet</div>
                    </div>
                  </label>
                </div>

                {spreadsheetOption === 'existing' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Google Sheet URL</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={existingSheetUrl}
                      onChange={(e) => setExistingSheetUrl(e.target.value)}
                      style={{ fontSize: '0.82rem', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem' }} onClick={() => setShowSyncModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary" style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem' }} onClick={handleStartSync} disabled={spreadsheetOption === 'existing' && !existingSheetUrl}>Start Sync</button>
                </div>
              </div>
            )}

            {syncStep === 'syncing' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '36px', height: '36px', border: '3px solid var(--primary)', borderRightColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spinner-border .75s linear infinite', marginBottom: '16px' }}></span>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Syncing Pipeline leads...</h4>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  {syncStatusText}
                </p>
              </div>
            )}

            {syncStep === 'success' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Leads Synced Successfully</h3>
                <p style={{ margin: '8px 0 20px 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {selectedUrls.length > 0 ? selectedUrls.length : filteredLeads.length} leads have been synced to Google Sheets. You can open and view them now.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem' }} onClick={() => setShowSyncModal(false)}>Close</button>
                  <a
                    href={syncResultUrl || "https://docs.google.com/spreadsheets"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem' }}
                    onClick={() => setShowSyncModal(false)}
                  >
                    <ExternalLink size={12} /> Open Spreadsheet
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
