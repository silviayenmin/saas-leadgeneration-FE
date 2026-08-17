import React, { useEffect, useState } from 'react';
import { 
  Building2, Mail, Phone, Sparkles, MapPin, Eye, 
  Trash2, X, Plus, Brain, Copy, CheckCircle2, ChevronRight,
  User, Linkedin, ExternalLink, Calendar, RefreshCw, Send, Check,
  Globe
} from 'lucide-react';
import api from '../services/api';
import './Pages.scss';

const OutreachPipeline = ({ onViewDetails }) => {
  const [board, setBoard] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Side Sheet Details Drawer
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'enrichment'
  
  // Edit Notes & Stage inside drawer
  const [notes, setNotes] = useState('');
  const [currentStage, setCurrentStage] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Outreach Pitch inside drawer
  const [pitchType, setPitchType] = useState('Website Redesign');
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [generatedPitch, setGeneratedPitch] = useState('');

  // Enrichment triggers loading states
  const [enrichingEmail, setEnrichingEmail] = useState(false);
  const [enrichingTeam, setEnrichingTeam] = useState(false);
  
  // General feedback messages
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success', 'info'

  const columns = [
    "Discovered",
    "Owner Identified",
    "Pitch Drafted",
    "Emailed",
    "Call Made",
    "Responded",
    "Closed Won"
  ];

  const fetchBoard = async () => {
    try {
      const res = await api.get('/pipeline/board');
      if (res.data.success) {
        setBoard(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch pipeline board:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Drag and Drop implementation
  const handleDragStart = (e, leadId, sourceStage) => {
    e.dataTransfer.setData("leadId", leadId);
    e.dataTransfer.setData("sourceStage", sourceStage);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    const sourceStage = e.dataTransfer.getData("sourceStage");

    if (sourceStage === targetStage) return;

    // Optimistic UI update
    setBoard((prev) => {
      const next = { ...prev };
      const leadIndex = next[sourceStage].findIndex(l => l.id === leadId);
      if (leadIndex !== -1) {
        const [movedLead] = next[sourceStage].splice(leadIndex, 1);
        movedLead.stage = targetStage;
        if (!next[targetStage]) next[targetStage] = [];
        next[targetStage].push(movedLead);
      }
      return next;
    });

    try {
      await api.post('/pipeline/update-stage', {
        leadId: leadId,
        stage: targetStage
      });
      triggerToast(`Lead moved to ${targetStage}`);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update lead stage", "error");
      fetchBoard(); // Revert to server state on error
    }
  };

  // Select Lead Details Drawer
  const handleSelectLead = (lead) => {
    onViewDetails(lead);
  };

  const handleSaveNotesAndStage = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      await api.post('/pipeline/update-stage', {
        leadId: selectedLead.id,
        stage: currentStage,
        notes: notes
      });

      // Update board UI state inline
      setBoard((prev) => {
        const next = { ...prev };
        // Remove from old location if stage changed
        if (selectedLead.stage !== currentStage) {
          const oldIndex = next[selectedLead.stage].findIndex(l => l.id === selectedLead.id);
          if (oldIndex !== -1) {
            next[selectedLead.stage].splice(oldIndex, 1);
          }
          const updatedLead = { ...selectedLead, stage: currentStage, notes: notes };
          if (!next[currentStage]) next[currentStage] = [];
          next[currentStage].push(updatedLead);
          setSelectedLead(updatedLead);
        } else {
          // Just update notes in-place
          const idx = next[selectedLead.stage].findIndex(l => l.id === selectedLead.id);
          if (idx !== -1) {
            next[selectedLead.stage][idx].notes = notes;
            setSelectedLead(next[selectedLead.stage][idx]);
          }
        }
        return next;
      });

      triggerToast("Lead details updated successfully");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save lead updates", "error");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleGeneratePitch = async () => {
    if (!selectedLead) return;
    setGeneratingPitch(true);
    setGeneratedPitch('');
    try {
      const res = await api.post('/ai/pitch', {
        businessId: selectedLead.businessId,
        pitchType: pitchType
      });
      if (res.data.success) {
        setGeneratedPitch(res.data.pitch);
        
        // Save pitch to notes database
        await api.post('/pipeline/update-stage', {
          leadId: selectedLead.id,
          stage: selectedLead.stage,
          notes: selectedLead.notes
        });

        triggerToast("AI outreach pitch generated!");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to generate outreach pitch.", "error");
    } finally {
      setGeneratingPitch(false);
    }
  };

  // Run email enrichment fallback chain
  const handleEnrichEmail = async () => {
    if (!selectedLead) return;
    setEnrichingEmail(true);
    try {
      const res = await api.post(`/enrichment/reveal-email?business_id=${selectedLead.businessId}`);
      if (res.data.success) {
        const enrichedData = res.data.data;
        
        // Update local selectedLead business snapshot
        setSelectedLead((prev) => {
          const next = { ...prev };
          next.business = {
            ...next.business,
            emails: enrichedData.emails,
            owner: enrichedData.owner,
            websiteIntelligence: enrichedData.websiteIntelligence
          };
          return next;
        });

        // Trigger updates in board list state
        setBoard((prev) => {
          const next = { ...prev };
          const idx = next[selectedLead.stage].findIndex(l => l.id === selectedLead.id);
          if (idx !== -1) {
            next[selectedLead.stage][idx].business.emails = enrichedData.emails;
            next[selectedLead.stage][idx].business.owner = enrichedData.owner;
            next[selectedLead.stage][idx].business.websiteIntelligence = enrichedData.websiteIntelligence;
          }
          return next;
        });

        triggerToast(enrichedData.emails?.length > 0 ? "B2B emails identified!" : "No emails found in enrichment records.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Email enrichment lookup failed.", "error");
    } finally {
      setEnrichingEmail(false);
    }
  };

  // Run team lookup enrichment
  const handleEnrichTeam = async () => {
    if (!selectedLead) return;
    setEnrichingTeam(true);
    try {
      const res = await api.post(`/enrichment/find-team?business_id=${selectedLead.businessId}`);
      if (res.data.success) {
        const enrichedData = res.data.data;
        
        setSelectedLead((prev) => {
          const next = { ...prev };
          next.business = {
            ...next.business,
            contacts: enrichedData.contacts,
            contactsSource: enrichedData.contactsSource,
            emails: enrichedData.emails
          };
          return next;
        });

        setBoard((prev) => {
          const next = { ...prev };
          const idx = next[selectedLead.stage].findIndex(l => l.id === selectedLead.id);
          if (idx !== -1) {
            next[selectedLead.stage][idx].business.contacts = enrichedData.contacts;
            next[selectedLead.stage][idx].business.contactsSource = enrichedData.contactsSource;
            next[selectedLead.stage][idx].business.emails = enrichedData.emails;
          }
          return next;
        });

        triggerToast(enrichedData.contacts?.length > 0 ? "Decision makers list populated!" : "No team contacts discovered.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Team enrichment lookup failed.", "error");
    } finally {
      setEnrichingTeam(false);
    }
  };

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

  if (loading) {
    return <div className="page-container"><p style={{ color: '#94A3B8' }}>Loading CRM Pipeline Board...</p></div>;
  }

  return (
    <div className="page-container animate-fade-in" style={{ height: 'calc(100vh - 70px)', overflow: 'hidden', paddingBottom: '0' }}>
      
      {/* Board Scrollable columns container */}
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', flex: 1, height: '100%', paddingBottom: '24px', alignItems: 'flex-start' }}>
        {columns.map((col) => {
          const colLeads = board[col] || [];
          return (
            <div 
              key={col} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col)}
              style={{ flexShrink: 0, width: '280px', background: 'rgba(24, 34, 51, 0.4)', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.08)', display: 'flex', flexDirection: 'column', maxHeight: '100%', overflowY: 'hidden' }}
            >
              
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#F8FAFC' }}>{col}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(14, 165, 164, 0.1)', color: '#0EA5A4', padding: '2px 6px', borderRadius: '4px' }}>{colLeads.length}</span>
              </div>

              {/* Column Body Cards Scrollable */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, minHeight: '150px' }}>
                {colLeads.length > 0 ? (
                  colLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id, col)}
                      onClick={() => handleSelectLead(lead)}
                      style={{ background: 'rgba(24, 34, 51, 0.8)', border: '1px solid rgba(148, 163, 184, 0.08)', borderRadius: '8px', padding: '14px', cursor: 'pointer', transition: 'all 0.2s ease', hover: { border: '1px solid rgba(14, 165, 164, 0.3)' } }}
                    >
                      <span style={{ fontSize: '0.65rem', color: '#0EA5A4', fontWeight: '700', textTransform: 'uppercase' }}>{lead.business.category}</span>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#F8FAFC', marginTop: '2px', lineHeight: '1.4' }}>{lead.business.name}</h4>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.75rem', color: '#94A3B8' }}>
                        <span>⭐ {lead.business.rating}</span>
                        <span>({lead.business.reviewCount})</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', pt: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.05)' }}>
                        <span className={`intent-badge ${lead.business.intent || 'UNSCORED'}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                          {lead.business.intent || 'UNSCORED'}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '6px', color: '#64748B' }}>
                          {lead.business.website && <Globe size={12} title="Website present" />}
                          {lead.business.emails && lead.business.emails.length > 0 && <Mail size={12} title="Email scraped" style={{ color: '#0EA5A4' }} />}
                        </div>
                      </div>

                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748B', fontSize: '0.75rem', border: '1px dashed rgba(148, 163, 184, 0.05)', borderRadius: '8px' }}>Drag cards here</div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Slide-over CRM Drawer Details (Right-side sheet) */}
      {selectedLead && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '460px', height: '100vh', background: '#111827', borderLeft: '1px solid rgba(148, 163, 184, 0.15)', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', flexDirection: 'column', animation: 'slide-left 0.25s ease-out' }}>
          
          {/* Drawer Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#0EA5A4', fontWeight: '700', textTransform: 'uppercase' }}>CRM Outbound Prospect</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F8FAFC', marginTop: '2px' }}>{selectedLead.business.name}</h3>
            </div>
            <button 
              onClick={() => setSelectedLead(null)}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Tabs Navigation */}
          <div style={{ display: 'flex', padding: '0 20px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
            <button 
              onClick={() => setActiveTab('overview')}
              style={{ padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid #0EA5A4' : '2px solid transparent', color: activeTab === 'overview' ? '#F8FAFC' : '#64748B', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Overview & Outreach
            </button>
            <button 
              onClick={() => setActiveTab('enrichment')}
              style={{ padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'enrichment' ? '2px solid #0EA5A4' : '2px solid transparent', color: activeTab === 'enrichment' ? '#F8FAFC' : '#64748B', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Enrichment & Team
            </button>
          </div>

          {/* Drawer Scrollable Body Content */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {activeTab === 'overview' && (
              <>
                {/* Score & General Details */}
                <div style={{ background: 'rgba(24, 34, 51, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className={`intent-badge ${selectedLead.business.intent}`} style={{ fontSize: '0.65rem' }}>{selectedLead.business.intent}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>AI Score: <strong style={{ color: '#F8FAFC' }}>{selectedLead.business.aiScore}/100</strong></span>
                    </div>
                    {selectedLead.business.website && (
                      <a href={selectedLead.business.website} target="_blank" rel="noreferrer" style={{ color: '#4DA3FF', textDecoration: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Open Site</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '10px', lineHeight: '1.4' }}>
                    {selectedLead.business.reasoning || "Reasoning evaluation pending."}
                  </p>
                </div>

                {/* Pipeline Stage dropdown & Notes Card */}
                <div style={{ background: 'rgba(24, 34, 51, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F8FAFC', textTransform: 'uppercase', tracking: '0.5px' }}>CRM Action & Notes</h4>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', marginBottom: '4px' }}>Prospect Stage</label>
                    <select 
                      value={currentStage}
                      onChange={(e) => setCurrentStage(e.target.value)}
                      style={{ width: '100%', padding: '8px', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.8rem' }}
                    >
                      {columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', marginBottom: '4px' }}>Internal Notes</label>
                    <textarea 
                      rows="3"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter follow up details, feedback, next call schedule..."
                      style={{ width: '100%', padding: '10px', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.8rem', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    onClick={handleSaveNotesAndStage}
                    disabled={savingNotes}
                    style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #037172 0%, #0EA5A4 100%)', border: 'none', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.775rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {savingNotes ? "Saving..." : "Save Prospect Details"}
                  </button>
                </div>

                {/* Pitch Generator Outreach Section */}
                <div style={{ background: 'rgba(24, 34, 51, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F8FAFC', textTransform: 'uppercase', tracking: '0.5px' }}>Outbound Pitch Generator</h4>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select 
                      value={pitchType}
                      onChange={(e) => setPitchType(e.target.value)}
                      style={{ flex: 1, padding: '8px', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.8rem' }}
                    >
                      <option value="Website Redesign">Website Redesign</option>
                      <option value="Local SEO">Local SEO</option>
                      <option value="Review Growth">Review Growth</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Chatbot Integration">Chatbot Integration</option>
                    </select>

                    <button
                      onClick={handleGeneratePitch}
                      disabled={generatingPitch}
                      style={{ padding: '8px 12px', background: 'rgba(14, 165, 164, 0.15)', border: '1px solid rgba(14, 165, 164, 0.25)', borderRadius: '6px', color: '#0EA5A4', fontSize: '0.775rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {generatingPitch ? "Building..." : "Generate"}
                    </button>
                  </div>

                  {generatedPitch && (
                    <div style={{ background: 'rgba(10, 15, 28, 0.5)', borderRadius: '6px', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid rgba(148, 163, 184, 0.05)' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: '700' }}>AI Outreach Copy</span>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(generatedPitch); triggerToast("Copied outreach text!"); }}
                          style={{ background: 'transparent', border: 'none', color: '#0EA5A4', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Copy
                        </button>
                      </div>
                      <pre style={{ padding: '12px', margin: 0, fontSize: '0.75rem', color: '#94A3B8', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', fontFamily: 'Inter' }}>
                        {generatedPitch}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'enrichment' && (
              <>
                {/* SaaS Contact Email Card */}
                <div style={{ background: 'rgba(24, 34, 51, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F8FAFC', textTransform: 'uppercase', tracking: '0.5px' }}>Contact Email</h4>
                    {selectedLead.business.emails && selectedLead.business.emails.length > 0 && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '2px 8px', borderRadius: '9999px', fontWeight: '700' }}>
                        Source: {selectedLead.business.emails[0].source || "Google Maps"}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '8px', color: '#F8FAFC', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {selectedLead.business.emails && selectedLead.business.emails.length > 0 ? (
                        <>
                          <span style={{ fontWeight: '600' }}>{selectedLead.business.emails[0].email}</span>
                          <span style={{ fontSize: '0.7rem', color: '#22C55E' }}>✔ Confidence: {selectedLead.business.emails[0].confidence || '80%'}</span>
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

                {/* SaaS Key Team & Contacts Table Card */}
                <div style={{ background: 'rgba(24, 34, 51, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F8FAFC', textTransform: 'uppercase', tracking: '0.5px' }}>Key Team & Contacts</h4>
                      {selectedLead.business.contactsSource && (
                        <span style={{ display: 'inline-block', fontSize: '0.625rem', background: 'rgba(77, 163, 255, 0.1)', color: '#4DA3FF', padding: '1px 6px', borderRadius: '4px', marginTop: '2px', fontWeight: '700' }}>
                          Source: {selectedLead.business.contactsSource.toUpperCase()}
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

                  {selectedLead.business.contacts && selectedLead.business.contacts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedLead.business.contacts.map((contact, idx) => (
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
                              onClick={() => { navigator.clipboard.writeText(contact.email); triggerToast(`Copied ${contact.name}'s email!`); }}
                              style={{ background: 'rgba(14, 165, 164, 0.08)', border: '1px solid rgba(14, 165, 164, 0.15)', color: '#0EA5A4', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Click to copy email"
                            >
                              <Mail size={10} />
                              <span>Copy Email</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>No Email</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px 0', border: '1px dashed rgba(148, 163, 184, 0.1)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <User size={24} style={{ color: '#64748B' }} />
                      <p style={{ fontSize: '0.775rem', color: '#64748B', margin: 0 }}>No team contacts resolved.</p>
                      <button 
                        onClick={handleEnrichTeam}
                        disabled={enrichingTeam}
                        style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #037172 0%, #0EA5A4 100%)', border: 'none', borderRadius: '4px', color: '#F8FAFC', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        🚀 Enrich Key Contacts
                      </button>
                    </div>
                  )}

                </div>
              </>
            )}

          </div>

        </div>
      )}

      {/* Global Toast Alert */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: toastType === 'error' ? '#EF4444' : '#22C55E', color: '#0A0F1C', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 1001, display: 'flex', alignItems: 'center', gap: '8px', animation: 'slide-in 0.2s ease-out' }}>
          {toastType === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
};

export default OutreachPipeline;
