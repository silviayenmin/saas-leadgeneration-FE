import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  Send,
  Copy,
  Mail,
  MessageSquare,
  ExternalLink,
  ChevronRight,
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
  // Local edit state
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

  // Save changes locally and sync to backend
  const handleFieldChange = (fieldName, val) => {
    // Optimistically update parent list state
    onUpdateLead(lead.sourceUrl, { [fieldName]: val });
  };

  const handleBlurSave = () => {
    // Parent onUpdateLead syncs with backend via api
    const payload = {
      authorName,
      companyName,
      buyingIntent,
      intentType,
      crmStatus,
      serviceRequired,
      industry,
      location,
      needDescription,
      contactInfo,
      contactSource,
      skills,
      experienceLevel,
      workPreference,
      phone,
      website,
      linkedin,
      employeeCount,
      foundedYear,
      keyContacts,
      annualRevenue,
      totalFunding
    };
    onUpdateLead(lead.sourceUrl, payload);
  };

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

  const handleGeneratePitch = async () => {
    setGeneratingPitch(true);
    
    // Resolve email copywriting tone from localStorage settings or default
    const savedTone = localStorage.getItem('silvia_email_tone') || 'Short & Conversational';
    const agName = workspaceName || localStorage.getItem('silvia_agency_name') || 'My Business';
    const agInfo = agencyInfo || localStorage.getItem('silvia_agency_info') || 'premier design & development services';

    // Synchronize latest modal changes before triggering AI gen to ensure fresh context
    onUpdateLead(lead.sourceUrl, {
      authorName,
      companyName,
      needDescription,
      serviceRequired
    });

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
      // Save generated pitch locally & sync
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

    // Update CRM Stage automatically to Emailed
    setCrmStatus('Emailed');
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

  const isMapScan = getLeadPlatform(lead) === 'google_maps';

  return (
    <div id="detail-modal" className="modal-overlay active" style={{ display: 'flex' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-top">
            <h3>Lead profile drawer</h3>
            <button onClick={onClose} className="modal-close">
              <X size={16} />
            </button>
          </div>

          {!isMaps && (
            <div className="modal-header-author">
              <label htmlFor="modal-author-name">Poster Full Name</label>
              <input
                type="text"
                id="modal-author-name"
                className="form-control modal-dense-input input-padding-left-sm"
                placeholder="Poster Name"
                value={authorName}
                onChange={(e) => {
                  setAuthorName(e.target.value);
                  handleFieldChange('authorName', e.target.value);
                }}
                onBlur={handleBlurSave}
              />
            </div>
          )}
        </div>

        <div className="modal-body">
          {/* Company Name */}
          <div className="detail-section">
            <label htmlFor="modal-company-name">Target Company Name</label>
            <input
              type="text"
              id="modal-company-name"
              className="form-control modal-dense-input input-padding-left-sm"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                handleFieldChange('companyName', e.target.value);
              }}
              onBlur={handleBlurSave}
            />
          </div>

          {/* Intent Levels & Signals */}
          {!isMaps && (
            <div className="detail-section-row" id="modal-intent-row">
              <div className="flex-1">
                <label htmlFor="modal-buying-intent">Buying Intent Level</label>
                <select
                  id="modal-buying-intent"
                  className="filter-select select-dense"
                  value={buyingIntent}
                  onChange={(e) => {
                    setBuyingIntent(e.target.value);
                    handleFieldChange('buyingIntent', e.target.value);
                    handleFieldChange('leadCategory', e.target.value); // Sync leadCategory
                  }}
                  onBlur={handleBlurSave}
                >
                  <option value="High">High</option>
                  <option value="Hiring">Hiring</option>
                  <option value="Research">Research</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="None">None</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="modal-intent-type">Signal Type</label>
                <select
                  id="modal-intent-type"
                  className="filter-select select-dense"
                  value={intentType}
                  onChange={(e) => {
                    setIntentType(e.target.value);
                    handleFieldChange('intentType', e.target.value);
                  }}
                  onBlur={handleBlurSave}
                >
                  <option value="Looking For Service">Looking For Service</option>
                  <option value="Recommendation Request">Recommendation Request</option>
                  <option value="Hiring Signal">Hiring Signal</option>
                  <option value="Expansion Signal">Expansion Signal</option>
                  <option value="Funding Signal">Funding Signal</option>
                  <option value="General Discussion">General Discussion</option>
                </select>
              </div>
            </div>
          )}

          {/* CRM status pipeline stage */}
          {isMaps ? (
            <div className="detail-section">
              <label htmlFor="modal-crm-status">Pipeline Stage</label>
              <select
                id="modal-crm-status"
                className="filter-select select-dense"
                value={crmStatus}
                onChange={(e) => {
                  setCrmStatus(e.target.value);
                  handleFieldChange('crmStatus', e.target.value);
                }}
                onBlur={handleBlurSave}
              >
                <option value="New">New</option>
                <option value="New Discovery">New Discovery</option>
                <option value="Drafted">Drafted</option>
                <option value="Emailed">Emailed</option>
                <option value="Replied">Replied</option>
                <option value="Disqualified">Disqualified</option>
              </select>
            </div>
          ) : (
            <div className="detail-section-row margin-top-sm">
              <div className="flex-1">
                <label htmlFor="modal-crm-status">Pipeline Stage</label>
                <select
                  id="modal-crm-status"
                  className="filter-select select-dense"
                  value={crmStatus}
                  onChange={(e) => {
                    setCrmStatus(e.target.value);
                    handleFieldChange('crmStatus', e.target.value);
                  }}
                  onBlur={handleBlurSave}
                >
                  <option value="New">New</option>
                  <option value="New Discovery">New Discovery</option>
                  <option value="Drafted">Drafted</option>
                  <option value="Emailed">Emailed</option>
                  <option value="Replied">Replied</option>
                  <option value="Disqualified">Disqualified</option>
                </select>
              </div>
              
              <div className="flex-1" id="modal-email-source-container">
                <label>Email Source</label>
                <div className="contact-meta-row contact-meta-flex">
                  <span className="contact-meta-value">{lead.contactSource || 'guessed'}</span>
                  <span className="contact-meta-dot">•</span>
                  <span className="contact-meta-value">{lead.contactConfidence || 'low'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Services Needed */}
          {!isMaps && (
            <div className="detail-section" id="modal-service-container">
              <label htmlFor="modal-service-required">Extracted Service Required</label>
              <input
                type="text"
                id="modal-service-required"
                className="form-control modal-dense-input input-padding-left-sm"
                placeholder="e.g. React Developer"
                value={serviceRequired}
                onChange={(e) => {
                  setServiceRequired(e.target.value);
                  handleFieldChange('serviceRequired', e.target.value);
                }}
                onBlur={handleBlurSave}
              />
            </div>
          )}

          {/* Industry and Location */}
          <div className="detail-section-row">
            <div className="flex-1">
              <label htmlFor="modal-industry">Classified Industry</label>
              <input
                type="text"
                id="modal-industry"
                className="form-control modal-dense-input input-padding-left-sm"
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  handleFieldChange('industry', e.target.value);
                }}
                onBlur={handleBlurSave}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="modal-location">Lead Location</label>
              <input
                type="text"
                id="modal-location"
                className="form-control modal-dense-input input-padding-left-sm"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  handleFieldChange('location', e.target.value);
                }}
                onBlur={handleBlurSave}
              />
            </div>
          </div>

          {/* Recruiter Mode Fields */}
          {isRecruiter && (
            <div id="modal-candidate-section">
              <div className="detail-section">
                <label htmlFor="modal-skills">Candidate Skills</label>
                <input
                  type="text"
                  id="modal-skills"
                  className="form-control modal-dense-input input-padding-left-sm"
                  value={skills}
                  onChange={(e) => {
                    setSkills(e.target.value);
                    handleFieldChange('skills', e.target.value);
                  }}
                  onBlur={handleBlurSave}
                />
              </div>
              <div className="detail-section-row" style={{ display: 'flex', gap: '1rem', marginTop: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="modal-experience-level">Experience Level</label>
                  <select
                    id="modal-experience-level"
                    className="form-control modal-dense-input input-padding-left-sm"
                    value={experienceLevel}
                    onChange={(e) => {
                      setExperienceLevel(e.target.value);
                      handleFieldChange('experienceLevel', e.target.value);
                    }}
                    onBlur={handleBlurSave}
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="modal-work-preference">Work Preference</label>
                  <select
                    id="modal-work-preference"
                    className="form-control modal-dense-input input-padding-left-sm"
                    value={workPreference}
                    onChange={(e) => {
                      setWorkPreference(e.target.value);
                      handleFieldChange('workPreference', e.target.value);
                    }}
                    onBlur={handleBlurSave}
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>
              </div>
            </div>
          )}

           {/* Google Maps specific fields */}
          {isMaps && (
            <div id="modal-maps-section" style={{ display: 'block' }}>
              <div className="detail-section">
                <label htmlFor="modal-maps-phone">Contact Number (Phone)</label>
                <input
                  type="text"
                  id="modal-maps-phone"
                  className="form-control modal-dense-input input-padding-left-sm"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    handleFieldChange('phone', e.target.value);
                  }}
                  onBlur={handleBlurSave}
                />
              </div>
              <div className="detail-section-row" style={{ display: 'flex', gap: '1rem', marginTop: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label>Google Rating</label>
                  <input
                    type="text"
                    className="form-control modal-dense-input"
                    readOnly
                    style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--warning)', fontWeight: 'bold' }}
                    value={rating ? (String(rating).includes('★') ? rating : `${rating} ★`) : ''}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Total Reviews</label>
                  <input
                    type="text"
                    className="form-control modal-dense-input"
                    readOnly
                    style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                    value={reviews ? (String(reviews).includes('Reviews') ? reviews : `${reviews} Reviews`) : ''}
                  />
                </div>
              </div>
              <div className="detail-section-row" style={{ display: 'flex', gap: '1rem', marginTop: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="modal-maps-employee-count">Employee Count</label>
                  <input
                    type="text"
                    id="modal-maps-employee-count"
                    className="form-control modal-dense-input input-padding-left-sm"
                    placeholder="e.g. 10 - 50 employees"
                    value={employeeCount}
                    onChange={(e) => {
                      setEmployeeCount(e.target.value);
                      handleFieldChange('employeeCount', e.target.value);
                    }}
                    onBlur={handleBlurSave}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="modal-maps-founded-year">Founded Year</label>
                  <input
                    type="text"
                    id="modal-maps-founded-year"
                    className="form-control modal-dense-input input-padding-left-sm"
                    placeholder="e.g. 2015"
                    value={foundedYear}
                    onChange={(e) => {
                      setFoundedYear(e.target.value);
                      handleFieldChange('foundedYear', e.target.value);
                    }}
                    onBlur={handleBlurSave}
                  />
                </div>
              </div>
              
              <div className="detail-section-row" style={{ display: 'flex', gap: '1rem', marginTop: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="modal-maps-annual-revenue">Annual Revenue</label>
                  <input
                    type="text"
                    id="modal-maps-annual-revenue"
                    className="form-control modal-dense-input input-padding-left-sm"
                    placeholder="e.g. $5M"
                    value={annualRevenue}
                    onChange={(e) => {
                      setAnnualRevenue(e.target.value);
                      handleFieldChange('annualRevenue', e.target.value);
                    }}
                    onBlur={handleBlurSave}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="modal-maps-total-funding">Total Funding</label>
                  <input
                    type="text"
                    id="modal-maps-total-funding"
                    className="form-control modal-dense-input input-padding-left-sm"
                    placeholder="e.g. $1.5M"
                    value={totalFunding}
                    onChange={(e) => {
                      setTotalFunding(e.target.value);
                      handleFieldChange('totalFunding', e.target.value);
                    }}
                    onBlur={handleBlurSave}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Website Link */}
          <div className="detail-section" style={{ marginTop: '10px' }}>
            <label htmlFor="modal-website" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Website Link</span>
              {website && (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.72rem', color: 'var(--accent)' }}
                >
                  Visit <ExternalLink size={10} />
                </a>
              )}
            </label>
            <input
              type="text"
              id="modal-website"
              className="form-control modal-dense-input input-padding-left-sm"
              placeholder="Website URL"
              value={website}
              onChange={(e) => {
                setWebsite(e.target.value);
                handleFieldChange('website', e.target.value);
              }}
              onBlur={handleBlurSave}
            />
          </div>

          {/* LinkedIn Page */}
          <div className="detail-section" style={{ marginTop: '10px' }}>
            <label htmlFor="modal-linkedin" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>LinkedIn Page</span>
              {linkedin && (
                <a
                  href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.72rem', color: 'var(--accent)' }}
                >
                  Visit <ExternalLink size={10} />
                </a>
              )}
            </label>
            <input
              type="text"
              id="modal-linkedin"
              className="form-control modal-dense-input input-padding-left-sm"
              placeholder="LinkedIn Profile URL"
              value={linkedin}
              onChange={(e) => {
                setLinkedin(e.target.value);
                handleFieldChange('linkedin', e.target.value);
              }}
              onBlur={handleBlurSave}
            />
          </div>

          {/* Requirement Description / Website Summary */}
          <div className="detail-section" id="modal-need-container">
            <label htmlFor="modal-need-description">
              {isMaps ? 'Company Description / Services' : 'What they need / Description'}
            </label>
            <textarea
              id="modal-need-description"
              className="form-control textarea-dense input-padding-x-sm"
              placeholder={isMaps ? "Scraped website company description..." : "Requirements details..."}
              value={needDescription}
              onChange={(e) => {
                setNeedDescription(e.target.value);
                handleFieldChange('needDescription', e.target.value);
              }}
              onBlur={handleBlurSave}
            />
          </div>

          {/* Key Contacts / Decision Makers */}
          <div className="detail-section" style={{ marginTop: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Key Team & Contacts
                </label>
                {getTeamSource() && (
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 600,
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    background: 'rgba(13, 148, 136, 0.15)',
                    color: '#0D9488',
                    border: '1px solid rgba(13, 148, 136, 0.25)',
                    textTransform: 'capitalize'
                  }}>
                    Source: {getTeamSource()}
                  </span>
                )}
              </div>
              <button
                type="button"
                id="btn-enrich-team"
                className="btn btn-secondary btn-enrich"
                onClick={handleEnrichTeam}
                disabled={enrichingTeam}
                style={{ margin: 0, padding: '4px 10px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Users size={12} />
                {enrichingTeam ? 'Fetching...' : 'Find Team'}
              </button>
            </div>
            {enrichingTeam && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.01)', marginBottom: '8px' }}>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px', border: '2px solid currentColor', borderRightColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spinner-border .75s linear infinite' }}></span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Searching decision-makers & team details...</span>
              </div>
            )}
            {!keyContacts || keyContacts.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px', border: '1px dashed var(--border-color)', borderRadius: '6px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)' }}>
                No contact persons identified yet. Click "Find Team" to fetch contacts.
              </div>
            ) : (
              <div className="contacts-table-wrapper" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflowX: 'auto', overflowY: 'auto', maxHeight: '300px', background: 'var(--bg-card)', position: 'relative' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>Name</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>Title</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>Email</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keyContacts.map((contact, cIdx) => (
                      <tr key={cIdx} style={{ borderBottom: cIdx < keyContacts.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{contact.name}</span>
                            {contact.linkedin && (
                              <a
                                href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', transition: 'opacity 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                                title={`View ${contact.name}'s LinkedIn profile`}
                              >
                                {getPlatformIcon('linkedin', 12)}
                              </a>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {contact.title === 'Ceo' ? 'CEO' : contact.title === 'Md' ? 'MD' : contact.title}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                          {contact.email && contact.email !== 'No Email Found' ? contact.email : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending Lookup</span>}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span className={`badge ${contact.source === 'Apollo B2B' ? 'badge-success' : 'badge-neutral'}`} style={{ padding: '1px 5px', fontSize: '0.62rem', borderRadius: '3px' }}>
                            {contact.source}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Contact email with finder */}
          <div className="detail-section contact-info-section">
            <div className="contact-label-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="modal-contact-info" style={{ margin: 0 }}>Contact Email</label>
                {contactInfo ? (
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 600,
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    background: contactSource === 'guessed' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(13, 148, 136, 0.15)',
                    color: contactSource === 'guessed' ? '#D97706' : '#0D9488',
                    border: contactSource === 'guessed' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(13, 148, 136, 0.25)',
                    textTransform: 'capitalize'
                  }}>
                    Source: {contactSource || 'unknown'}
                  </span>
                ) : (
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 600,
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.25)'
                  }}>
                    no mail
                  </span>
                )}
              </div>
              <button
                type="button"
                id="btn-enrich-contact"
                className="btn btn-secondary btn-enrich"
                onClick={handleEnrich}
                disabled={enriching}
                style={{ margin: 0 }}
              >
                <Search size={12} style={{ marginRight: '4px' }} />
                {enriching ? 'Enriching...' : 'Find Email'}
              </button>
            </div>
            <input
              type="text"
              id="modal-contact-info"
              className="form-control modal-dense-input input-padding-left-sm"
              placeholder="Search contact email..."
              value={contactInfo}
              onChange={(e) => {
                setContactInfo(e.target.value);
                handleFieldChange('contactInfo', e.target.value);
              }}
              onBlur={handleBlurSave}
            />
            {enriching && (
              <div id="enrich-loader" className="enrich-loader-panel" style={{ display: 'flex' }}>
                <span className="spinner spinner-tiny"></span>
                <span>Searching domain directories for decision-maker...</span>
              </div>
            )}
          </div>

          {/* Score section */}
          <div className="detail-section score-section">
            <div className="score-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="score-label label-small-bold" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lead score:</div>
              <span className={`badge ${getIntentBadgeClass(buyingIntent || 'Low')}`} style={{ textTransform: 'capitalize' }}>
                {(buyingIntent || 'Low') + ' Intent'}
              </span>
            </div>
            <div className="score-indicator-box" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span className="score-number" style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>
                {lead.leadScore !== undefined ? lead.leadScore : Math.round((parseFloat(lead.confidenceScore) || 0) * 100)}
              </span>
              <span className="score-pct" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>

          {/* AI Outreach Pitch Generator */}
          <div className="detail-section pitch-outreach-section">
            <div className="pitch-label-wrapper">
              <label className="label-small-bold" style={{ textTransform: 'uppercase' }}>Outreach Pitch Draft</label>
              <button
                type="button"
                id="btn-generate-pitch"
                className="btn btn-primary btn-generate"
                onClick={handleGeneratePitch}
                disabled={generatingPitch}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Sparkles size={12} style={{ marginRight: '4px' }} />
                {generatingPitch ? 'Drafting...' : 'Generate AI pitch'}
              </button>
            </div>

            {generatingPitch && (
              <div id="email-loader" className="email-loader-panel" style={{ display: 'flex', marginTop: '0.75rem' }}>
                <div className="spinner spinner-medium spinner-centered"></div>
                <div className="email-loader-text">Drafting customized pitch via Llama LLM...</div>
              </div>
            )}

            {hasGenerated && !generatingPitch && (
              <textarea
                id="modal-email-body"
                className="form-control textarea-email input-padding-x-sm"
                placeholder="Personalized pitch text..."
                value={emailBody}
                onChange={(e) => {
                  setEmailBody(e.target.value);
                  handleFieldChange('draftEmail', e.target.value);
                }}
                onBlur={handleBlurSave}
                style={{ marginTop: '0.75rem' }}
              />
            )}

            {!hasGenerated && !generatingPitch && (
              <div id="email-body-placeholder" className="email-placeholder" style={{ marginTop: '0.75rem' }}>
                Click 'Generate AI pitch' to write email automatically based on lead need & agency settings.
              </div>
            )}
          </div>

          {/* Email Replies Thread */}
          {lead.replies && lead.replies.length > 0 && (
            <div className="detail-section replies-section animate-fade-in" style={{ marginTop: '15px' }}>
              <label className="label-small-bold" style={{ textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                <MessageSquare size={14} /> Inbox Replies ({lead.replies.length})
              </label>
              <div className="replies-thread-container" style={{
                marginTop: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '300px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                {lead.replies.map((reply, rIdx) => (
                  <div key={rIdx} className="reply-bubble" style={{
                    background: 'var(--bg-trans-5)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)'
                  }}>
                    <div className="reply-header" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <span style={{ fontWeight: '600' }}>{reply.from || reply.from_email}</span>
                      <span>{reply.date}</span>
                    </div>
                    <div className="reply-subject" style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: 'var(--accent)',
                      marginBottom: '4px'
                    }}>
                      Sub: {reply.subject}
                    </div>
                    <div className="reply-snippet" style={{
                      lineHeight: 1.4,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {reply.snippet}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="drawer-action-buttons">
            {!lead.isConverted && (
              <div className="drawer-buttons-row" style={{ marginBottom: '0.65rem' }}>
                <button
                  type="button"
                  id="modal-btn-convert-crm"
                  className="btn btn-primary flex-1"
                  onClick={() => {
                    onUpdateLead(lead.sourceUrl, { isConverted: true, crmStatus: 'New' });
                    if (addToast) {
                      addToast('Lead Converted', 'Successfully converted to Outreach Pipeline Lead!', 'success');
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--primary)', color: '#fff', fontWeight: 'bold' }}
                >
                  <Sparkles size={13} /> Convert to CRM Lead
                </button>
              </div>
            )}
            <div className="drawer-buttons-row">
              {isMaps ? (
                <a href={lead.sourceUrl} id="modal-btn-linkedin" className="btn btn-primary flex-1" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <MapPin size={13} color="#EF4444" fill="#EF4444" /> Show in Google Maps
                </a>
              ) : (
                <a href={lead.sourceUrl} id="modal-btn-linkedin" className="btn btn-primary flex-1" target="_blank" rel="noreferrer">
                  <ExternalLink size={13} style={{ marginRight: '4px' }} /> View Source
                </a>
              )}
              <button
                id="modal-btn-send"
                className="btn btn-success-outline flex-1"
                disabled={!emailBody}
                onClick={handleSendPitch}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Send size={13} /> {isMaps ? 'Send pitch' : 'Send Pitch'}
              </button>
            </div>
            <div className="drawer-buttons-row">
              <button id="modal-btn-copy" onClick={handleCopyDetails} className="btn btn-secondary flex-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Copy size={13} /> {isMaps ? 'Copy details' : 'Copy Details'}
              </button>
              <button
                id="modal-btn-copy-email"
                className="btn btn-secondary flex-1"
                disabled={!emailBody}
                onClick={handleCopyEmail}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Mail size={13} /> {isMaps ? 'Copy email' : 'Copy Pitch'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
