import React, { useState, useEffect } from 'react';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import Dashboard from './pages/Dashboard';
import LeadDiscovery from './pages/LeadDiscovery';
import MapsScans from './pages/MapsScans';
import OutreachPipeline from './pages/OutreachPipeline';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import OutreachConfig from './pages/OutreachConfig';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OtpVerification from './pages/OtpVerification';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import api from './services/api';
import LeadDetailModal from './components/Modals/LeadDetailModal';

const App = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('mapflow_active_tab') || 'dashboard';
  });
  const [authState, setAuthState] = useState('login'); // 'login', 'signup', 'otp', 'onboarding', 'authenticated'
  const [user, setUser] = useState(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');
  const [credits, setCredits] = useState({ creditsRemaining: 25, creditLimit: 25 });
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mapflow_theme') || 'dark';
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [searches, setSearches] = useState([]);
  const [activeLead, setActiveLead] = useState(null);

  const handleTabChange = (tabName) => {
    setActiveLead(null);
    setActiveTab(tabName);
  };

  const fetchLeadsAndSearches = async () => {
    try {
      const [resLeads, resSearches] = await Promise.all([
        api.get('/leads'),
        api.get('/searches')
      ]);
      if (resLeads.data && resLeads.data.leads) {
        setLeads(resLeads.data.leads);
      }
      if (resSearches.data && resSearches.data.searches) {
        setSearches(resSearches.data.searches);
      }
    } catch (err) {
      console.error("Failed to load initial lead or search data:", err);
    }
  };

  useEffect(() => {
    if (authState === 'authenticated') {
      fetchLeadsAndSearches();
    }
  }, [authState]);

  const handleUpdateLead = async (arg1, arg2) => {
    let sourceUrl = '';
    let fields = {};
    let updatedLeadObj = null;

    if (typeof arg1 === 'string') {
      sourceUrl = arg1;
      fields = arg2 || {};
      const existing = leads.find((l) => l.sourceUrl === sourceUrl);
      if (existing) {
        updatedLeadObj = { ...existing, ...fields };
      } else {
        updatedLeadObj = { sourceUrl, ...fields };
      }
    } else {
      updatedLeadObj = arg1;
      sourceUrl = updatedLeadObj.sourceUrl;
      fields = updatedLeadObj;
    }

    // Update local state instantly for crisp visual response
    setLeads((prevLeads) =>
      prevLeads.map((l) => (l.sourceUrl === sourceUrl ? updatedLeadObj : l))
    );
    if (activeLead && activeLead.sourceUrl === sourceUrl) {
      setActiveLead(updatedLeadObj);
    }

    // Sync updates to MongoDB/JSON database in the BE
    try {
      await api.post('/leads/update', {
        sourceUrl,
        crmStatus: fields.crmStatus || updatedLeadObj.crmStatus || 'New',
        draftEmail: fields.draftEmail || updatedLeadObj.draftEmail || '',
        isConverted: fields.isConverted !== undefined ? fields.isConverted : updatedLeadObj.isConverted,
        companyName: fields.companyName || updatedLeadObj.companyName,
        buyingIntent: fields.buyingIntent || updatedLeadObj.buyingIntent,
        intentType: fields.intentType || updatedLeadObj.intentType,
        serviceRequired: fields.serviceRequired || updatedLeadObj.serviceRequired,
        industry: fields.industry || updatedLeadObj.industry,
        location: fields.location || updatedLeadObj.location,
        employeeCount: fields.employeeCount || updatedLeadObj.employeeCount,
        foundedYear: fields.foundedYear || updatedLeadObj.foundedYear,
        keyContacts: fields.keyContacts || updatedLeadObj.keyContacts,
        annualRevenue: fields.annualRevenue || updatedLeadObj.annualRevenue,
        totalFunding: fields.totalFunding || updatedLeadObj.totalFunding,
        keyContactsSource: fields.keyContactsSource || updatedLeadObj.keyContactsSource,
        needDescription: fields.needDescription || updatedLeadObj.needDescription,
        contactInfo: fields.contactInfo || updatedLeadObj.contactInfo,
        platform: fields.platform || updatedLeadObj.platform,
        workPreference: fields.workPreference || updatedLeadObj.workPreference,
        skills: fields.skills || updatedLeadObj.skills,
        search_type: fields.search_type || updatedLeadObj.search_type,
        phone: fields.phone || updatedLeadObj.phone,
        rating: fields.rating || updatedLeadObj.rating,
        reviews: fields.reviews || updatedLeadObj.reviews,
        website: fields.website || updatedLeadObj.website,
        authorName: fields.authorName || updatedLeadObj.authorName
      });
    } catch (err) {
      console.error('Failed to persist lead update to backend:', err);
    }
  };

  // Keep activeTab persisted in localStorage
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('mapflow_active_tab', activeTab);
    }
  }, [activeTab]);

  // Keep theme attribute updated on html element & localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mapflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initialize Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('mapflow_token') || sessionStorage.getItem('mapflow_token');
      if (token) {
        try {
          const res = await api.get('/users/me');
          if (res.data.success) {
            const userData = res.data.data;
            setUser(userData);
            if (!userData.onboardingCompleted) {
              setAuthState('onboarding');
            } else {
              setAuthState('authenticated');
            }
          } else {
            setAuthState('login');
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          localStorage.clear();
          sessionStorage.clear();
          setAuthState('login');
        }
      } else {
        setAuthState('login');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch Credits helper
  const fetchCredits = async () => {
    if (authState === 'authenticated' && user) {
      try {
        const res = await api.get('/credits/balance');
        if (res.data.success) {
          setCredits(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch credits balance:', err);
      }
    }
  };

  // Fetch Credits when Authenticated
  useEffect(() => {
    fetchCredits();
  }, [authState, user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (!userData.onboardingCompleted) {
      setAuthState('onboarding');
    } else {
      setAuthState('authenticated');
    }
  };

  const handleSignupSuccess = (email) => {
    setOtpEmail(email);
    setAuthState('otp');
  };

  const handleRequireOtp = (email) => {
    setOtpEmail(email);
    setAuthState('otp');
  };


  const handleOtpVerifySuccess = (userData) => {
    setUser(userData);
    if (!userData.onboardingCompleted) {
      setAuthState('onboarding');
    } else {
      setAuthState('authenticated');
    }
  };

  const handleOnboardingComplete = () => {
    setUser((prev) => ({ ...prev, onboardingCompleted: true }));
    setAuthState('authenticated');
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setAuthState('login');
  };

  const handleNavigate = (target, payload) => {
    if (target === 'forgot-password') {
      setForgotPasswordEmail(payload || '');
    }
    if (target === 'login') {
      setLoginSuccessMsg(payload || '');
    }
    setAuthState(target);
  };

  const handleResetSuccess = (msg) => {
    setLoginSuccessMsg(msg);
    setAuthState('login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#0A0F1C', color: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Inter', fontSize: '1rem', color: '#94A3B8' }}>Loading MapFlow AI...</p>
      </div>
    );
  }

  // Render Authentication Views
  if (authState === 'login') {
    return (
      <Login
        onNavigate={handleNavigate}
        onLoginSuccess={handleLoginSuccess}
        onRequireOtp={handleRequireOtp}
        successMessage={loginSuccessMsg}
      />
    );
  }

  if (authState === 'signup') {
    return (
      <Signup
        onNavigate={handleNavigate}
        onSignupSuccess={handleSignupSuccess}
      />
    );
  }

  if (authState === 'forgot-password') {
    return (
      <ForgotPassword
        onNavigate={handleNavigate}
        onResetSuccess={handleResetSuccess}
        initialEmail={forgotPasswordEmail}
      />
    );
  }

  if (authState === 'otp') {
    return (
      <OtpVerification
        email={otpEmail}
        onVerifySuccess={handleOtpVerifySuccess}
      />
    );
  }


  if (authState === 'onboarding') {
    return (
      <Onboarding
        user={user}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Render Authenticated Dashboard & Workspace Layout
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return (
          <Dashboard 
            leads={leads} 
            searches={searches} 
            onOpenLead={setActiveLead} 
            onSwitchTab={handleTabChange} 
            onUpgradeClick={() => handleTabChange('profile-subscription')} 
          />
        );
      case 'lead-discovery': 
        return (
          <LeadDiscovery 
            leads={leads}
            setLeads={setLeads}
            searches={searches}
            setSearches={setSearches}
            onSwitchTab={handleTabChange}
            onOpenLead={setActiveLead}
            refreshCredits={fetchCredits}
            credits={credits}
          />
        );
      case 'maps-scans': 
        return (
          <MapsScans 
            leads={leads}
            setLeads={setLeads}
            searches={searches}
            setSearches={setSearches}
            onOpenLead={setActiveLead}
            onUpdateLead={handleUpdateLead}
          />
        );
      case 'outreach-pipeline':
        return (
          <OutreachPipeline
            leads={leads}
            onUpdateLead={handleUpdateLead}
            onOpenLead={setActiveLead}
            onRefresh={fetchLeadsAndSearches}
          />
        );
      case 'profile': return <Profile onProfileUpdate={(u) => setUser(u)} onSwitchTab={handleTabChange} />;
      case 'subscription': return <Subscription onUpgradeSuccess={fetchCredits} />;
      case 'outreach-config': return <OutreachConfig />;
      default: 
        return (
          <Dashboard 
            leads={leads} 
            searches={searches} 
            onOpenLead={setActiveLead} 
            onSwitchTab={handleTabChange} 
            onUpgradeClick={() => handleTabChange('subscription')} 
          />
        );
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'lead-discovery': return 'Google Maps Lead Discovery';
      case 'maps-scans': return 'Maps Scans & History';
      case 'outreach-pipeline': return 'Outreach CRM Pipeline';
      case 'profile': return 'Profile Settings';
      case 'subscription': return 'Subscription & Billing';
      case 'outreach-config': return 'Outreach & API Config';
      default: return 'Dashboard';
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div
        className={`mobile-nav-backdrop ${isMobileNavOpen ? 'open' : ''}`}
        onClick={() => setIsMobileNavOpen(false)}
      />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        user={user}
        onLogout={handleLogout}
        isMobileNavOpen={isMobileNavOpen}
        onCloseMobileNav={() => setIsMobileNavOpen(false)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          title={getPageTitle()}
          credits={credits}
          onUpgradeClick={() => handleTabChange('subscription')}
          theme={theme}
          onToggleTheme={toggleTheme}
          isMobileNavOpen={isMobileNavOpen}
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
          user={user}
          onProfileClick={() => handleTabChange('profile')}
        />
        <main style={activeLead ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-main)' } : { flex: 1, overflowY: 'auto', background: 'var(--bg-main)' }}>
          {activeLead ? (
            <LeadDetailModal
              lead={activeLead}
              onClose={() => setActiveLead(null)}
              onUpdateLead={handleUpdateLead}
            />
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
