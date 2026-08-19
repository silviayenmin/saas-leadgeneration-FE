import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Sparkles,
  Send,
  Copy,
  Mail,
  MessageSquare,
  ExternalLink,
  MapPin,
  Users
} from 'lucide-react';
import {
  getLeadPlatform,
  getLeadAvatarUrl,
  getCompanyLogoUrl,
  getIntentBadgeClass,
  getPlatformIcon
} from '../../utils/helpers';
import api from '../../services/api';
import './LeadDetailModal.scss';

export default function LeadDetailModal({ lead, onClose, onUpdateLead, workspaceName, agencyInfo, addToast }) {
  // Local state
  const [authorName, setAuthorName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [buyingIntent, setBuyingIntent] = useState('Low');
  const [intentType, setIntentType] = useState('Looking For Service');
  const [crmStatus, setCrmStatus] = useState('New');
  const [serviceRequired, setServiceRequired] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [needDescription, setNeedDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [contactSource, setContactSource] = useState('');

  // Recruiter fields
  const [skills, setSkills] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Unknown');
  const [workPreference, setWorkPreference] = useState('Unknown');

  // Google Maps fields
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState('');
  const [reviews, setReviews] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [keyContacts, setKeyContacts] = useState([]);
  const [keyContactsSource, setKeyContactsSource] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [totalFunding, setTotalFunding] = useState('');

  // Loader states
  const [enriching, setEnriching] = useState(false);
  const [enrichingTeam, setEnrichingTeam] = useState(false);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [emailBody, setEmailBody] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [enrichingContacts, setEnrichingContacts] = useState({});

  // Populate state on mount/change
  useEffect(() => {
    if (lead) {
      setAuthorName(lead.authorName || '');
      setCompanyName(lead.companyName || '');
      setBuyingIntent(lead.buyingIntent || lead.leadCategory || 'Low');
      setIntentType(lead.intentType || 'Looking For Service');
      setCrmStatus(lead.crmStatus || 'New');
      
      setServiceRequired(
        Array.isArray(lead.serviceRequired)
          ? lead.serviceRequired.join(', ')
          : lead.serviceRequired || ''
      );
      
      setIndustry(lead.industry || '');
      setLocation(lead.location || '');
      setNeedDescription(lead.needDescription || '');
      setContactInfo(lead.contactInfo || '');
      setContactSource(lead.contactSource || '');

      setSkills(lead.skills || '');
      setExperienceLevel(lead.experienceLevel || 'Unknown');
      setWorkPreference(lead.workPreference || 'Unknown');

      setPhone(lead.phone || '');
      setRating(lead.rating || '');
      setReviews(lead.reviews || '');
      setWebsite(lead.website || '');
      setLinkedin(lead.linkedin || '');
      setEmployeeCount(lead.employeeCount || '');
      setFoundedYear(lead.foundedYear || '');
      setKeyContacts(lead.keyContacts || []);
      setKeyContactsSource(lead.keyContactsSource || '');
      setAnnualRevenue(lead.annualRevenue || '');
      setTotalFunding(lead.totalFunding || '');
      
      setEmailBody(lead.draftEmail || '');
      setHasGenerated(!!lead.draftEmail);
    }
  }, [lead]);

  if (!lead) return null;

  const platform = getLeadPlatform(lead);
  const isRecruiter = lead.search_type === 'recruiter';
  const isMaps = platform === 'google_maps';

  const getTeamSource = () => {
    if (keyContactsSource && keyContactsSource !== 'none') return keyContactsSource;
    if (keyContacts && keyContacts.length > 0) {
      const firstSrc = keyContacts[0].source;
      if (firstSrc === 'Apollo B2B') return 'apollo';
      if (firstSrc === 'Serper Search') return 'serper';
    }
    return null;
  };

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const response = await api.post('/enrich-contact', { sourceUrl: lead.sourceUrl });
      const data = response.data;
      if (data.authorName) setAuthorName(data.authorName);
      if (data.companyName) setCompanyName(data.companyName);
      if (data.industry) setIndustry(data.industry);
      if (data.location) setLocation(data.location);
      setContactInfo(data.contactInfo || '');
      setContactSource(data.contactSource || '');
      if (data.keyContactsSource) setKeyContactsSource(data.keyContactsSource);
      
      onUpdateLead(lead.sourceUrl, {
        authorName: data.authorName || authorName,
        companyName: data.companyName || companyName,
        industry: data.industry || industry,
        location: data.location || location,
        contactInfo: data.contactInfo || '',
        contactSource: data.contactSource || 'guessed',
        contactConfidence: data.contactConfidence || 'low',
        keyContactsSource: data.keyContactsSource || keyContactsSource
      });
      if (addToast) addToast('Lookup Success', 'Email lookup completed.', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      if (addToast) addToast('Lookup Error', errMsg, 'error');
    } finally {
      setEnriching(false);
    }
  };

  const handleEnrichTeam = async () => {
    setEnrichingTeam(true);
    try {
      const response = await api.post('/enrich-team', { sourceUrl: lead.sourceUrl });
      const data = response.data;
      if (data.companyName) setCompanyName(data.companyName);
      if (data.industry) setIndustry(data.industry);
      if (data.location) setLocation(data.location);
      if (data.employeeCount) setEmployeeCount(data.employeeCount);
      if (data.foundedYear) setFoundedYear(data.foundedYear);
      if (data.annualRevenue) setAnnualRevenue(data.annualRevenue);
      if (data.totalFunding) setTotalFunding(data.totalFunding);
      if (data.keyContacts) setKeyContacts(data.keyContacts);
      if (data.keyContactsSource) setKeyContactsSource(data.keyContactsSource);
      
      onUpdateLead(lead.sourceUrl, {
        companyName: data.companyName || companyName,
        industry: data.industry || industry,
        location: data.location || location,
        employeeCount: data.employeeCount || employeeCount,
        foundedYear: data.foundedYear || foundedYear,
        annualRevenue: data.annualRevenue || annualRevenue,
        totalFunding: data.totalFunding || totalFunding,
        keyContacts: data.keyContacts || keyContacts,
        keyContactsSource: data.keyContactsSource || keyContactsSource
      });
      if (addToast) addToast('Lookup Success', 'Key team & contacts lookup completed.', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      if (addToast) addToast('Lookup Error', errMsg, 'error');
    } finally {
      setEnrichingTeam(false);
    }
  };

  const handleEnrichKeyContact = async (contactName) => {
    setEnrichingContacts(prev => ({ ...prev, [contactName]: true }));
    try {
      const response = await api.post('/enrich-contact', {
        sourceUrl: lead.sourceUrl,
        authorName: contactName,
        companyName: companyName
      });
      const data = response.data;
      if (data.keyContacts) {
        setKeyContacts(data.keyContacts);
        onUpdateLead(lead.sourceUrl, {
          keyContacts: data.keyContacts
        });
      }
      if (addToast) addToast('Lookup Success', `Details lookup for ${contactName} completed.`, 'success');
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      if (addToast) addToast('Lookup Error', errMsg, 'error');
    } finally {
      setEnrichingContacts(prev => ({ ...prev, [contactName]: false }));
    }
  };

  const handleGeneratePitch = async () => {
    setGeneratingPitch(true);
    
    const savedTone = localStorage.getItem('silvia_email_tone') || 'Short & Conversational';
    const agName = workspaceName || localStorage.getItem('silvia_agency_name') || 'My Business';
    const agInfo = agencyInfo || localStorage.getItem('silvia_agency_info') || 'premier design & development services';

    try {
      const response = await api.post('/generate-pitch', {
        sourceUrl: lead.sourceUrl,
        agencyName: agName,
        agencyInfo: agInfo,
        emailTone: savedTone
      });

      const data = response.data;
      setEmailBody(data.pitch || '');
      setHasGenerated(true);
      onUpdateLead(lead.sourceUrl, { 
        draftEmail: data.pitch || '',
        crmStatus: data.crmStatus || 'Drafted',
        isConverted: true
      });
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      alert('AI Pitch generation error: ' + errMsg);
    } finally {
      setGeneratingPitch(false);
    }
  };

  const handleSendPitch = () => {
    if (!emailBody.trim()) return;

    let subject = 'Outreach Details';
    let body = emailBody;

    if (emailBody.includes('Subject:')) {
      const lines = emailBody.split('\n');
      const subLine = lines.find((l) => l.toLowerCase().startsWith('subject:'));
      if (subLine) {
        subject = subLine.substring(8).trim();
        body = lines.filter((l) => !l.toLowerCase().startsWith('subject:')).join('\n').trim();
      }
    }

    const recipient = contactInfo && contactInfo.includes('@') ? contactInfo : '';
    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');

    onUpdateLead(lead.sourceUrl, { 
      crmStatus: 'Emailed',
      isConverted: true
    });
  };

  const handleCopyDetails = () => {
    const summary = `Lead: ${authorName || 'Unknown'}
Company: ${companyName || 'No Company'}
Requirement: ${serviceRequired || needDescription || 'No requirement extracted'}
Contact: ${contactInfo || 'None'}
Source: ${lead.sourceUrl}`;
    
    navigator.clipboard.writeText(summary);
    if (addToast) addToast('Copied', 'Lead details copied to clipboard!', 'success');
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailBody);
    if (addToast) addToast('Copied', 'AI pitch draft email copied to clipboard!', 'success');
  };

  return (
    <div className="lead-detail-page">
      {/* Premium Header */}
      <div className="page-header-premium">
        <div className="header-left-side">
          <button onClick={onClose} className="back-icon-btn" title="Back to Leads list">
            <ArrowLeft size={18} />
          </button>
          <div className="header-divider" />
          <img
            src={getCompanyLogoUrl(companyName)}
            alt={companyName}
            className="header-avatar"
            onError={(e) => {
              e.target.src = getLeadAvatarUrl(authorName || companyName);
            }}
          />
          <div className="header-text">
            <div className="company-title-row">
              <h3>{companyName || authorName || 'Lead Details'}</h3>
            </div>
            <div className="platform-row">
              <span>Platform:</span>
              <span className="platform-badge">
                {getPlatformIcon(platform, 12)}
                {platform === 'google_maps' ? 'Google Maps' : platform}
              </span>
            </div>
          </div>
        </div>

        <div className="header-right-side">
          <span className="contact-meta-pill" style={{ height: '30px', padding: '0 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', fontWeight: '600', gap: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px' }}>
            <span>AI Score:</span>
            <strong style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '800' }}>
              {lead.leadScore !== undefined ? lead.leadScore : Math.round((parseFloat(lead.confidenceScore) || 0) * 100)}
            </strong>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>/100</span>
          </span>

          {platform === 'google_maps' ? (
            <>
              {lead.rating && (
                <span className="contact-meta-pill" style={{ height: '30px', padding: '0 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', fontWeight: '600', gap: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px' }}>
                  <span>Rating:</span>
                  <strong style={{ color: 'var(--warning)', fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {lead.rating} <span style={{ fontSize: '0.75rem' }}>★</span>
                  </strong>
                  {lead.reviews && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>({lead.reviews})</span>
                  )}
                </span>
              )}
              <span className="badge" style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(3, 113, 114, 0.12)', color: 'var(--secondary)', border: '1px solid rgba(3, 113, 114, 0.25)' }}>
                Maps Listing
              </span>
            </>
          ) : (
            <span className={`badge ${getIntentBadgeClass(buyingIntent || 'Low')}`} style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'capitalize', fontWeight: '700' }}>
              {buyingIntent || 'Low'} Intent
            </span>
          )}
          <span className="contact-meta-pill" style={{ height: '30px', padding: '0 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', fontWeight: '600' }}>
            Stage: {crmStatus || 'New'}
          </span>
        </div>
      </div>

      {/* 2-Column Split Body Layout */}
      <div className="modal-split-container">
        
        {/* LEFT COLUMN: Data Details Panel (Scrollable) */}
        <div className="modal-main-column">
          
          {/* CARD 1: Profile Info */}
          <div className="detail-card">
            <div className="card-header-row">
              <h4 className="card-title">
                <Users size={14} className="header-icon" />
                Lead Profile
              </h4>
            </div>

            <div className="info-grid-2">
              <div className="field-group">
                <label>Target Company Name</label>
                <div className="field-value">
                  <span className="value-text">{companyName || 'N/A'}</span>
                </div>
              </div>
              <div className="field-group">
                <label>Lead Location</label>
                <div className="field-value">
                  <span className="value-text">{location || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="info-grid-2">
              <div className="field-group">
                <label>Classified Industry</label>
                <div className="field-value">
                  <span className="value-text">{industry || 'N/A'}</span>
                </div>
              </div>
              {isMaps ? (
                <div className="field-group">
                  <label>Rating & Reviews</label>
                  <div className="rating-pill-container" style={{ marginTop: 0, gap: '8px' }}>
                    {rating && (
                      <div className="rating-pill" style={{ padding: '6px 12px', height: '38px', boxSizing: 'border-box' }}>
                        <span className="rating-star">★</span>
                        <span>{rating} / 5 Rating</span>
                      </div>
                    )}
                    {reviews && (
                      <div className="rating-pill" style={{ padding: '6px 12px', height: '38px', boxSizing: 'border-box' }}>
                        <span className="review-bubble">💬</span>
                        <span>{reviews} Reviews</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="field-group">
                  <label>Poster Full Name</label>
                  <div className="field-value">
                    <span className="value-text">{authorName || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="field-group" style={{ marginTop: '12px' }}>
              <label>About Company</label>
              <div className="field-value-textarea" style={{ minHeight: '80px', maxHeight: '140px' }}>
                {needDescription || 'No company description or service specifications extracted.'}
              </div>
            </div>
            


            {!isMaps && (
              <div className="info-grid-2">
                <div className="field-group">
                  <label>Buying Intent Level</label>
                  <div className="field-value" style={{ border: 'none', background: 'transparent', padding: 0, minHeight: 'auto' }}>
                    <span className={`badge ${getIntentBadgeClass(buyingIntent || 'Low')}`} style={{ textTransform: 'capitalize' }}>
                      {buyingIntent || 'Low'}
                    </span>
                  </div>
                </div>
                <div className="field-group">
                  <label>Signal Type</label>
                  <div className="field-value">
                    <span className="value-text">{intentType || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {!isMaps && (
              <div className="info-grid-2">
                <div className="field-group">
                  <label>Email Source</label>
                  <div className="contact-meta-pill" style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span>Source: {lead.contactSource || 'guessed'}</span>
                    <span>•</span>
                    <span>Conf: {lead.contactConfidence || 'low'}</span>
                  </div>
                </div>
              </div>
            )}

            {!isMaps && (
              <div className="field-group">
                <label>Extracted Service Required</label>
                <div className="field-value">
                  <span className="value-text">{serviceRequired || 'N/A'}</span>
                </div>
              </div>
            )}

          </div>

          {/* CARD 2: Candidate details (Recruiter mode only) */}
          {isRecruiter && (
            <div className="detail-card">
              <div className="card-header-row">
                <h4 className="card-title">Candidate Details</h4>
              </div>
              <div className="field-group">
                <label>Candidate Skills</label>
                <div className="field-value">
                  <span className="value-text">{skills || 'N/A'}</span>
                </div>
              </div>
              <div className="info-grid-2">
                <div className="field-group">
                  <label>Experience Level</label>
                  <div className="field-value">
                    <span className="value-text">{experienceLevel || 'N/A'}</span>
                  </div>
                </div>
                <div className="field-group">
                  <label>Work Preference</label>
                  <div className="field-value">
                    <span className="value-text">{workPreference || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CARD 3: Contact & Media Channels */}
          <div className="detail-card">
            <div className="card-header-row">
              <h4 className="card-title">
                <Mail size={14} className="header-icon" />
                Contact & Links
              </h4>
            </div>

            <div className="field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ margin: 0 }}>Contact Email</label>
                {contactInfo && (
                  <span className="contact-meta-pill">
                    Source: {contactSource || 'unknown'}
                  </span>
                )}
              </div>
              <div className="field-value" style={{ paddingRight: '4px', gap: '8px', display: 'flex', alignItems: 'center', width: '100%' }}>
                <input
                  type="text"
                  className="form-control value-input"
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    height: '32px',
                    minWidth: 0
                  }}
                  value={contactInfo}
                  placeholder="Email not found"
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setContactInfo(newVal);
                    onUpdateLead(lead.sourceUrl, { 
                      contactInfo: newVal,
                      contactSource: 'manual'
                    });
                  }}
                />
                <button
                  type="button"
                  id="btn-enrich-contact"
                  className="btn btn-secondary"
                  onClick={handleEnrich}
                  disabled={enriching}
                  style={{ height: '32px', padding: '0 12px', fontSize: '0.72rem', margin: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Search size={11} />
                  {enriching ? 'Enriching...' : 'Find Email'}
                </button>
              </div>
            </div>

            {isMaps && (
              <div className="field-group">
                <label>Contact Number (Phone)</label>
                <div className="field-value">
                  <span className="value-text">{phone || 'N/A'}</span>
                </div>
              </div>
            )}

            <div className="info-grid-2">
              <div className="field-group">
                <label>Website Link</label>
                <div className="field-value" style={{ paddingRight: '4px' }}>
                  <span className="value-text">
                    {website || 'N/A'}
                  </span>
                  {website && (
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="visit-link-btn"
                      title="Visit Website"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              <div className="field-group">
                <label>LinkedIn Profile</label>
                <div className="field-value" style={{ paddingRight: '4px' }}>
                  <span className="value-text">
                    {linkedin || 'N/A'}
                  </span>
                  {linkedin && (
                    <a
                      href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="visit-link-btn"
                      title="Visit LinkedIn"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: Company metrics (for Maps scans) */}
          {isMaps && (
            <div className="detail-card">
              <div className="card-header-row">
                <h4 className="card-title">
                  <Sparkles size={14} className="header-icon" />
                  Company Metrics
                </h4>
              </div>

              <div className="info-grid-2">
                <div className="field-group">
                  <label>Employee Count</label>
                  <div className="field-value">
                    <span className="value-text">{employeeCount || 'N/A'}</span>
                  </div>
                </div>
                <div className="field-group">
                  <label>Founded Year</label>
                  <div className="field-value">
                    <span className="value-text">{foundedYear || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="info-grid-2">
                <div className="field-group">
                  <label>Annual Revenue</label>
                  <div className="field-value">
                    <span className="value-text">{annualRevenue || 'N/A'}</span>
                  </div>
                </div>
                <div className="field-group">
                  <label>Total Funding</label>
                  <div className="field-value">
                    <span className="value-text">{totalFunding || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CARD 5: B2B Key Team & Contacts */}
          <div className="detail-card">
            <div className="card-header-row">
              <h4 className="card-title">
                <Users size={14} className="header-icon" />
                Key Team & Decision Makers
              </h4>
              <button
                type="button"
                id="btn-enrich-team"
                className="btn btn-secondary"
                onClick={handleEnrichTeam}
                disabled={enrichingTeam}
                style={{ height: '30px', padding: '0 12px', fontSize: '0.72rem', margin: 0 }}
              >
                <Users size={11} />
                {enrichingTeam ? 'Fetching...' : 'Find Team'}
              </button>
            </div>

            {getTeamSource() && (
              <div>
                <span className="contact-meta-pill" style={{ textTransform: 'capitalize' }}>
                  Source: {getTeamSource()}
                </span>
              </div>
            )}

            {enrichingTeam && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--border-color)', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.01)' }}>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px', border: '2px solid var(--primary)', borderRightColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spinner-border .75s linear infinite' }}></span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Searching decision-makers & team details...</span>
              </div>
            )}

            {!keyContacts || keyContacts.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '10px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)' }}>
                No contact persons identified yet. Click "Find Team" to fetch contacts.
              </div>
            ) : (
              <div className="team-list-container">
                {keyContacts.map((contact, cIdx) => (
                  <div className="team-member-card" key={cIdx}>
                    <div className="member-left">
                      <div className="member-initials">
                        {contact.name ? contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div className="member-info">
                        <div className="member-name-row">
                          <span className="member-name">{contact.name}</span>
                          {contact.linkedin && contact.linkedin !== 'No LinkedIn Link' ? (
                            <a
                              href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="member-linkedin"
                              title="LinkedIn profile"
                            >
                              {getPlatformIcon('linkedin', 12)}
                            </a>
                          ) : (
                            <span 
                              className="member-linkedin disabled" 
                              title="LinkedIn profile not found"
                              style={{ opacity: 0.3, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center' }}
                            >
                              {getPlatformIcon('linkedin', 12)}
                            </span>
                          )}
                        </div>
                        <span className="member-title">
                          {contact.title === 'Ceo' ? 'CEO' : contact.title === 'Md' ? 'MD' : contact.title}
                        </span>
                      </div>
                    </div>

                    <div className="member-right">
                      {contact.email && contact.email !== 'No Email Found' && contact.email !== 'Pending Lookup' ? (
                        <>
                          <span className="member-email">{contact.email}</span>
                          <button
                            type="button"
                            className="copy-member-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(contact.email);
                              if (addToast) addToast('Copied', `${contact.name}'s email copied!`, 'success');
                            }}
                            title="Copy email"
                          >
                            <Copy size={11} />
                          </button>
                        </>
                      ) : contact.email === 'No Email Found' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="member-email not-found" style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontStyle: 'italic', padding: '2px 8px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                            No Email Found
                          </span>
                          {enrichingContacts[contact.name] ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '10px', height: '10px', border: '2px solid var(--primary)', borderRightColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spinner-border .75s linear infinite' }}></span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm pending-enrich-btn"
                              style={{ 
                                fontSize: '0.68rem', 
                                padding: '2px 6px', 
                                height: '20px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                margin: 0
                              }}
                              onClick={() => handleEnrichKeyContact(contact.name)}
                              title="Retry email lookup"
                            >
                              <Search size={10} />
                              Retry
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {enrichingContacts[contact.name] ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '10px', height: '10px', border: '2px solid var(--primary)', borderRightColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spinner-border .75s linear infinite' }}></span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm pending-enrich-btn"
                              style={{ 
                                fontSize: '0.68rem', 
                                padding: '2px 8px', 
                                height: '24px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                background: 'rgba(255, 193, 7, 0.1)',
                                color: '#ffc107',
                                border: '1px solid rgba(255, 193, 7, 0.2)',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                margin: 0
                              }}
                              onClick={() => handleEnrichKeyContact(contact.name)}
                            >
                              <Search size={10} />
                              Find Email
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: AI Copy & CRM Executions Sidebar (Static / Pinned) */}
        <div className="modal-sidebar-column">
          



          {/* SECTION 2: AI Email Outreach Copywriting */}
          <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="detail-card ai-glow" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="card-header-row" style={{ flexShrink: 0 }}>
                <h4 className="card-title">
                  <Sparkles size={14} className="header-icon" />
                  AI Outreach Copywriter
                </h4>
                <button
                  type="button"
                  id="btn-generate-pitch"
                  className="btn btn-primary"
                  onClick={handleGeneratePitch}
                  disabled={generatingPitch}
                  style={{ height: '30px', padding: '0 12px', fontSize: '0.72rem', margin: 0 }}
                >
                  <Sparkles size={11} />
                  {generatingPitch ? 'Drafting...' : 'Generate Pitch'}
                </button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '12px', minHeight: '200px' }}>
                {generatingPitch && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '20px', border: '1px dashed rgba(3, 113, 114, 0.3)', borderRadius: '10px', background: 'rgba(3, 113, 114, 0.02)' }}>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '16px', height: '16px', border: '2px solid var(--primary)', borderRightColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spinner-border .75s linear infinite' }}></span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Drafting customized pitch via LLM...</span>
                  </div>
                )}

                {hasGenerated && !generatingPitch && (
                  <textarea
                    id="modal-email-body"
                    className="form-control textarea-email"
                    placeholder="Personalized pitch text..."
                    value={emailBody}
                    onChange={(e) => {
                      setEmailBody(e.target.value);
                    }}
                    style={{ height: '100%', flex: 1, resize: 'none' }}
                  />
                )}

                {!hasGenerated && !generatingPitch && (
                  <div className="email-placeholder" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Click 'Generate Pitch' to automatically draft personalized email copy.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: CRM Pinned Actions & Execution */}
          <div className="sidebar-section" style={{ background: 'var(--bg-main)', borderTop: '1px solid var(--border-color)', marginTop: 'auto', flexShrink: 0 }}>
            {!lead.isConverted && (
              <button
                type="button"
                id="modal-btn-convert-crm"
                className="btn btn-primary"
                onClick={() => {
                  onUpdateLead(lead.sourceUrl, { isConverted: true, crmStatus: 'New' });
                  if (addToast) {
                    addToast('Lead Converted', 'Converted to Outreach Pipeline!', 'success');
                  }
                }}
                style={{ width: '100%', marginBottom: '10px' }}
              >
                <Sparkles size={13} />
                Convert to CRM Lead
              </button>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isMaps ? (
                  <a href={lead.sourceUrl} id="modal-btn-linkedin" className="btn btn-secondary" target="_blank" rel="noreferrer" style={{ flex: 1 }}>
                    <MapPin size={13} color="#EF4444" fill="#EF4444" /> Maps Source
                  </a>
                ) : (
                  <a href={lead.sourceUrl} id="modal-btn-linkedin" className="btn btn-secondary" target="_blank" rel="noreferrer" style={{ flex: 1 }}>
                    <ExternalLink size={13} /> View Source
                  </a>
                )}
                <button
                  id="modal-btn-send"
                  className="btn btn-success-outline"
                  disabled={!emailBody}
                  onClick={handleSendPitch}
                  style={{ flex: 1 }}
                >
                  <Send size={13} /> Send Pitch
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button id="modal-btn-copy" onClick={handleCopyDetails} className="btn btn-secondary" style={{ flex: 1 }}>
                  <Copy size={13} /> Copy Details
                  </button>
                  <button
                    id="modal-btn-copy-email"
                    className="btn btn-secondary"
                    disabled={!emailBody}
                    onClick={handleCopyEmail}
                    style={{ flex: 1 }}
                  >
                    <Mail size={13} /> Copy Pitch
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
  );
}
