import React, { useEffect, useState } from 'react';
import { 
  Calendar, Database, Download, Eye, ExternalLink, 
  MapPin, Star, X, CheckCircle, Search, Mail, User,
  Brain, Copy, Linkedin, RefreshCw, Plus
} from 'lucide-react';
import api from '../services/api';
import './Pages.scss';

const MapsScans = ({ onViewDetails }) => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected scan results viewing
  const [selectedScan, setSelectedScan] = useState(null);
  const [scanLeads, setScanLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Added leads tracking (set of business IDs)
  const [addedLeads, setAddedLeads] = useState(new Set());
  const [addingLeadId, setAddingLeadId] = useState(null);

  // Detailed Lead state & Enrichment states
  const [activeLead, setActiveLead] = useState(null);
  const [activeLeadTab, setActiveLeadTab] = useState('overview');
  const [pitchType, setPitchType] = useState('Website Redesign');
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [generatedPitch, setGeneratedPitch] = useState('');
  const [enrichingEmail, setEnrichingEmail] = useState(false);
  const [enrichingTeam, setEnrichingTeam] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getRandomColor = (name) => {
    if (!name) return '#037172';
    const colors = ['#037172', '#0EA5A4', '#4DA3FF', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash % colors.length);
    return colors[idx];
  };

  // Fetch scans history list
  const fetchScans = async () => {
    try {
      const res = await api.get('/maps/scans');
      if (res.data.success) {
        // Sort newest first
        const sorted = res.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setScans(sorted);
      }
    } catch (err) {
      console.error("Failed to load map scans:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingLeads = async () => {
    try {
      const res = await api.get('/leads/');
      if (res.data.success) {
        const ids = res.data.data.map(l => l.businessId || (l.business && l.business.id));
        setAddedLeads(new Set(ids.filter(Boolean)));
      }
    } catch (err) {
      console.error("Failed to fetch existing CRM leads:", err);
    }
  };

  useEffect(() => {
    fetchScans();
    fetchExistingLeads();
  }, []);

  const handleViewLeads = async (scan) => {
    setSelectedScan(scan);
    setScanLeads([]);
    setLoadingLeads(true);
    try {
      const res = await api.get(`/maps/scans/${scan.id}/businesses`);
      if (res.data.success) {
        setScanLeads(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to retrieve scan results.");
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleExportCSV = async (scan) => {
    try {
      const res = await api.get(`/maps/scans/${scan.id}/businesses`);
      if (res.data.success && res.data.data.length > 0) {
        const leads = res.data.data;
        
        // Define CSV Headers
        const headers = ["Business Name", "Category", "Address", "Phone", "Website", "Google Rating", "Review Count", "Owner/CEO", "Emails", "LinkedIn Profile", "AI Score", "Intent Level"];
        
        // Map data rows
        const rows = leads.map(l => {
          const emailsJoined = l.emails ? l.emails.map(e => e.email).join("; ") : "";
          const linkedin = l.socialLinks ? l.socialLinks.linkedin : "";
          
          return [
            `"${(l.name || '').replace(/"/g, '""')}"`,
            `"${(l.category || '').replace(/"/g, '""')}"`,
            `"${(l.address || '').replace(/"/g, '""')}"`,
            `"${(l.phone || '').replace(/"/g, '""')}"`,
            `"${(l.website || '').replace(/"/g, '""')}"`,
            l.rating || 0.0,
            l.reviewCount || 0,
            `"${(l.owner || '').replace(/"/g, '""')}"`,
            `"${emailsJoined.replace(/"/g, '""')}"`,
            `"${(linkedin || '').replace(/"/g, '""')}"`,
            l.aiScore || 50,
            l.intent || "UNSCORED"
          ];
        });

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        const safeQuery = `${scan.keyword.replace(/\s+/g, '_')}_${scan.location.replace(/\s+/g, '_')}`;
        link.setAttribute("download", `leads_${safeQuery}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("No leads found for this scan to export.");
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export leads CSV.");
    }
  };

  const handleAddToCRM = async (business) => {
    setAddingLeadId(business.id);
    try {
      const res = await api.post(`/leads/add?business_id=${business.id}`);
      if (res.data.success) {
        setAddedLeads((prev) => {
          const next = new Set(prev);
          next.add(business.id);
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to sync lead to CRM.");
    } finally {
      setAddingLeadId(null);
    }
  };

  const handleEnrichEmail = async () => {
    if (!activeLead) return;
    setEnrichingEmail(true);
    try {
      const res = await api.post(`/enrichment/reveal-email?business_id=${activeLead.id}`);
      if (res.data.success) {
        const enrichedData = res.data.data;
        setActiveLead((prev) => ({
          ...prev,
          emails: enrichedData.emails,
          owner: enrichedData.owner,
          websiteIntelligence: enrichedData.websiteIntelligence
        }));
        setScanLeads((prev) => 
          prev.map((l) => l.id === activeLead.id ? { 
            ...l, 
            emails: enrichedData.emails,
            owner: enrichedData.owner,
            websiteIntelligence: enrichedData.websiteIntelligence
          } : l)
        );
      }
    } catch (err) {
      console.error(err);
      alert("Email enrichment lookup failed.");
    } finally {
      setEnrichingEmail(false);
    }
  };

  const handleEnrichTeam = async () => {
    if (!activeLead) return;
    setEnrichingTeam(true);
    try {
      const res = await api.post(`/enrichment/find-team?business_id=${activeLead.id}`);
      if (res.data.success) {
        const enrichedData = res.data.data;
        setActiveLead((prev) => ({
          ...prev,
          contacts: enrichedData.contacts,
          contactsSource: enrichedData.contactsSource,
          emails: enrichedData.emails
        }));
        setScanLeads((prev) => 
          prev.map((l) => l.id === activeLead.id ? { 
            ...l, 
            contacts: enrichedData.contacts,
            contactsSource: enrichedData.contactsSource,
            emails: enrichedData.emails
          } : l)
        );
      }
    } catch (err) {
      console.error(err);
      alert("Team enrichment lookup failed.");
    } finally {
      setEnrichingTeam(false);
    }
  };

  const handleGeneratePitch = async () => {
    if (!activeLead) return;
    setGeneratingPitch(true);
    setGeneratedPitch('');
    try {
      const res = await api.post('/ai/pitch', {
        businessId: activeLead.id,
        pitchType: pitchType
      });
      if (res.data.success) {
        setGeneratedPitch(res.data.pitch);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate outreach pitch.");
    } finally {
      setGeneratingPitch(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="page-container"><p style={{ color: '#94A3B8' }}>Loading historical search records...</p></div>;
  }

  return (
    <div className="page-container animate-fade-in">
      
      {/* Table Card */}
      <div className="data-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F8FAFC' }}>Maps Scans & History Log</h3>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
          Browse previous lead discovery jobs, inspect results, add them to your pipeline, and download structured B2B CSV lists.
        </p>

        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Scraped Query</th>
                <th>Target Location</th>
                <th>Run Date</th>
                <th>Businesses</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scans.length > 0 ? (
                scans.map((scan) => (
                  <tr key={scan.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={14} style={{ color: '#0EA5A4' }} />
                        <strong>{scan.keyword}</strong>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
                        <MapPin size={12} />
                        <span>{scan.location}</span>
                      </div>
                    </td>
                    <td style={{ color: '#94A3B8' }}>{formatDate(scan.createdAt)}</td>
                    <td>
                      <div style={{ display: 'inline-flex', background: 'rgba(77, 163, 255, 0.12)', color: '#4DA3FF', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                        {scan.businessesFound} leads
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#22C55E', fontSize: '0.75rem', fontWeight: '700' }}>
                        <CheckCircle size={12} />
                        <span>Completed</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        
                        <button 
                          onClick={() => handleViewLeads(scan)}
                          style={{ padding: '6px 12px', background: 'rgba(14, 165, 164, 0.1)', border: '1px solid rgba(14, 165, 164, 0.2)', borderRadius: '6px', color: '#0EA5A4', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="View Discovered Leads"
                        >
                          <Eye size={12} />
                          <span>View Leads</span>
                        </button>

                        <button 
                          onClick={() => handleExportCSV(scan)}
                          style={{ padding: '6px 12px', background: 'rgba(148, 163, 184, 0.05)', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Download CSV"
                        >
                          <Download size={12} />
                          <span>Export CSV</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748B', padding: '32px 0' }}>
                    No prior scan records found. Go to Lead Discovery to kick off your first search!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Viewing Overlay Modal */}
      {selectedScan && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10, 15, 28, 0.8)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          
          <div className="data-card animate-fade-in" style={{ width: '100%', maxWidth: '850px', background: '#111827', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', padding: 0, overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#0EA5A4', fontWeight: '700', textTransform: 'uppercase' }}>Scan Records View</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F8FAFC', marginTop: '2px' }}>
                  {selectedScan.keyword} in {selectedScan.location}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedScan(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {loadingLeads ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                  <span className="spinner" style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#0EA5A4', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', marginBottom: '8px' }} />
                  <p>Fetching discovered business leads...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {scanLeads.length > 0 ? (
                    scanLeads.map((lead) => {
                      const isAdded = addedLeads.has(lead.id);
                      return (
                        <div key={lead.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(10, 15, 28, 0.3)', border: '1px solid rgba(148, 163, 184, 0.06)', padding: '16px', borderRadius: '8px' }}>
                          <div style={{ flex: 1, pr: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <strong style={{ color: '#F8FAFC', fontSize: '0.9rem' }}>{lead.name}</strong>
                              <span style={{ fontSize: '0.7rem', background: 'rgba(14, 165, 164, 0.1)', color: '#0EA5A4', padding: '2px 6px', borderRadius: '4px' }}>{lead.category}</span>
                              <span className={`intent-badge ${lead.intent}`} style={{ fontSize: '0.65rem' }}>{lead.intent}</span>
                            </div>
                            
                            <p style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '4px' }}>{lead.address}</p>
                            
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.75rem' }}>
                              <span style={{ color: '#94A3B8' }}>⭐ {lead.rating} ({lead.reviewCount} reviews)</span>
                              {lead.phone && <span style={{ color: '#64748B' }}>Phone: <span style={{ color: '#94A3B8' }}>{lead.phone}</span></span>}
                              {lead.website && (
                                <a href={lead.website} target="_blank" rel="noreferrer" style={{ color: '#4DA3FF', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
                                  <span>Website</span>
                                  <ExternalLink size={8} />
                                </a>
                              )}
                            </div>

                            {/* Lead emails */}
                            {lead.emails && lead.emails.length > 0 && (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                                {lead.emails.map((eObj, idx) => (
                                  <span key={idx} style={{ color: '#0EA5A4', background: 'rgba(14, 165, 164, 0.08)', border: '1px solid rgba(14, 165, 164, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                    {eObj.email}
                                  </span>
                                ))}
                              </div>
                            )}

                            {lead.owner && (
                              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>CEO/Owner: <strong style={{ color: '#F8FAFC' }}>{lead.owner}</strong></p>
                            )}

                          </div>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              onClick={() => onViewDetails(lead)}
                              style={{
                                padding: '8px 12px',
                                background: 'rgba(148, 163, 184, 0.05)',
                                border: '1px solid rgba(148, 163, 184, 0.15)',
                                borderRadius: '6px',
                                color: '#F8FAFC',
                                fontSize: '0.775rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={12} style={{ color: '#0EA5A4' }} />
                              <span>Details & AI</span>
                            </button>

                            <button
                              disabled={isAdded || addingLeadId === lead.id}
                              onClick={() => handleAddToCRM(lead)}
                              style={{ 
                                padding: '8px 12px', 
                                background: isAdded ? 'rgba(34, 197, 94, 0.1)' : 'linear-gradient(135deg, #037172 0%, #0EA5A4 100%)', 
                                border: isAdded ? '1px solid rgba(34, 197, 94, 0.2)' : 'none', 
                                borderRadius: '6px', 
                                color: isAdded ? '#22C55E' : '#F8FAFC', 
                                fontSize: '0.775rem', 
                                fontWeight: '600', 
                                cursor: isAdded ? 'default' : 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px' 
                              }}
                            >
                              {isAdded ? (
                                <>
                                  <CheckCircle size={12} />
                                  <span>CRM synced</span>
                                </>
                              ) : (
                                <>
                                  {addingLeadId === lead.id ? (
                                    <span className="spinner" style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                                  ) : (
                                    <Plus style={{ marginTop: '-1px' }} size={12} />
                                  )}
                                  <span>Add Lead</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748B' }}>No businesses found in this scan record.</div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid rgba(148, 163, 184, 0.08)' }}>
              <button 
                onClick={() => handleExportCSV(selectedScan)}
                style={{ padding: '8px 16px', background: 'rgba(14, 165, 164, 0.15)', border: '1px solid rgba(14, 165, 164, 0.25)', borderRadius: '6px', color: '#0EA5A4', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                <span>Export Scan CSV</span>
              </button>
              <button 
                onClick={() => setSelectedScan(null)}
                style={{ padding: '8px 16px', background: 'rgba(148, 163, 184, 0.1)', border: 'none', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Lead Details Overlay Modal */}
      {activeLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10, 15, 28, 0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          
          <div className="data-card animate-fade-in" style={{ width: '100%', maxWidth: '650px', background: '#111827', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', padding: 0, overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#0EA5A4', fontWeight: '700', textTransform: 'uppercase' }}>Prospect Details & Enrichment</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F8FAFC', marginTop: '2px' }}>{activeLead.name}</h3>
              </div>
              <button 
                onClick={() => { setActiveLead(null); setGeneratedPitch(''); }}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(148, 163, 184, 0.08)', padding: '0 20px', background: 'rgba(10, 15, 28, 0.2)' }}>
              <button
                onClick={() => setActiveLeadTab('overview')}
                style={{
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeLeadTab === 'overview' ? '2px solid #0EA5A4' : '2px solid transparent',
                  color: activeLeadTab === 'overview' ? '#0EA5A4' : '#64748B',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Overview & AI Pitch
              </button>
              <button
                onClick={() => setActiveLeadTab('enrichment')}
                style={{
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeLeadTab === 'enrichment' ? '2px solid #0EA5A4' : '2px solid transparent',
                  color: activeLeadTab === 'enrichment' ? '#0EA5A4' : '#64748B',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Enrichment & Team
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {activeLeadTab === 'overview' && (
                <>
                  {/* Score section */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', background: 'rgba(10, 15, 28, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(148, 163, 184, 0.08)' }}>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0EA5A4' }}>{activeLead.aiScore || 50}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginTop: '2px' }}>AI Score</div>
                      <span className={`intent-badge ${activeLead.intent || 'UNSCORED'}`} style={{ marginTop: '8px', fontSize: '0.675rem' }}>{activeLead.intent || 'UNSCORED'} Intent</span>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#F8FAFC' }}>Intent Reasoning</h4>
                      <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '6px', lineHeight: '1.5' }}>{activeLead.reasoning || 'No details analyzed.'}</p>
                    </div>
                  </div>

                  {/* Pitch Creator */}
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#F8FAFC', marginBottom: '12px' }}>Generate Personalized Cold Outreach</h4>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <select 
                          value={pitchType}
                          onChange={(e) => setPitchType(e.target.value)}
                          style={{ width: '100%', padding: '10px', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none' }}
                        >
                          <option value="Website Redesign">Website Redesign</option>
                          <option value="Local SEO">Local SEO</option>
                          <option value="Review Growth">Review Growth</option>
                          <option value="Digital Marketing">Digital Marketing</option>
                          <option value="Chatbot Integration">Chatbot Integration</option>
                        </select>
                      </div>

                      <button
                        onClick={handleGeneratePitch}
                        disabled={generatingPitch}
                        style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #037172 0%, #0EA5A4 100%)', border: 'none', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {generatingPitch ? "Generating..." : "Generate Pitch"}
                      </button>
                    </div>

                    {generatedPitch && (
                      <div className="animate-fade-in" style={{ marginTop: '16px', background: 'rgba(10, 15, 28, 0.6)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.12)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                          <span style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Email Pitch Preview</span>
                          <button 
                            onClick={() => { navigator.clipboard.writeText(generatedPitch); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#0EA5A4', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            <Copy size={12} />
                            <span>{copySuccess ? 'Copied!' : 'Copy Email'}</span>
                          </button>
                        </div>
                        <pre style={{ padding: '16px', fontSize: '0.8rem', color: '#94A3B8', whiteSpace: 'pre-wrap', fontFamily: 'Inter, system-ui, sans-serif', margin: 0, maxHeight: '200px', overflowY: 'auto', lineHeight: '1.6' }}>
                          {generatedPitch}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeLeadTab === 'enrichment' && (
                <>
                  {/* Contact Email Section */}
                  <div style={{ background: 'rgba(24, 34, 51, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F8FAFC', textTransform: 'uppercase', tracking: '0.5px' }}>Contact Email</h4>
                      {activeLead.emails && activeLead.emails.length > 0 && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '2px 8px', borderRadius: '9999px', fontWeight: '700' }}>
                          Source: {activeLead.emails[0].source || "Google Maps"}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '8px', color: '#F8FAFC', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {activeLead.emails && activeLead.emails.length > 0 ? (
                          <>
                            <span style={{ fontWeight: '600' }}>{activeLead.emails[0].email}</span>
                            <span style={{ fontSize: '0.7rem', color: '#22C55E' }}>✔ Confidence: {activeLead.emails[0].confidence || '80%'}</span>
                          </>
                        ) : (
                          <span style={{ color: '#64748B' }}>No email revealed yet</span>
                        )}
                      </div>

                      <button
                        onClick={handleEnrichEmail}
                        disabled={enrichingEmail}
                        style={{ padding: '10px 16px', background: 'rgba(14, 165, 164, 0.15)', border: '1px solid rgba(14, 165, 164, 0.25)', borderRadius: '8px', color: '#0EA5A4', fontSize: '0.775rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {enrichingEmail ? (
                          <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(14, 165, 164, 0.3)', borderTopColor: '#0EA5A4', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        <span>Find Email</span>
                      </button>
                    </div>
                  </div>

                  {/* Team & Contacts Section */}
                  <div style={{ background: 'rgba(24, 34, 51, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F8FAFC', textTransform: 'uppercase', tracking: '0.5px' }}>Key Team & Contacts</h4>
                        {activeLead.contactsSource && (
                          <span style={{ display: 'inline-block', fontSize: '0.625rem', background: 'rgba(77, 163, 255, 0.1)', color: '#4DA3FF', padding: '1px 6px', borderRadius: '4px', marginTop: '2px', fontWeight: '700' }}>
                            Source: {activeLead.contactsSource.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={handleEnrichTeam}
                        disabled={enrichingTeam}
                        style={{ padding: '6px 12px', background: 'rgba(14, 165, 164, 0.15)', border: '1px solid rgba(14, 165, 164, 0.25)', borderRadius: '6px', color: '#0EA5A4', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {enrichingTeam ? (
                          <span className="spinner" style={{ width: '10px', height: '10px', border: '2px solid rgba(14, 165, 164, 0.3)', borderTopColor: '#0EA5A4', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        ) : (
                          <RefreshCw size={10} />
                        )}
                        <span>Find Team</span>
                      </button>
                    </div>

                    {activeLead.contacts && activeLead.contacts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activeLead.contacts.map((contact, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10, 15, 28, 0.4)', border: '1px solid rgba(148, 163, 184, 0.05)', padding: '10px 12px', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getRandomColor(contact.name), color: '#F8FAFC', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {getInitials(contact.name)}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ color: '#F8FAFC', fontSize: '0.8rem' }}>{contact.name}</strong>
                                  {contact.linkedin && (
                                    <a href={contact.linkedin} target="_blank" rel="noreferrer" style={{ color: '#4DA3FF', display: 'flex', alignItems: 'center' }} title="View LinkedIn profile">
                                      <Linkedin size={10} />
                                    </a>
                                  )}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginTop: '2px' }}>{contact.title}</span>
                              </div>
                            </div>

                            {contact.email && contact.email !== 'No Email Found' && contact.email !== 'Pending lookup' ? (
                              <button
                                onClick={() => { navigator.clipboard.writeText(contact.email); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}
                                style={{ background: 'rgba(14, 165, 164, 0.08)', border: '1px solid rgba(14, 165, 164, 0.15)', color: '#0EA5A4', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Click to copy email"
                              >
                                <Mail size={10} />
                                <span>Copy Email</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>No email found</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '14px 0', color: '#64748B', fontSize: '0.8rem' }}>No decision makers loaded. Click Find Team to identify contacts.</div>
                    )}
                  </div>
                </>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid rgba(148, 163, 184, 0.08)' }}>
              <button 
                onClick={() => { setActiveLead(null); setGeneratedPitch(''); }}
                style={{ padding: '8px 16px', background: 'rgba(148, 163, 184, 0.1)', border: 'none', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default MapsScans;
