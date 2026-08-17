import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Sliders, ChevronDown, ChevronUp, 
  CheckCircle2, AlertCircle, Sparkles, Globe, Phone, 
  Mail, User, Database, Brain, Copy, ExternalLink, 
  Star, Plus, X, Calendar
} from 'lucide-react';
import api from '../services/api';
import './Pages.scss';

const LeadDiscovery = ({ onViewDetails }) => {
  // Form States
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [limit, setLimit] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [minRating, setMinRating] = useState(0.0);
  const [minReviews, setMinReviews] = useState(0);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(false);

  // Search execution states
  const [searching, setSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Added leads tracking (set of business IDs)
  const [addedLeads, setAddedLeads] = useState(new Set());
  const [addingLeadId, setAddingLeadId] = useState(null);

  // Fetch existing leads from CRM on mount
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
    fetchExistingLeads();
  }, []);

  // Insights / Pitch Modal
  const [selectedLead, setSelectedLead] = useState(null);
  const [pitchType, setPitchType] = useState('Website Redesign');
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [generatedPitch, setGeneratedPitch] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Stepper messages for loading animation
  const steps = [
    { title: "Querying Maps", desc: "Accessing Google Places & Scraper coordinates..." },
    { title: "Playwright Active", desc: "Spinning up browser, scrolling Map search feeds..." },
    { title: "Crawling Websites", desc: "Visiting homepages, about, contact pages for emails & owner data..." },
    { title: "Executing Llama AI", desc: "Evaluating website stack, rating metrics, scoring lead intent..." },
    { title: "Syncing Lead database", desc: "Saving profiles, indexing results, updating credits balance..." }
  ];

  // Helper: Simulate progress loading state transitions
  const startProgressSimulation = () => {
    setSearchStep(0);
    const interval = setInterval(() => {
      setSearchStep((prev) => {
        if (prev < 4) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 7000); // Transitions roughly over 35 seconds
    return interval;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim() || !location.trim()) {
      setErrorMsg("Please enter both a search keyword and target location.");
      return;
    }

    setErrorMsg('');
    setSearching(true);
    setResults([]);
    const progressTimer = startProgressSimulation();

    try {
      const res = await api.post('/maps/search', {
        keyword,
        location,
        radiusKm,
        minRating,
        minReviews,
        hasWebsite,
        verifiedEmail,
        limit
      });

      if (res.data.success) {
        setResults(res.data.data);
        setSearchStep(5); // Search is complete
      } else {
        setErrorMsg("Failed to gather results from search adapter.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "An unexpected error occurred during lead discovery.");
    } finally {
      clearInterval(progressTimer);
      setSearching(false);
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
      alert("Failed to add business to CRM pipeline.");
    } finally {
      setAddingLeadId(null);
    }
  };

  const generatePitch = async () => {
    if (!selectedLead) return;
    setGeneratingPitch(true);
    setGeneratedPitch('');
    try {
      const res = await api.post('/ai/pitch', {
        businessId: selectedLead.id,
        pitchType: pitchType
      });
      if (res.data.success) {
        setGeneratedPitch(res.data.pitch);
      }
    } catch (err) {
      console.error(err);
      setGeneratedPitch("Failed to generate custom outreach pitch. Please verify GROQ API configurations.");
    } finally {
      setGeneratingPitch(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // KPI Calculations for search results
  const totalFound = results.length;
  const ratingAvg = totalFound ? (results.reduce((acc, lead) => acc + lead.rating, 0) / totalFound).toFixed(1) : 0;
  const withWebsite = results.filter(lead => lead.website).length;
  const withEmails = results.filter(lead => lead.emails && lead.emails.length > 0).length;

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Search Console Header */}
      <div className="data-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F8FAFC' }}>Google Maps Lead Discovery</h2>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '4px' }}>
          Discover B2B local business leads. Crawl their websites for emails, identify key decision makers, and analyze intent using Llama 3.3.
        </p>

        <form onSubmit={handleSearch} style={{ marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase' }}>Search Query</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. Dentists, Real Estate, Gym"
                  style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '8px', color: '#F8FAFC', fontSize: '0.875rem', outline: 'none' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase' }}>Target Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. New York, Chennai"
                  style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'rgba(10, 15, 28, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '8px', color: '#F8FAFC', fontSize: '0.875rem', outline: 'none' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase' }}>Scrape Limit: <span style={{ color: '#0EA5A4', fontWeight: '700' }}>{limit} Leads</span></label>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                style={{ width: '100%', height: '6px', background: 'rgba(10, 15, 28, 0.8)', border: 'none', borderRadius: '4px', outline: 'none', accentColor: '#037172', margin: '14px 0' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="nav-item"
                style={{ padding: '10px 12px', background: 'rgba(148, 163, 184, 0.05)', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '8px', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', outline: 'none' }}
              >
                <Sliders size={16} />
                <span>Filters</span>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <button 
                type="submit"
                disabled={searching}
                style={{ flex: 1, padding: '10px 20px', background: 'linear-gradient(135deg, #037172 0%, #0EA5A4 100%)', border: 'none', borderRadius: '8px', color: '#F8FAFC', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(3, 113, 114, 0.3)' }}
              >
                {searching ? (
                  <>
                    <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    <span>Scraping...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Discover Leads</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Advanced Filters Drawer */}
          {showAdvanced && (
            <div className="animate-fade-in" style={{ marginTop: '20px', padding: '16px', background: 'rgba(10, 15, 28, 0.4)', borderRadius: '8px', border: '1px dashed rgba(148, 163, 184, 0.15)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '6px' }}>Radius Range (km)</label>
                <input 
                  type="number" 
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                  style={{ width: '100%', padding: '8px', background: '#0A0F1C', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '6px' }}>Minimum Rating (stars)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0"
                  max="5"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  style={{ width: '100%', padding: '8px', background: '#0A0F1C', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '6px' }}>Minimum Reviews Count</label>
                <input 
                  type="number" 
                  value={minReviews}
                  onChange={(e) => setMinReviews(parseInt(e.target.value))}
                  style={{ width: '100%', padding: '8px', background: '#0A0F1C', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94A3B8', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={hasWebsite} 
                    onChange={(e) => setHasWebsite(e.target.checked)}
                    style={{ accentColor: '#037172' }}
                  />
                  <span>Must have Website</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94A3B8', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={verifiedEmail} 
                    onChange={(e) => setVerifiedEmail(e.target.checked)}
                    style={{ accentColor: '#037172' }}
                  />
                  <span>Must have Email address</span>
                </label>
              </div>
            </div>
          )}
        </form>

        {errorMsg && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontSize: '0.875rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Visual Scrape Stepper (Loading State) */}
      {searching && (
        <div className="data-card animate-fade-in" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#F8FAFC', marginBottom: '8px' }}>Active Scraper Operations</h3>
          <p style={{ color: '#94A3B8', fontSize: '0.825rem', marginBottom: '24px', textAlign: 'center' }}>
            Playwright browser is navigating Google Maps and crawling pages. Do not close this tab.
          </p>

          <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {steps.map((step, idx) => {
              const isFinished = idx < searchStep;
              const isActive = idx === searchStep;
              
              let stepIcon = <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.1)', border: '2px solid rgba(148, 163, 184, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>{idx + 1}</div>;
              
              if (isFinished) {
                stepIcon = <CheckCircle2 size={22} style={{ color: '#22C55E' }} />;
              } else if (isActive) {
                stepIcon = (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="pulsing-ring" style={{ position: 'absolute', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(14, 165, 164, 0.25)', animation: 'ping 1.5s infinite' }} />
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0EA5A4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#0A0F1C', zIndex: 1 }}>{idx+1}</div>
                  </div>
                );
              }

              return (
                <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '12px', background: isActive ? 'rgba(3, 113, 114, 0.08)' : 'transparent', border: isActive ? '1px solid rgba(3, 113, 114, 0.2)' : '1px solid transparent', borderRadius: '8px', transition: 'all 0.3s ease' }}>
                  <div style={{ marginTop: '2px' }}>{stepIcon}</div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: isActive ? '#0EA5A4' : (isFinished ? '#22C55E' : '#94A3B8') }}>{step.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search results stats summary */}
      {results.length > 0 && !searching && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(77, 163, 255, 0.15)', color: '#4DA3FF' }}><Database size={20} /></div>
            <div className="kpi-details">
              <div className="kpi-value">{totalFound}</div>
              <div className="kpi-label">Leads Discovered</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}><Star size={20} /></div>
            <div className="kpi-details">
              <div className="kpi-value">⭐ {ratingAvg}</div>
              <div className="kpi-label">Average Review Rating</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(14, 165, 164, 0.15)', color: '#0EA5A4' }}><Globe size={20} /></div>
            <div className="kpi-details">
              <div className="kpi-value">{withWebsite}</div>
              <div className="kpi-label">Businesses with Websites</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}><Mail size={20} /></div>
            <div className="kpi-details">
              <div className="kpi-value">{withEmails}</div>
              <div className="kpi-label">Emails Discovered</div>
            </div>
          </div>
        </div>
      )}

      {/* Discovered Leads Cards Grid */}
      {results.length > 0 && !searching && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '8px' }}>
          {results.map((lead) => {
            const isAdded = addedLeads.has(lead.id);
            return (
              <div key={lead.id} className="data-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', gap: '16px', position: 'relative' }}>
                
                {/* Score badge at the top right */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '6px' }}>
                  <span className={`intent-badge ${lead.intent}`} style={{ fontSize: '0.675rem' }}>{lead.intent}</span>
                  <div style={{ background: 'rgba(14, 165, 164, 0.1)', border: '1px solid rgba(14, 165, 164, 0.3)', color: '#0EA5A4', padding: '4px 8px', borderRadius: '9999px', fontSize: '0.725rem', fontWeight: '700' }}>
                    Score: {lead.aiScore}
                  </div>
                </div>

                <div>
                  {/* Category */}
                  <span style={{ fontSize: '0.7rem', color: '#0EA5A4', fontWeight: '700', textTransform: 'uppercase', tracking: '0.5px' }}>{lead.category}</span>
                  
                  {/* Name */}
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#F8FAFC', marginTop: '4px', pr: '80px', lineHeight: '1.4' }}>{lead.name}</h3>
                  
                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.8rem', color: '#94A3B8' }}>
                    <Star size={12} fill="#F59E0B" color="#F59E0B" />
                    <span style={{ color: '#F8FAFC', fontWeight: '600' }}>{lead.rating}</span>
                    <span>({lead.reviewCount} reviews)</span>
                  </div>

                  <hr style={{ border: 'none', borderBottom: '1px solid rgba(148, 163, 184, 0.08)', margin: '14px 0' }} />

                  {/* Contact Info Table */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.8rem' }}>
                      <MapPin size={14} style={{ color: '#64748B', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: '#94A3B8' }}>{lead.address}</span>
                    </div>

                    {lead.phone && (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.8rem' }}>
                        <Phone size={14} style={{ color: '#64748B' }} />
                        <a href={`tel:${lead.phone}`} style={{ color: '#94A3B8', textDecoration: 'none' }}>{lead.phone}</a>
                      </div>
                    )}

                    {lead.website && (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.8rem' }}>
                        <Globe size={14} style={{ color: '#64748B' }} />
                        <a href={lead.website} target="_blank" rel="noreferrer" style={{ color: '#4DA3FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Visit Website</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}

                    {lead.owner && (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.8rem' }}>
                        <User size={14} style={{ color: '#64748B' }} />
                        <span style={{ color: '#94A3B8' }}>CEO/Owner: <strong style={{ color: '#F8FAFC' }}>{lead.owner}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Emails list */}
                  {lead.emails && lead.emails.length > 0 && (
                    <div style={{ marginTop: '14px' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>Scraped Emails</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {lead.emails.map((eObj, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => copyToClipboard(eObj.email)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(14, 165, 164, 0.1)', border: '1px solid rgba(14, 165, 164, 0.2)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', color: '#0EA5A4', cursor: 'pointer', hover: { opacity: 0.8 } }}
                            title="Click to copy email"
                          >
                            <Mail size={10} />
                            <span>{eObj.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social links */}
                  {lead.socialLinks && Object.values(lead.socialLinks).some(Boolean) && (
                    <div style={{ marginTop: '14px' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>Social Presence</span>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {lead.socialLinks.linkedin && (
                          <a href={lead.socialLinks.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#4DA3FF', textDecoration: 'none', background: 'rgba(77, 163, 255, 0.1)', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>LinkedIn</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Bottom Action buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  
                  <button
                    onClick={() => onViewDetails(lead)}
                    style={{ flex: 1, padding: '8px 12px', background: 'rgba(148, 163, 184, 0.05)', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Brain size={14} style={{ color: '#0EA5A4' }} />
                    <span>Insights & Pitch</span>
                  </button>

                  <button
                    disabled={isAdded || addingLeadId === lead.id}
                    onClick={() => handleAddToCRM(lead)}
                    style={{ 
                      flex: 1, 
                      padding: '8px 12px', 
                      background: isAdded ? 'rgba(34, 197, 94, 0.1)' : 'linear-gradient(135deg, #037172 0%, #0EA5A4 100%)', 
                      border: isAdded ? '1px solid rgba(34, 197, 94, 0.2)' : 'none', 
                      borderRadius: '6px', 
                      color: isAdded ? '#22C55E' : '#F8FAFC', 
                      fontSize: '0.8rem', 
                      fontWeight: '600', 
                      cursor: isAdded ? 'default' : 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px' 
                    }}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>In CRM Pipeline</span>
                      </>
                    ) : (
                      <>
                        {addingLeadId === lead.id ? (
                          <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        ) : (
                          <Plus size={14} />
                        )}
                        <span>Add to CRM</span>
                      </>
                    )}
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Copy notification confirmation */}
      {copySuccess && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#0A0F1C', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px', animation: 'slide-in 0.2s ease-out' }}>
          <CheckCircle2 size={16} />
          <span>Email copied to clipboard!</span>
        </div>
      )}

      {/* Details/AI Pitch overlay modal */}
      {selectedLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10, 15, 28, 0.8)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          
          <div className="data-card animate-fade-in" style={{ width: '100%', maxWidth: '650px', background: '#111827', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', padding: 0, overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#0EA5A4', fontWeight: '700', textTransform: 'uppercase' }}>AI Evaluation Insights</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F8FAFC', marginTop: '2px' }}>{selectedLead.name}</h3>
              </div>
              <button 
                onClick={() => { setSelectedLead(null); setGeneratedPitch(''); }}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Score section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', background: 'rgba(10, 15, 28, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(148, 163, 184, 0.08)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0EA5A4' }}>{selectedLead.aiScore}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginTop: '2px' }}>AI Score</div>
                  <span className={`intent-badge ${selectedLead.intent}`} style={{ marginTop: '8px', fontSize: '0.675rem' }}>{selectedLead.intent} Intent</span>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#F8FAFC' }}>Intent Reasoning</h4>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '6px', lineHeight: '1.5' }}>{selectedLead.reasoning || 'No details analyzed.'}</p>
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
                    onClick={generatePitch}
                    disabled={generatingPitch}
                    style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #037172 0%, #0EA5A4 100%)', border: 'none', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {generatingPitch ? (
                      <>
                        <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate Pitch</span>
                      </>
                    )}
                  </button>

                </div>

                {generatedPitch && (
                  <div className="animate-fade-in" style={{ marginTop: '16px', background: 'rgba(10, 15, 28, 0.6)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.12)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                      <span style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Email Pitch Preview</span>
                      <button 
                        onClick={() => copyToClipboard(generatedPitch)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#0EA5A4', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        <Copy size={12} />
                        <span>Copy Email</span>
                      </button>
                    </div>
                    <pre style={{ padding: '16px', fontSize: '0.8rem', color: '#94A3B8', whiteSpace: 'pre-wrap', fontFamily: 'Inter, system-ui, sans-serif', margin: 0, maxHeight: '200px', overflowY: 'auto', lineHeight: '1.6' }}>
                      {generatedPitch}
                    </pre>
                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid rgba(148, 163, 184, 0.08)' }}>
              <button 
                onClick={() => { setSelectedLead(null); setGeneratedPitch(''); }}
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

export default LeadDiscovery;
