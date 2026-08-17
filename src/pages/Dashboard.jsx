import React, { useEffect, useState } from 'react';
import { Building2, Mail, Phone, Sparkles, TrendingUp } from 'lucide-react';
import api from '../services/api';
import './Pages.scss';

const Dashboard = ({ onUpgradeClick, onViewDetails }) => {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/');
        if (res.data.success) {
          setDashData(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="page-container"><p>Loading Dashboard analytics...</p></div>;
  }

  const kpis = dashData?.kpis || {};

  return (
    <div className="page-container animate-fade-in">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><Building2 size={22} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{kpis.businessesDiscovered || 0}</div>
            <div className="kpi-label">Businesses Discovered</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Mail size={22} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{kpis.verifiedEmails || 0}</div>
            <div className="kpi-label">Verified Emails</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Phone size={22} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{kpis.phoneNumbers || 0}</div>
            <div className="kpi-label">Phone Numbers</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Sparkles size={22} /></div>
          <div className="kpi-details">
            <div className="kpi-value">{kpis.aiPitchesGenerated || 0}</div>
            <div className="kpi-label">AI Pitches Generated</div>
          </div>
        </div>
      </div>

      <div className="data-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Recent Local Business Discoveries</h3>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Click any business to open Lead Details</span>
        </div>
        <table className="custom-table" style={{ marginTop: '16px' }}>
          <thead>
            <tr>
              <th>Business</th>
              <th>Category</th>
              <th>Location</th>
              <th>Rating</th>
              <th>AI Score</th>
              <th>Intent</th>
            </tr>
          </thead>
          <tbody>
            {dashData?.recentLeads?.length > 0 ? (
              dashData.recentLeads.map((b) => (
                <tr 
                  key={b.id}
                  onClick={() => onViewDetails && onViewDetails(b)}
                  className="clickable-row"
                  style={{ cursor: 'pointer' }}
                >
                  <td><strong>{b.name}</strong></td>
                  <td>{b.category}</td>
                  <td>{b.address}</td>
                  <td>⭐ {b.rating} ({b.reviewCount})</td>
                  <td><strong>{b.aiScore || 'N/A'}/100</strong></td>
                  <td><span className={`intent-badge ${b.intent}`}>{b.intent}</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8' }}>No businesses discovered yet. Head to Lead Discovery to start scanning!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
