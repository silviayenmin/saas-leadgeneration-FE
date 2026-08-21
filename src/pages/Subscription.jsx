import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Coins,
  History,
  Check,
  CheckCircle,
  AlertCircle,
  X,
  Building2,
  Briefcase,
  Mail
} from 'lucide-react';
import api from '../services/api';
import './ProfileSubscription.scss';

export default function Subscription({ onUpgradeSuccess }) {
  const [activeTab, setActiveTab] = useState('subscription'); // 'subscription', 'transactions'
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgradingPlanKey, setUpgradingPlanKey] = useState(null);

  const [tabScrollState, setTabScrollState] = useState({ canScrollLeft: false, canScrollRight: true });
  const [tableScrollState, setTableScrollState] = useState({ canScrollLeft: false, canScrollRight: true });
  const tabsRef = useRef(null);
  const tableRef = useRef(null);
  const tabBtnRefs = useRef({});

  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleTabsScroll = () => {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setTabScrollState({
      canScrollLeft: scrollLeft > 8,
      canScrollRight: scrollLeft + clientWidth < scrollWidth - 8,
    });
  };

  const handleTableScroll = () => {
    if (!tableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
    setTableScrollState({
      canScrollLeft: scrollLeft > 8,
      canScrollRight: scrollLeft + clientWidth < scrollWidth - 8,
    });
  };

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    const targetEl = tabBtnRefs.current[tabKey];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleTabsScroll();
      handleTableScroll();
      if (tabBtnRefs.current[activeTab]) {
        tabBtnRefs.current[activeTab].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 100);
    window.addEventListener('resize', handleTabsScroll);
    window.addEventListener('resize', handleTableScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleTabsScroll);
      window.removeEventListener('resize', handleTableScroll);
    };
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const [subRes, plansRes, txRes] = await Promise.all([
        api.get('/subscription/current'),
        api.get('/subscription/plans'),
        api.get('/credits/transactions').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (subRes.data.success) {
        setSubscription(subRes.data.data);
      }

      if (plansRes.data.success) {
        setPlans(plansRes.data.data);
      }

      if (txRes.data.success) {
        setTransactions(txRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (msg.text) {
      const timer = setTimeout(() => {
        setMsg({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const handleUpgradePlan = async (planKey) => {
    setUpgradingPlanKey(planKey);
    setMsg({ type: '', text: '' });

    try {
      const res = await api.post(`/subscription/upgrade?plan_key=${planKey}`);
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        const subRes = await api.get('/subscription/current');
        if (subRes.data.success) {
          setSubscription(subRes.data.data);
        }
        if (onUpgradeSuccess) {
          onUpgradeSuccess();
        }
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to upgrade plan.' });
    } finally {
      setUpgradingPlanKey(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ color: 'var(--text-muted)' }}>Loading Subscription plans...</p>
      </div>
    );
  }

  const currentPlanKey = subscription?.plan || 'FREE';
  const creditsRemaining = subscription?.creditsRemaining ?? 25;
  const creditLimit = subscription?.creditLimit ?? 25;
  const usagePct = Math.min(100, Math.round(((creditLimit - creditsRemaining) / creditLimit) * 100)) || 0;

  return (
    <div className="page-container profile-sub-container animate-fade-in" style={{ padding: '1rem', gap: '1rem' }}>
      {/* Hero Header Banner */}
      <div className="profile-hero-card">
        <div className="hero-left">
          <div className="hero-avatar" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))' }}>
            <Coins size={28} />
          </div>
          <div className="hero-meta">
            <h2>Subscription & Billing</h2>
            <div className="hero-subtext">
              Manage your lead discovery credit quota, billing plans, and upgrades.
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className={`plan-pill ${currentPlanKey}`}>
            <Zap size={14} />
            <span>{currentPlanKey.replace('_', ' ')} PLAN</span>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {msg.text && (
        <div className={`toast-banner-alert ${msg.type}`} style={{ marginBottom: '1rem' }}>
          <div className="toast-content">
            <div className="toast-icon-wrapper">
              {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            </div>
            <div className="toast-text">
              <strong>{msg.type === 'error' ? 'Failed' : 'Success!'}</strong>
              <p>{msg.text}</p>
            </div>
          </div>
          <button className="btn-dismiss-toast" onClick={() => setMsg({ type: '', text: '' })} aria-label="Dismiss alert">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div
        className={`sub-tabs-wrapper ${tabScrollState.canScrollLeft ? 'show-left-smog' : ''} ${tabScrollState.canScrollRight ? 'show-right-smog' : ''}`}
      >
        <div className="sub-tabs-bar" ref={tabsRef} onScroll={handleTabsScroll}>
          <button
            ref={(el) => (tabBtnRefs.current['subscription'] = el)}
            className={`sub-tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
            onClick={() => handleTabClick('subscription')}
          >
            <Zap size={16} /> Plans & Upgrades
          </button>
          <button
            ref={(el) => (tabBtnRefs.current['transactions'] = el)}
            className={`sub-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => handleTabClick('transactions')}
          >
            <History size={16} /> Credit Transactions
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="full-width-content animate-fade-in" style={{ width: '100%' }}>
        {activeTab === 'subscription' && (
          <>
            {/* Credit Usage Summary Box */}
            <div className="credit-usage-card" style={{ marginBottom: '1.5rem' }}>
              <div className="usage-header">
                <div className="usage-title">
                  <Coins size={20} className="coins-icon" />
                  <span>Credit Balance & Consumption</span>
                </div>
                <div className="usage-stats">
                  <span>{creditsRemaining}</span> / {creditLimit} Credits Available
                </div>
              </div>

              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${100 - usagePct}%` }}
                ></div>
              </div>

              <div className="usage-sub">
                Your credits reset automatically each billing cycle based on your selected plan.
              </div>
            </div>

             {/* Pricing Plans Cards */}
            <div className="plans-grid">
              {/* Free Plan */}
              <div className={`plan-card ${plans.FREE?.isPopular ? 'popular' : ''} ${currentPlanKey === 'FREE' ? 'current' : ''}`}>
                {plans.FREE?.badge && <div className="popular-badge">{plans.FREE.badge}</div>}
                <div className="plan-header">
                  <h4>Free Explorer</h4>
                  <div className="price-tag">
                    <span className="amount">${plans.FREE?.price !== undefined ? plans.FREE.price : 0}</span>
                    <span className="period">/ month</span>
                  </div>
                  <div className="credits-pill">{plans.FREE?.credits?.toLocaleString() || 25} Lead Discovery Credits</div>
                </div>

                <div className="plan-features">
                  {plans.FREE?.features && plans.FREE.features.length > 0 ? (
                    plans.FREE.features.map((feat, idx) => (
                      <div key={idx} className="feature-item"><Check size={16} className="check-icon" /> {feat}</div>
                    ))
                  ) : (
                    <>
                      <div className="feature-item"><Check size={16} className="check-icon" /> Basic Google Maps Lead Search</div>
                      <div className="feature-item"><Check size={16} className="check-icon" /> Standard Email & Phone Extraction</div>
                      <div className="feature-item"><Check size={16} className="check-icon" /> CSV Lead Export</div>
                    </>
                  )}
                </div>

                <button
                  className={`btn-plan-action ${currentPlanKey === 'FREE' ? 'active-plan' : 'btn-upgrade'}`}
                  disabled={currentPlanKey === 'FREE' || upgradingPlanKey === 'FREE'}
                  onClick={() => handleUpgradePlan('FREE')}
                >
                  {currentPlanKey === 'FREE'
                    ? 'Current Plan'
                    : upgradingPlanKey === 'FREE'
                    ? 'Updating...'
                    : 'Downgrade to Free'}
                </button>
              </div>

              {/* Starter Plan */}
              <div className={`plan-card ${plans.STARTER?.isPopular ? 'popular' : ''} ${currentPlanKey === 'STARTER' ? 'current' : ''}`}>
                {plans.STARTER?.badge && <div className="popular-badge">{plans.STARTER.badge}</div>}
                <div className="plan-header">
                  <h4>Starter Pro</h4>
                  <div className="price-tag">
                    <span className="amount">${plans.STARTER?.price !== undefined ? plans.STARTER.price : 29}</span>
                    <span className="period">/ month</span>
                  </div>
                  <div className="credits-pill">{plans.STARTER?.credits?.toLocaleString() || 500} Lead Discovery Credits</div>
                </div>

                <div className="plan-features">
                  {plans.STARTER?.features && plans.STARTER.features.length > 0 ? (
                    plans.STARTER.features.map((feat, idx) => (
                      <div key={idx} className="feature-item"><Check size={16} className="check-icon" /> {feat}</div>
                    ))
                  ) : (
                    <>
                      <div className="feature-item"><Check size={16} className="check-icon" /> Advanced Local Maps Lead Discovery</div>
                      <div className="feature-item"><Check size={16} className="check-icon" /> Deep Email & Social Profile Enrichment</div>
                      <div className="feature-item"><Check size={16} className="check-icon" /> AI Cold Outreach Pitch Generator</div>
                      <div className="feature-item"><Check size={16} className="check-icon" /> CRM Outreach Pipeline Tracking</div>
                    </>
                  )}
                </div>

                <button
                  className={`btn-plan-action ${currentPlanKey === 'STARTER' ? 'active-plan' : 'btn-upgrade'}`}
                  disabled={currentPlanKey === 'STARTER' || upgradingPlanKey === 'STARTER'}
                  onClick={() => handleUpgradePlan('STARTER')}
                >
                  {currentPlanKey === 'STARTER'
                    ? 'Current Plan'
                    : upgradingPlanKey === 'STARTER'
                    ? 'Upgrading...'
                    : `Upgrade to Starter ($${plans.STARTER?.price || 29}/mo)`}
                </button>
              </div>

              {/* Agency Pro Plan */}
              <div className={`plan-card ${plans.AGENCY_PRO?.isPopular ? 'popular' : ''} ${currentPlanKey === 'AGENCY_PRO' ? 'current' : ''}`}>
                {plans.AGENCY_PRO?.badge && <div className="popular-badge">{plans.AGENCY_PRO.badge}</div>}
                <div className="plan-header">
                  <h4>Agency Pro</h4>
                  <div className="price-tag">
                    <span className="amount">${plans.AGENCY_PRO?.price !== undefined ? plans.AGENCY_PRO.price : 79}</span>
                    <span className="period">/ month</span>
                  </div>
                  <div className="credits-pill">{plans.AGENCY_PRO?.credits?.toLocaleString() || 2500} Lead Discovery Credits</div>
                </div>

                <div className="plan-features">
                  {plans.AGENCY_PRO?.features && plans.AGENCY_PRO.features.length > 0 ? (
                    plans.AGENCY_PRO.features.map((feat, idx) => (
                      <div key={idx} className="feature-item"><Check size={16} className="check-icon" /> {feat}</div>
                    ))
                  ) : (
                    <>
                      <div className="feature-item"><Check size={16} className="check-icon" /> Unlimited Map Scans & Lead Scraping</div>
                      <div className="feature-item"><Check size={16} className="check-icon" /> Full AI Website Intelligence & Audit</div>
                      <div className="feature-item"><Check size={16} className="check-icon" /> Automated Multi-Channel Cold Pitches</div>
                      <div className="feature-item"><Check size={16} className="check-icon" /> Priority API & Integration Connectors</div>
                    </>
                  )}
                </div>

                <button
                  className={`btn-plan-action ${currentPlanKey === 'AGENCY_PRO' ? 'active-plan' : 'btn-upgrade'}`}
                  disabled={currentPlanKey === 'AGENCY_PRO' || upgradingPlanKey === 'AGENCY_PRO'}
                  onClick={() => handleUpgradePlan('AGENCY_PRO')}
                >
                  {currentPlanKey === 'AGENCY_PRO'
                    ? 'Current Plan'
                    : upgradingPlanKey === 'AGENCY_PRO'
                    ? 'Upgrading...'
                    : `Upgrade to Agency Pro ($${plans.AGENCY_PRO?.price || 79}/mo)`}
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: Credit Transactions History */}
        {activeTab === 'transactions' && (
          <div className="data-card">
            <div className="card-header-flex">
              <h3>Credit Activity & Transaction Log</h3>
              <span className="card-sub-info">Showing recent 10 transactions (latest first)</span>
            </div>

            <div
              className={`table-responsive ${tableScrollState.canScrollLeft ? 'show-left-smog' : ''} ${tableScrollState.canScrollRight ? 'show-right-smog' : ''}`}
              ref={tableRef}
              onScroll={handleTableScroll}
            >
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Activity Description</th>
                    <th>Credits Consumed</th>
                    <th>Remaining Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sortedTxs = [...transactions].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
                    const recentTxs = sortedTxs.slice(0, 10);
                    return recentTxs.length > 0 ? (
                      recentTxs.map((tx, idx) => (
                        <tr key={idx}>
                          <td>{new Date(tx.timestamp || Date.now()).toLocaleString()}</td>
                          <td><strong>{tx.action || 'Lead Discovery Search'}</strong></td>
                          <td style={{ color: 'var(--error)', fontWeight: 'bold' }}>-{tx.amount || 1}</td>
                          <td>{tx.balanceAfter ?? creditsRemaining}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          No credit transactions logged yet. Perform a Google Maps scan to view activity!
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
