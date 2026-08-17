import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Building2, MapPin, Phone, Globe, Mail, 
  CheckCircle, Plus, Brain, Copy, RefreshCw, Star, 
  Calendar, MessageSquare, Briefcase, FileText, ChevronRight, ChevronLeft,
  TrendingUp, Compass, Target, Clock, ShieldAlert, Award,
  Linkedin, Search, Users
} from 'lucide-react';
import api from '../services/api';
import './Pages.scss';

const LeadDetails = ({ lead, onBack }) => {
  const [activeLead, setActiveLead] = useState(lead);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'enrichment', 'pitch'
  
  // Notes and Stage
  const [notes, setNotes] = useState(lead.notes || '');
  const [stage, setStage] = useState(lead.stage || 'Discovered');
  const [savingDetails, setSavingDetails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Enrichment triggers
  const [enrichingEmail, setEnrichingEmail] = useState(false);
  const [enrichingTeam, setEnrichingTeam] = useState(false);

  // AI pitch generation
  const [pitchType, setPitchType] = useState('Website Redesign');
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [generatedPitch, setGeneratedPitch] = useState(activeLead.pitch || '');
  const [copySuccess, setCopySuccess] = useState(false);

  // CRM add state if loaded from scan results directly (not in CRM yet)
  const [crmLeadId, setCrmLeadId] = useState(lead.leadId || (lead.stage ? lead.id : null));
  const [isInCrm, setIsInCrm] = useState(!!lead.stage);
  const [addingToCrm, setAddingToCrm] = useState(false);

  // Pagination for contacts table
  const [currentContactsPage, setCurrentContactsPage] = useState(1);
  const contactsPerPage = 10;

  useEffect(() => {
    setCurrentContactsPage(1);
  }, [lead]);

  // Helper to extract true Business ID regardless of whether lead is CRM record or raw Business
  const getBusinessId = () => activeLead.businessId || activeLead.business?.id || activeLead.id;

  // Avatars
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getRandomColor = (name) => {
    if (!name) return '#0EA5A4';
    const colors = [
      '#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', 
      '#F473B9', '#8C30F5', '#FF7F3F', '#00D1FF'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  // Sync to database
  const handleSaveDetails = async () => {
    if (!isInCrm || !crmLeadId) {
      alert("Please add this lead to CRM first to update stage and notes.");
      return;
    }
    setSavingDetails(true);
    setSaveSuccess(false);
    try {
      const res = await api.post('/pipeline/update-stage', {
        leadId: crmLeadId,
        stage: stage,
        notes: notes
      });
      if (res.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        // Update local state
        setActiveLead(prev => ({
          ...prev,
          stage: stage,
          notes: notes
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update lead details.");
    } finally {
      setSavingDetails(false);
    }
  };

  // Add to CRM pipeline
  const handleAddToCRM = async () => {
    setAddingToCrm(true);
    try {
      const targetBizId = getBusinessId();
      const res = await api.post(`/leads/add?business_id=${targetBizId}`);
      if (res.data.success) {
        const leadData = res.data.data;
        setCrmLeadId(leadData.id);
        setIsInCrm(true);
        setStage(leadData.stage || 'Discovered');
        setNotes(leadData.notes || '');
        setActiveLead(prev => ({
          ...prev,
          ...leadData
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add lead to CRM.");
    } finally {
      setAddingToCrm(false);
    }
  };

  // Email enrichment trigger
  const handleEnrichEmail = async () => {
    setEnrichingEmail(true);
    try {
      const targetBizId = getBusinessId();
      const res = await api.post(`/enrichment/reveal-email?business_id=${targetBizId}`);
      if (res.data.success) {
        const enriched = res.data.data;
        const updatedBiz = {
          ...(activeLead.business || activeLead),
          emails: enriched.emails,
          owner: enriched.owner,
          websiteIntelligence: enriched.websiteIntelligence,
          socialLinks: enriched.socialLinks || (activeLead.business || activeLead).socialLinks
        };
        setActiveLead(prev => ({
          ...prev,
          business: prev.business ? updatedBiz : undefined,
          ...(!prev.business ? updatedBiz : {})
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to enrich emails.");
    } finally {
      setEnrichingEmail(false);
    }
  };

  // Team enrichment trigger
  const handleEnrichTeam = async () => {
    setEnrichingTeam(true);
    try {
      const targetBizId = getBusinessId();
      const biz = activeLead.business || activeLead;
      const sourceUrl = biz.website || biz.placeId || "";
      
      let res;
      if (sourceUrl) {
        res = await api.post(`/enrich-team`, { sourceUrl });
      } else {
        res = await api.post(`/enrichment/find-team?business_id=${targetBizId}`);
      }
      
      const success = res.data.status === "success" || res.data.success;
      if (success) {
        const enriched = res.data.data || res.data;
        const keyContacts = enriched.keyContacts || enriched.contacts || [];
        const keyContactsSource = enriched.keyContactsSource || enriched.contactsSource || "none";
        
        const updatedBiz = {
          ...(activeLead.business || activeLead),
          name: enriched.companyName || (activeLead.business || activeLead).name,
          category: enriched.industry || (activeLead.business || activeLead).category,
          address: enriched.location || (activeLead.business || activeLead).address,
          contacts: keyContacts,
          contactsSource: keyContactsSource,
          emails: enriched.emails || (activeLead.business || activeLead).emails,
          socialLinks: enriched.socialLinks || (activeLead.business || activeLead).socialLinks,
          websiteIntelligence: {
            ...((activeLead.business || activeLead).websiteIntelligence || {}),
            foundedYear: enriched.foundedYear || (activeLead.business || activeLead).websiteIntelligence?.foundedYear,
            employeeCount: enriched.employeeCount || (activeLead.business || activeLead).websiteIntelligence?.employeeCount,
            annualRevenue: enriched.annualRevenue || (activeLead.business || activeLead).websiteIntelligence?.annualRevenue,
            totalFunding: enriched.totalFunding || (activeLead.business || activeLead).websiteIntelligence?.totalFunding
          }
        };
        setActiveLead(prev => ({
          ...prev,
          business: prev.business ? updatedBiz : undefined,
          ...(!prev.business ? updatedBiz : {})
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to enrich team contacts.");
    } finally {
      setEnrichingTeam(false);
    }
  };

  // AI pitch generation trigger
  const handleGeneratePitch = async () => {
    setGeneratingPitch(true);
    setGeneratedPitch('');
    try {
      const targetBizId = getBusinessId();
      const res = await api.post('/ai/pitch', {
        businessId: targetBizId,
        pitchType: pitchType
      });
      if (res.data.success) {
        const pitchText = res.data.data.pitch;
        setGeneratedPitch(pitchText);
        // Persist pitch back to lead record if inside CRM
        if (isInCrm && crmLeadId) {
          await api.post('/pipeline/update-stage', {
            leadId: crmLeadId,
            stage: stage,
            notes: notes
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate outreach pitch.");
    } finally {
      setGeneratingPitch(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const business = activeLead?.business || activeLead || {};
  const emails = business.emails || [];
  const contacts = business.contacts || [];

  const indexOfLastContact = currentContactsPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = contacts.slice(indexOfFirstContact, indexOfLastContact);
  const totalContactsPages = Math.ceil(contacts.length / contactsPerPage);

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', animation: 'slide-in 0.4s ease-out' }}>
      
      {/* Header and Back Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <button 
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.9rem', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.target.style.color = '#F8FAFC'}
          onMouseLeave={(e) => e.target.style.color = '#94A3B8'}
        >
          <ArrowLeft size={16} />
          <span>Back to list</span>
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          {!isInCrm ? (
            <button
              onClick={handleAddToCRM}
              disabled={addingToCrm}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #037172 0%, #0EA5A4 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(14, 165, 164, 0.3)'
              }}
            >
              {addingToCrm ? (
                <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              ) : (
                <Plus size={16} />
              )}
              <span>Add to Outreach CRM</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '6px 16px', borderRadius: '8px', color: '#22C55E', fontSize: '0.85rem', fontWeight: '700' }}>
              <CheckCircle size={14} />
              <span>Active CRM Lead</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div style={{ background: 'linear-gradient(145deg, rgba(16, 24, 48, 0.8) 0%, rgba(10, 15, 30, 0.9) 100%)', border: '1px solid rgba(148, 163, 184, 0.08)', borderRadius: '16px', padding: '28px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(14, 165, 164, 0.1)', border: '1px solid rgba(14, 165, 164, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0EA5A4' }}>
            <Building2 size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#F8FAFC', margin: 0, letterSpacing: '-0.5px' }}>{business.name}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '0.75rem', background: 'rgba(148, 163, 184, 0.1)', color: '#94A3B8', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>{business.category}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '0.8rem' }}>
                <MapPin size={12} />
                <span>{business.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Strip */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {business.phone && (
            <a href={`tel:${business.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(148, 163, 184, 0.04)', border: '1px solid rgba(148, 163, 184, 0.08)', padding: '10px 16px', borderRadius: '10px', color: '#F8FAFC', textDecoration: 'none', fontSize: '0.85rem' }}>
              <Phone size={14} style={{ color: '#0EA5A4' }} />
              <span>{business.phone}</span>
            </a>
          )}
          {business.website && (
            <a href={business.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(148, 163, 184, 0.04)', border: '1px solid rgba(148, 163, 184, 0.08)', padding: '10px 16px', borderRadius: '10px', color: '#F8FAFC', textDecoration: 'none', fontSize: '0.85rem' }}>
              <Globe size={14} style={{ color: '#0EA5A4' }} />
              <span>{business.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
            </a>
          )}
          {business.socialLinks?.linkedin && (
            <a href={business.socialLinks.linkedin} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(14, 165, 164, 0.05)', border: '1px solid rgba(14, 165, 164, 0.15)', padding: '10px 16px', borderRadius: '10px', color: '#F8FAFC', textDecoration: 'none', fontSize: '0.85rem' }}>
              <Linkedin size={14} style={{ color: '#0EA5A4' }} />
              <span>LinkedIn Page</span>
            </a>
          )}
        </div>
      </div>

      {/* Grid Dashboard Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '24px' }}>
        
        {/* Left Column: Details & Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Tabs Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
            <button 
              onClick={() => setActiveTab('overview')}
              style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid #0EA5A4' : '2px solid transparent', color: activeTab === 'overview' ? '#0EA5A4' : '#64748B', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Overview & AI Strategy
            </button>
            <button 
              onClick={() => setActiveTab('enrichment')}
              style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'enrichment' ? '2px solid #0EA5A4' : '2px solid transparent', color: activeTab === 'enrichment' ? '#0EA5A4' : '#64748B', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Enrichment Hub
            </button>
            <button 
              onClick={() => setActiveTab('pitch')}
              style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'pitch' ? '2px solid #0EA5A4' : '2px solid transparent', color: activeTab === 'pitch' ? '#0EA5A4' : '#64748B', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              AI Pitch Generator
            </button>
          </div>

          {/* TAB CONTENT: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Scoring & Intent Card */}
              <div style={{ background: 'rgba(20, 26, 46, 0.4)', border: '1px solid rgba(148, 163, 184, 0.08)', borderRadius: '12px', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(148, 163, 184, 0.08)', paddingRight: '24px' }}>
                  <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(14, 165, 164, 0.05)', border: '4px solid rgba(14, 165, 164, 0.1)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0EA5A4' }}>{business.aiScore || 50}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '700', marginTop: '12px', tracking: '0.5px' }}>AI Lead Score</span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94A3B8', fontWeight: '700' }}>Buying Intent:</span>
                    <span className={`intent-badge ${business.intent || 'UNSCORED'}`}>
                      {business.intent || 'UNSCORED'}
                    </span>
                  </div>

                  <h3 style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: '700', marginTop: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Brain size={14} style={{ color: '#0EA5A4' }} />
                    <span>AI Qualification Analysis</span>
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                    {business.reasoning || "No AI intent classification reasoning generated. Run custom campaigns to score leads."}
                  </p>
                </div>
              </div>

              {/* Website Intelligence Data */}
              <div style={{ background: 'rgba(20, 26, 46, 0.4)', border: '1px solid rgba(148, 163, 184, 0.08)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} style={{ color: '#0EA5A4' }} />
                  <span>Company Intel & Signals</span>
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'rgba(10, 15, 28, 0.4)', border: '1px solid rgba(148, 163, 184, 0.05)', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.725rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Founded Year</span>
                    <strong style={{ display: 'block', fontSize: '1.1rem', color: '#F8FAFC', marginTop: '6px' }}>
                      {business.websiteIntelligence?.foundedYear || 'Not Available'}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(10, 15, 28, 0.4)', border: '1px solid rgba(148, 163, 184, 0.05)', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.725rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Employee Count</span>
                    <strong style={{ display: 'block', fontSize: '1.1rem', color: '#F8FAFC', marginTop: '6px' }}>
                      {business.websiteIntelligence?.employeeCount || 'Not Available'}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(10, 15, 28, 0.4)', border: '1px solid rgba(148, 163, 184, 0.05)', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.725rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Estimated Revenue</span>
                    <strong style={{ display: 'block', fontSize: '1.1rem', color: '#F8FAFC', marginTop: '6px' }}>
                      {business.websiteIntelligence?.annualRevenue || 'Not Available'}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(10, 15, 28, 0.4)', border: '1px solid rgba(148, 163, 184, 0.05)', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.725rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Total Funding</span>
                    <strong style={{ display: 'block', fontSize: '1.1rem', color: '#F8FAFC', marginTop: '6px' }}>
                      {business.websiteIntelligence?.totalFunding || 'Not Available'}
                    </strong>
                  </div>
                </div>

                {business.websiteIntelligence?.description && (
                  <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(10, 15, 28, 0.3)', borderRadius: '8px', borderLeft: '3px solid #0EA5A4' }}>
                    <span style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Meta Description</span>
                    <p style={{ color: '#94A3B8', fontSize: '0.825rem', lineHeight: '1.4', margin: 0 }}>{business.websiteIntelligence.description}</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB CONTENT: ENRICHMENT HUB */}
          {activeTab === 'enrichment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Key Team & Contacts Table Widget */}
              <div style={{ background: 'rgba(20, 26, 46, 0.4)', border: '1px solid rgba(148, 163, 184, 0.08)', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                      Key Team & Contacts
                    </h3>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(14, 165, 164, 0.1)', color: '#0EA5A4', border: '1px solid rgba(14, 165, 164, 0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      Source: {business.contactsSource || 'Serper'}
                    </span>
                  </div>

                  <button
                    onClick={handleEnrichTeam}
                    disabled={enrichingTeam}
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(148, 163, 184, 0.05)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {enrichingTeam ? (
                      <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    ) : (
                      <Users size={14} style={{ color: '#94A3B8' }} />
                    )}
                    <span>Find Team</span>
                  </button>
                </div>

                {contacts.length > 0 ? (
                  <div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
                            <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Name</th>
                            <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Title</th>
                            <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Email</th>
                            <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentContacts.map((contact, idx) => {
                            const hasEmail = contact.email && contact.email !== 'No Email Found' && contact.email !== 'Pending lookup';
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
                                <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#F8FAFC', fontWeight: '700' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{contact.name}</span>
                                    {contact.linkedin && (
                                      <a 
                                        href={contact.linkedin} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        style={{ color: '#0A66C2', display: 'inline-flex', alignItems: 'center' }} 
                                        title="View LinkedIn Profile"
                                      >
                                        <Linkedin size={14} fill="#0A66C2" style={{ strokeWidth: 1 }} />
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#94A3B8' }}>
                                  {contact.title || 'No Title Found'}
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>
                                  {hasEmail ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ color: '#0EA5A4', fontWeight: '600' }}>{contact.email}</span>
                                      <button
                                        onClick={() => copyToClipboard(contact.email)}
                                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', display: 'inline-flex' }}
                                        title="Copy Email"
                                      >
                                        <Copy size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <span style={{ color: '#64748B', fontStyle: 'italic' }}>
                                      {contact.email || 'Pending lookup'}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: (contact.source || 'Apollo B2B').toLowerCase().includes('serper') || (contact.source || 'Apollo B2B').toLowerCase().includes('gemini') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(14, 165, 164, 0.1)',
                                    color: (contact.source || 'Apollo B2B').toLowerCase().includes('serper') || (contact.source || 'Apollo B2B').toLowerCase().includes('gemini') ? '#F59E0B' : '#0EA5A4',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {contact.source || 'Apollo B2B'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalContactsPages > 1 && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginTop: '20px', 
                        paddingTop: '16px', 
                        borderTop: '1px solid rgba(148, 163, 184, 0.08)' 
                      }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                          Showing <span style={{ color: '#94A3B8', fontWeight: '600' }}>{indexOfFirstContact + 1}</span> to <span style={{ color: '#94A3B8', fontWeight: '600' }}>{Math.min(indexOfLastContact, contacts.length)}</span> of <span style={{ color: '#94A3B8', fontWeight: '600' }}>{contacts.length}</span> contacts
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => setCurrentContactsPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentContactsPage === 1}
                            style={{
                              background: 'rgba(20, 26, 46, 0.6)',
                              border: '1px solid rgba(148, 163, 184, 0.1)',
                              borderRadius: '6px',
                              color: currentContactsPage === 1 ? '#475569' : '#94A3B8',
                              padding: '6px 10px',
                              cursor: currentContactsPage === 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              transition: 'all 0.2s',
                              opacity: currentContactsPage === 1 ? 0.5 : 1
                            }}
                          >
                            <ChevronLeft size={14} />
                            <span>Prev</span>
                          </button>
                          
                          {Array.from({ length: totalContactsPages }, (_, i) => i + 1).map(pageNum => (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentContactsPage(pageNum)}
                              style={{
                                background: currentContactsPage === pageNum ? 'linear-gradient(135deg, #037172 0%, #0EA5A4 100%)' : 'rgba(20, 26, 46, 0.6)',
                                border: '1px solid ' + (currentContactsPage === pageNum ? '#0EA5A4' : 'rgba(148, 163, 184, 0.1)'),
                                borderRadius: '6px',
                                color: currentContactsPage === pageNum ? '#F8FAFC' : '#94A3B8',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: currentContactsPage === pageNum ? '700' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: currentContactsPage === pageNum ? '0 0 8px rgba(14, 165, 164, 0.4)' : 'none'
                              }}
                            >
                              {pageNum}
                            </button>
                          ))}

                          <button
                            onClick={() => setCurrentContactsPage(prev => Math.min(prev + 1, totalContactsPages))}
                            disabled={currentContactsPage === totalContactsPages}
                            style={{
                              background: 'rgba(20, 26, 46, 0.6)',
                              border: '1px solid rgba(148, 163, 184, 0.1)',
                              borderRadius: '6px',
                              color: currentContactsPage === totalContactsPages ? '#475569' : '#94A3B8',
                              padding: '6px 10px',
                              cursor: currentContactsPage === totalContactsPages ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              transition: 'all 0.2s',
                              opacity: currentContactsPage === totalContactsPages ? 0.5 : 1
                            }}
                          >
                            <span>Next</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0', border: '1px dashed rgba(148, 163, 184, 0.12)', borderRadius: '8px', color: '#64748B', fontSize: '0.85rem' }}>
                    No key contacts identified yet. Click "Find Team" to search LinkedIn/Serper records.
                  </div>
                )}
              </div>

              {/* Contact Email Input Card */}
              <div style={{ background: 'rgba(20, 26, 46, 0.4)', border: '1px solid rgba(148, 163, 184, 0.08)', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                      Contact Email
                    </h3>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(14, 165, 164, 0.1)', color: '#0EA5A4', border: '1px solid rgba(14, 165, 164, 0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      Source: {emails[0]?.source || 'Google_maps_crawl'}
                    </span>
                  </div>

                  <button
                    onClick={handleEnrichEmail}
                    disabled={enrichingEmail}
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(148, 163, 184, 0.05)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {enrichingEmail ? (
                      <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    ) : (
                      <Search size={14} style={{ color: '#94A3B8' }} />
                    )}
                    <span>Find Email</span>
                  </button>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value={emails[0]?.email || 'No email revealed yet'}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(10, 15, 28, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      borderRadius: '8px',
                      color: emails[0]?.email ? '#F8FAFC' : '#64748B',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      outline: 'none',
                      letterSpacing: '0.2px'
                    }}
                  />
                  {emails[0]?.email && (
                    <button
                      onClick={() => copyToClipboard(emails[0].email)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        padding: '6px 12px',
                        background: 'rgba(14, 165, 164, 0.12)',
                        border: '1px solid rgba(14, 165, 164, 0.25)',
                        borderRadius: '6px',
                        color: '#0EA5A4',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(14, 165, 164, 0.25)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(14, 165, 164, 0.12)'}
                    >
                      <Copy size={12} />
                      <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: AI PITCH GENERATOR */}
          {activeTab === 'pitch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'rgba(20, 26, 46, 0.4)', border: '1px solid rgba(148, 163, 184, 0.08)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={16} style={{ color: '#0EA5A4' }} />
                  <span>Outbound Pitch Generator</span>
                </h3>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <select 
                    value={pitchType} 
                    onChange={(e) => setPitchType(e.target.value)}
                    style={{ flex: 1, padding: '10px 14px', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '8px', color: '#F8FAFC', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    <option value="Website Redesign">Website Redesign Proposal</option>
                    <option value="Local SEO">Local SEO Growth Pitch</option>
                    <option value="Review Growth">Google Reviews/Reputation Campaign</option>
                    <option value="Digital Marketing">Full Suite Digital Marketing</option>
                    <option value="Chatbot">AI Voice & Chatbot Integration</option>
                  </select>

                  <button
                    onClick={handleGeneratePitch}
                    disabled={generatingPitch}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #037172 0%, #0EA5A4 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {generatingPitch ? (
                      <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    ) : (
                      <Star size={14} />
                    )}
                    <span>Generate Pitch</span>
                  </button>
                </div>

                {generatedPitch ? (
                  <div style={{ position: 'relative', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '8px', padding: '16px' }}>
                    <button
                      onClick={() => copyToClipboard(generatedPitch)}
                      style={{ position: 'absolute', top: '12px', right: '12px', padding: '6px 12px', background: 'rgba(14, 165, 164, 0.12)', border: '1px solid rgba(14, 165, 164, 0.25)', borderRadius: '4px', color: '#0EA5A4', fontSize: '0.725rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Copy size={10} />
                      <span>{copySuccess ? "Copied!" : "Copy Pitch"}</span>
                    </button>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'Inter', fontSize: '0.85rem', color: '#E2E8F0', lineHeight: '1.6', paddingTop: '30px' }}>
                      {generatedPitch}
                    </pre>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed rgba(148, 163, 184, 0.1)', borderRadius: '8px', color: '#64748B', fontSize: '0.85rem' }}>
                    Click "Generate Pitch" to trigger custom AI copy personalized for this business website, rating, and location metrics.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: CRM Pipeline Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CRM Control Card */}
          <div style={{ background: 'rgba(20, 26, 46, 0.4)', border: '1px solid rgba(148, 163, 184, 0.08)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} style={{ color: '#0EA5A4' }} />
              <span>Pipeline Stage & Actions</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Current Lead Stage</label>
                <select
                  disabled={!isInCrm}
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '8px', color: '#F8FAFC', fontSize: '0.85rem', cursor: isInCrm ? 'pointer' : 'not-allowed' }}
                >
                  <option value="Discovered">Discovered</option>
                  <option value="Owner Identified">Owner Identified</option>
                  <option value="Pitch Drafted">Pitch Drafted</option>
                  <option value="Emailed">Emailed</option>
                  <option value="Call Made">Call Made</option>
                  <option value="Responded">Responded</option>
                  <option value="Closed Won">Closed Won</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Internal Notes</label>
                <textarea
                  disabled={!isInCrm}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isInCrm ? "Enter custom notes, follow-up logs, or specific customer requirements..." : "Add lead to CRM to begin logging notes..."}
                  style={{ width: '100%', height: '140px', padding: '12px 14px', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '8px', color: '#F8FAFC', fontSize: '0.85rem', resize: 'none', lineHeight: '1.5', cursor: isInCrm ? 'text' : 'not-allowed' }}
                />
              </div>

              {isInCrm && (
                <button
                  onClick={handleSaveDetails}
                  disabled={savingDetails}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'rgba(14, 165, 164, 0.15)',
                    border: '1px solid rgba(14, 165, 164, 0.3)',
                    borderRadius: '8px',
                    color: '#0EA5A4',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {savingDetails ? (
                    <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(14, 165, 164, 0.3)', borderTopColor: '#0EA5A4' }} />
                  ) : (
                    <FileText size={14} />
                  )}
                  <span>Save Stage & Notes</span>
                </button>
              )}

              {saveSuccess && (
                <div style={{ textAlign: 'center', color: '#22C55E', fontSize: '0.8rem', fontWeight: '600' }}>
                  ✔ Stage & notes successfully persisted!
                </div>
              )}
            </div>
          </div>

          {/* Verification Badge panel */}
          <div style={{ background: 'rgba(20, 26, 46, 0.4)', border: '1px solid rgba(148, 163, 184, 0.08)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: '#0EA5A4' }} />
              <span>Lead Verification Status</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Google Rating</span>
                <span style={{ fontSize: '0.85rem', color: '#F8FAFC', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={12} style={{ color: '#FFD93D', fill: '#FFD93D' }} />
                  <span>{business.rating ? `${business.rating} (${business.reviewCount} reviews)` : 'No Reviews'}</span>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Website Listed</span>
                <span style={{ fontSize: '0.85rem', color: business.website ? '#22C55E' : '#EF4444', fontWeight: '700' }}>
                  {business.website ? 'Yes' : 'No'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Owner Identified</span>
                <span style={{ fontSize: '0.85rem', color: business.owner ? '#22C55E' : '#EF4444', fontWeight: '700' }}>
                  {business.owner ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LeadDetails;
