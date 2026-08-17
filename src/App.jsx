import React, { useState, useEffect } from 'react';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import Dashboard from './pages/Dashboard';
import LeadDiscovery from './pages/LeadDiscovery';
import MapsScans from './pages/MapsScans';
import OutreachPipeline from './pages/OutreachPipeline';
import ProfileSubscription from './pages/ProfileSubscription';
import OutreachConfig from './pages/OutreachConfig';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OtpVerification from './pages/OtpVerification';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import api from './services/api';

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
      case 'dashboard': return <Dashboard onUpgradeClick={() => setActiveTab('profile-subscription')} />;
      case 'lead-discovery': return <LeadDiscovery />;
      case 'maps-scans': return <MapsScans />;
      case 'outreach-pipeline': return <OutreachPipeline />;
      case 'profile-subscription': return <ProfileSubscription onUpgradeSuccess={fetchCredits} onProfileUpdate={(u) => setUser(u)} />;
      case 'outreach-config': return <OutreachConfig />;
      default: return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'lead-discovery': return 'Google Maps Lead Discovery';
      case 'maps-scans': return 'Maps Scans & History';
      case 'outreach-pipeline': return 'Outreach CRM Pipeline';
      case 'profile-subscription': return 'Profile & Subscription';
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
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        isMobileNavOpen={isMobileNavOpen}
        onCloseMobileNav={() => setIsMobileNavOpen(false)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          title={getPageTitle()}
          credits={credits}
          onUpgradeClick={() => setActiveTab('profile-subscription')}
          theme={theme}
          onToggleTheme={toggleTheme}
          isMobileNavOpen={isMobileNavOpen}
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-main)' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
