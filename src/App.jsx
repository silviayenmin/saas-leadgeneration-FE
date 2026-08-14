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
import api from './services/api';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authState, setAuthState] = useState('login'); // 'login', 'signup', 'otp', 'onboarding', 'authenticated'
  const [user, setUser] = useState(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [credits, setCredits] = useState({ creditsRemaining: 25, creditLimit: 25 });
  const [loading, setLoading] = useState(true);

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

  // Fetch Credits when Authenticated
  useEffect(() => {
    if (authState === 'authenticated' && user) {
      const fetchCredits = async () => {
        try {
          const res = await api.get('/credits/balance');
          if (res.data.success) {
            setCredits(res.data.data);
          }
        } catch (err) {
          console.error('Failed to fetch credits balance:', err);
        }
      };
      fetchCredits();
    }
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
        onNavigate={(target) => setAuthState(target)}
        onLoginSuccess={handleLoginSuccess}
        onRequireOtp={handleRequireOtp}
      />
    );
  }

  if (authState === 'signup') {
    return (
      <Signup
        onNavigate={(target) => setAuthState(target)}
        onSignupSuccess={handleSignupSuccess}
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
      case 'profile-subscription': return <ProfileSubscription />;
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
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          title={getPageTitle()}
          credits={credits}
          onUpgradeClick={() => setActiveTab('profile-subscription')}
        />
        <main style={{ flex: 1, overflowY: 'auto', background: '#0A0F1C' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
