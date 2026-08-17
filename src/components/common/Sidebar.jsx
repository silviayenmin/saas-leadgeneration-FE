import React from 'react';
import { LayoutDashboard, MapPin, History, Kanban, User, Settings, Sparkles, LogOut, X } from 'lucide-react';
import './Sidebar.scss';

const Sidebar = ({ activeTab, setActiveTab, user, onLogout, isMobileNavOpen, onCloseMobileNav }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lead-discovery', label: 'Lead Discovery', icon: MapPin },
    { id: 'maps-scans', label: 'Maps Scans', icon: History },
    { id: 'outreach-pipeline', label: 'Outreach Pipeline', icon: Kanban },
    { id: 'profile-subscription', label: 'Profile & Subscription', icon: User },
    { id: 'outreach-config', label: 'Outreach Config', icon: Settings },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (onCloseMobileNav) {
      onCloseMobileNav();
    }
  };

  return (
    <aside className={`app-sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-left">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>
          <span className="brand-text">MAPFLOW AI</span>
        </div>
        <button className="mobile-close-btn" onClick={onCloseMobileNav} title="Close Navigation">
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.fullName?.charAt(0) || 'U'}</div>
          <div className="user-details">
            <div className="user-name">{user?.fullName || 'MapFlow User'}</div>
            <div className="user-email">{user?.email || 'user@mapflow.ai'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Sign Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
