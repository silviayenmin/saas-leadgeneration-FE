import React from 'react';
import { Bell, Coins, ArrowUpRight, Sun, Moon, Menu } from 'lucide-react';
import './Header.scss';

const Header = ({ title, credits, onUpgradeClick, theme, onToggleTheme, isMobileNavOpen, onToggleMobileNav, user, onProfileClick }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className={`mobile-menu-btn ${isMobileNavOpen ? 'active' : ''}`}
          onClick={onToggleMobileNav}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} className="menu-icon" />
        </button>
        <div className="header-title">
          <h1>{title}</h1>
        </div>
      </div>

      <div className="header-actions">
        <div className="credit-badge" onClick={onUpgradeClick} title="View subscription & credits">
          <Coins size={15} className="coins-icon" />
          <span className="credit-text">
            <strong>{credits?.creditsRemaining ?? 0}</strong>/{credits?.creditLimit ?? 25} <span className="credit-label-full">Credits</span>
          </span>
          <button className="upgrade-pill">
            <span className="upgrade-text">Upgrade</span> <ArrowUpRight size={11} />
          </button>
        </div>

        <button
          className="icon-btn theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="icon-btn" title="Notifications">
          <Bell size={18} />
        </button>

        <button 
          className="header-user-avatar-btn" 
          onClick={onProfileClick} 
          title="Profile Settings"
        >
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </button>
      </div>
    </header>
  );
};

export default Header;
