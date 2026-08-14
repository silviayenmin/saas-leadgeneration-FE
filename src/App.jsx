import React, { useState } from 'react';
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

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [view, setView] = useState('dashboard'); // 'login', 'signup', 'otp', 'onboarding', 'dashboard'
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mapflow_user');
    return saved ? JSON.parse(saved) : { fullName: 'Demo User', email: 'demo@mapflow.ai' };
  });
  const [credits, setCredits] = useState({ creditsRemaining: 25, creditLimit: 25 });

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
        onLogout={() => {
          localStorage.clear();
          setUser(null);
        }}
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
