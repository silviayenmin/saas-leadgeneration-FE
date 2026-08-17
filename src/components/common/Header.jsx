import React from 'react';
import { Search, Bell, Coins, ArrowUpRight, Sun, Moon } from 'lucide-react';
import './Header.scss';

const Header = ({ title, credits, onUpgradeClick, theme, onToggleTheme }) => {
  return (
    <header className="app-header">
      <div className="header-title">
        <h1>{title}</h1>
      </div>

      <div className="header-actions">
        <div className="header-search">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Search leads, businesses..." />
        </div>

        <div className="credit-badge" onClick={onUpgradeClick}>
          <Coins size={16} className="coins-icon" />
          <span className="credit-text">
            <strong>{credits?.creditsRemaining ?? 0}</strong> / {credits?.creditLimit ?? 25} Credits
          </span>
          <button className="upgrade-pill">
            Upgrade <ArrowUpRight size={12} />
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
      </div>
    </header>
  );
};

export default Header;
