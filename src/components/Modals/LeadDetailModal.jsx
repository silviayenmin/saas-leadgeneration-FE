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

  return (
    <div id="detail-modal" className="modal-overlay active">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Premium Header */}
        <div className="modal-header-premium">
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
          <button onClick={onClose} className="modal-close-premium" title="Close drawer">
            <X size={16} />
          </button>
        </div>

        {/* Premium Scroll Body */}
        <div className="modal-body-premium">
          {/* CARD 1: Lead Information */}
          <div className="detail-card">
            <div className="card-header-row">
              <h4 className="card-title">
                <Users size={14} className="header-icon" />
                Lead Profile
              </h4>
            </div>

            <div className="info-grid-2">
              {!isMaps && (
                <div className="field-group">
                  <label htmlFor="modal-author-name">Poster Full Name</label>
                  <input
                    type="text"
                    id="modal-author-name"
                    className="form-control modal-dense-input"
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
              <div className="field-group">
                <label htmlFor="modal-company-name">Target Company Name</label>
                <input
                  type="text"
                  id="modal-company-name"
                  className="form-control modal-dense-input"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    handleFieldChange('companyName', e.target.value);
                  }}
                  onBlur={handleBlurSave}
                />
              </div>
            </div>

            <div className="info-grid-2">
              <div className="field-group">
                <label htmlFor="modal-industry">Classified Industry</label>
                <input
                  type="text"
                  id="modal-industry"
                  className="form-control modal-dense-input"
                  value={industry}
                  onChange={(e) => {
                    setIndustry(e.target.value);
                    handleFieldChange('industry', e.target.value);
                  }}
                  onBlur={handleBlurSave}
                />
              </div>
              <div className="field-group">
                <label htmlFor="modal-location">Lead Location</label>
                <input
                  type="text"
                  id="modal-location"
                  className="form-control modal-dense-input"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    handleFieldChange('location', e.target.value);
                  }}
                  onBlur={handleBlurSave}
                />
              </div>
            </div>

            {!isMaps && (
              <div className="info-grid-2">
                <div className="field-group">
                  <label htmlFor="modal-buying-intent">Buying Intent Level</label>
                  <select
                    id="modal-buying-intent"
                    className="select-dense"
                    value={buyingIntent}
                    onChange={(e) => {
                      setBuyingIntent(e.target.value);
                      handleFieldChange('buyingIntent', e.target.value);
                      handleFieldChange('leadCategory', e.target.value);
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
                <div className="field-group">
                  <label htmlFor="modal-intent-type">Signal Type</label>
                  <select
                    id="modal-intent-type"
                    className="select-dense"
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
            
            <div className="info-grid-2">
              <div className="field-group">
                <label htmlFor="modal-crm-status">Pipeline Stage</label>
                <select
                  id="modal-crm-status"
                  className="select-dense"
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
              
              {!isMaps && (
                <div className="field-group">
                  <label>Email Source</label>
                  <div className="contact-meta-pill">
                    <span>Source: {lead.contactSource || 'guessed'}</span>
                    <span>•</span>
                    <span>Conf: {lead.contactConfidence || 'low'}</span>
                  </div>
                </div>
              )}
            </div>

            {!isMaps && (
              <div className="field-group">
                <label htmlFor="modal-service-required">Extracted Service Required</label>
                <input
                  type="text"
                  id="modal-service-required"
                  className="form-control modal-dense-input"
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
          </div>

          {/* CARD 2: Candidate details (Recruiter mode only) */}
          {isRecruiter && (
            <div className="detail-card">
              <div className="card-header-row">
                <h4 className="card-title">Candidate Details</h4>
              </div>
              <div className="field-group">
                <label htmlFor="modal-skills">Candidate Skills</label>
                <input
                  type="text"
                  id="modal-skills"
                  className="form-control modal-dense-input"
                  value={skills}
                  onChange={(e) => {
                    setSkills(e.target.value);
                    handleFieldChange('skills', e.target.value);
                  }}
                  onBlur={handleBlurSave}
                />
              </div>
              <div className="info-grid-2">
                <div className="field-group">
                  <label htmlFor="modal-experience-level">Experience Level</label>
                  <select
                    id="modal-experience-level"
                    className="select-dense"
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
                <div className="field-group">
                  <label htmlFor="modal-work-preference">Work Preference</label>
                  <select
                    id="modal-work-preference"
                    className="select-dense"
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
                <label htmlFor="modal-contact-info" style={{ margin: 0 }}>Contact Email</label>
                {contactInfo && (
                  <span className="contact-meta-pill">
                    Source: {contactSource || 'unknown'}
                  </span>
                )}
              </div>
              <div className="field-input-wrapper">
                <input
                  type="text"
                  id="modal-contact-info"
                  className="form-control modal-dense-input"
                  placeholder="Lead contact email..."
                  value={contactInfo}
                  onChange={(e) => {
                    setContactInfo(e.target.value);
                    handleFieldChange('contactInfo', e.target.value);
                  }}
                  onBlur={handleBlurSave}
                  style={{ paddingRight: enriching ? '100px' : '90px' }}
                />
                <button
                  type="button"
                  id="btn-enrich-contact"
                  className="btn btn-secondary"
                  onClick={handleEnrich}
                  disabled={enriching}
                  style={{ position: 'absolute', right: '4px', top: '4px', bottom: '4px', height: '30px', padding: '0 10px', fontSize: '0.72rem', margin: 0 }}
                >
                  <Search size={11} />
                  {enriching ? 'Enriching...' : 'Find Email'}
                </button>
              </div>
            </div>

            {isMaps && (
              <>
                <div className="field-group">
                  <label htmlFor="modal-maps-phone">Contact Number (Phone)</label>
                  <input
                    type="text"
                    id="modal-maps-phone"
                    className="form-control modal-dense-input"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      handleFieldChange('phone', e.target.value);
                    }}
                    onBlur={handleBlurSave}
                  />
                </div>

                <div className="field-group">
                  <label>Google Maps Rating</label>
                  <div className="rating-pill-container">
                    {rating && (
                      <div className="rating-pill">
                        <span className="rating-star">★</span>
                        <span>{rating} / 5 Rating</span>
                      </div>
                    )}
                    {reviews && (
                      <div className="rating-pill">
                        <span className="review-bubble">💬</span>
                        <span>{reviews} Reviews</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="info-grid-2">
              <div className="field-group">
                <label htmlFor="modal-website">Website Link</label>
                <div className="field-input-wrapper">
                  <input
                    type="text"
                    id="modal-website"
                    className="form-control modal-dense-input"
                    placeholder="Website URL"
                    value={website}
                    onChange={(e) => {
                      setWebsite(e.target.value);
                      handleFieldChange('website', e.target.value);
                    }}
                    onBlur={handleBlurSave}
                    style={{ paddingRight: '32px' }}
                  />
                  {website && (
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="input-icon-right"
                      title="Visit Website"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="modal-linkedin">LinkedIn Profile</label>
                <div className="field-input-wrapper">
                  <input
                    type="text"
                    id="modal-linkedin"
                    className="form-control modal-dense-input"
                    placeholder="LinkedIn Profile URL"
                    value={linkedin}
                    onChange={(e) => {
                      setLinkedin(e.target.value);
                      handleFieldChange('linkedin', e.target.value);
                    }}
                    onBlur={handleBlurSave}
                    style={{ paddingRight: '32px' }}
                  />
                  {linkedin && (
                    <a
                      href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="input-icon-right"
                      title="Visit LinkedIn"
                    >
                      <ExternalLink size={14} />
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
                  <label htmlFor="modal-maps-employee-count">Employee Count</label>
                  <input
                    type="text"
                    id="modal-maps-employee-count"
                    className="form-control modal-dense-input"
                    placeholder="e.g. 10 - 50 employees"
                    value={employeeCount}
                    onChange={(e) => {
                      setEmployeeCount(e.target.value);
                      handleFieldChange('employeeCount', e.target.value);
                    }}
                    onBlur={handleBlurSave}
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="modal-maps-founded-year">Founded Year</label>
                  <input
                    type="text"
                    id="modal-maps-founded-year"
                    className="form-control modal-dense-input"
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

              <div className="info-grid-2">
                <div className="field-group">
                  <label htmlFor="modal-maps-annual-revenue">Annual Revenue</label>
                  <input
                    type="text"
                    id="modal-maps-annual-revenue"
                    className="form-control modal-dense-input"
                    placeholder="e.g. $5M"
                    value={annualRevenue}
                    onChange={(e) => {
                      setAnnualRevenue(e.target.value);
                      handleFieldChange('annualRevenue', e.target.value);
                    }}
                    onBlur={handleBlurSave}
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="modal-maps-total-funding">Total Funding</label>
                  <input
                    type="text"
                    id="modal-maps-total-funding"
                    className="form-control modal-dense-input"
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
                          {contact.linkedin && (
                            <a
                              href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="member-linkedin"
                              title="LinkedIn profile"
                            >
                              {getPlatformIcon('linkedin', 12)}
                            </a>
                          )}
                        </div>
                        <span className="member-title">
                          {contact.title === 'Ceo' ? 'CEO' : contact.title === 'Md' ? 'MD' : contact.title}
                        </span>
                      </div>
                    </div>

                    <div className="member-right">
                      {contact.email && contact.email !== 'No Email Found' ? (
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
                      ) : (
                        <span className="member-email pending">Pending Lookup</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CARD 6: Requirement Details */}
          <div className="detail-card">
            <div className="card-header-row">
              <h4 className="card-title">
                <MessageSquare size={14} className="header-icon" />
                Requirement / Description
              </h4>
            </div>
            <textarea
              id="modal-need-description"
              className="form-control textarea-dense"
              placeholder={isMaps ? "Scraped website company description..." : "Requirements details..."}
              value={needDescription}
              onChange={(e) => {
                setNeedDescription(e.target.value);
                handleFieldChange('needDescription', e.target.value);
              }}
              onBlur={handleBlurSave}
            />
          </div>

          {/* CARD 7: AI Outreach Pitch Generator */}
          <div className="detail-card ai-glow">
            <div className="card-header-row">
              <h4 className="card-title">
                <Sparkles size={14} className="header-icon" />
                AI Outreach Pitch Draft
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
                {generatingPitch ? 'Drafting...' : 'Generate AI pitch'}
              </button>
            </div>

            {generatingPitch && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '20px', border: '1px dashed rgba(3, 113, 114, 0.3)', borderRadius: '10px', background: 'rgba(3, 113, 114, 0.02)' }}>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '16px', height: '16px', border: '2px solid var(--primary)', borderRightColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spinner-border .75s linear infinite' }}></span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Drafting customized pitch via Llama LLM...</span>
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
                  handleFieldChange('draftEmail', e.target.value);
                }}
                onBlur={handleBlurSave}
              />
            )}

            {!hasGenerated && !generatingPitch && (
              <div className="email-placeholder">
                Click 'Generate AI pitch' to draft customized email copy based on agency settings and lead requirement.
              </div>
            )}
          </div>

          {/* CARD 8: Lead score banner */}
          <div className="detail-card">
            <div className="score-flex-box">
              <div style={{ flex: 1 }}>
                <h4 className="card-title" style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 4px 0', letterSpacing: '0.04em' }}>Lead Fit Score</h4>
                <span className={`badge ${getIntentBadgeClass(buyingIntent || 'Low')}`} style={{ textTransform: 'capitalize' }}>
                  {(buyingIntent || 'Low') + ' Intent'}
                </span>
              </div>
              <div className="score-number-badge">
                {lead.leadScore !== undefined ? lead.leadScore : Math.round((parseFloat(lead.confidenceScore) || 0) * 100)}
                <span className="total-points">/100</span>
              </div>
            </div>
          </div>

          {/* CARD 9: Inbox replies */}
          {lead.replies && lead.replies.length > 0 && (
            <div className="detail-card" style={{ borderLeft: '3px solid var(--success)' }}>
              <div className="card-header-row">
                <h4 className="card-title" style={{ color: 'var(--success)' }}>
                  <MessageSquare size={14} className="header-icon" style={{ color: 'var(--success)' }} />
                  Inbox Replies ({lead.replies.length})
                </h4>
              </div>
              <div className="team-list-container" style={{ maxHeight: '280px' }}>
                {lead.replies.map((reply, rIdx) => (
                  <div key={rIdx} className="team-member-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: '600' }}>{reply.from || reply.from_email}</span>
                      <span>{reply.date}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent)' }}>
                      Sub: {reply.subject}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                      {reply.snippet}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Premium Sticky Footer */}
        <div className="drawer-footer-premium">
          {!lead.isConverted && (
            <div className="footer-row">
              <button
                type="button"
                id="modal-btn-convert-crm"
                className="btn btn-primary"
                onClick={() => {
                  onUpdateLead(lead.sourceUrl, { isConverted: true, crmStatus: 'New' });
                  if (addToast) {
                    addToast('Lead Converted', 'Successfully converted to Outreach Pipeline Lead!', 'success');
                  }
                }}
                style={{ width: '100%' }}
              >
                <Sparkles size={13} />
                Convert to CRM Lead
              </button>
            </div>
          )}
          <div className="footer-row">
            {isMaps ? (
              <a href={lead.sourceUrl} id="modal-btn-linkedin" className="btn btn-secondary" target="_blank" rel="noreferrer">
                <MapPin size={13} color="#EF4444" fill="#EF4444" /> Show in Google Maps
              </a>
            ) : (
              <a href={lead.sourceUrl} id="modal-btn-linkedin" className="btn btn-secondary" target="_blank" rel="noreferrer">
                <ExternalLink size={13} /> View Source
              </a>
            )}
            <button
              id="modal-btn-send"
              className="btn btn-success-outline"
              disabled={!emailBody}
              onClick={handleSendPitch}
            >
              <Send size={13} /> Send Pitch
            </button>
          </div>
          <div className="footer-row">
            <button id="modal-btn-copy" onClick={handleCopyDetails} className="btn btn-secondary">
              <Copy size={13} /> Copy Details
            </button>
            <button
              id="modal-btn-copy-email"
              className="btn btn-secondary"
              disabled={!emailBody}
              onClick={handleCopyEmail}
            >
              <Mail size={13} /> Copy Pitch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
