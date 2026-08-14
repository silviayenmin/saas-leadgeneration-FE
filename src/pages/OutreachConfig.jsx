import React from 'react';
import './Pages.scss';

const OutreachConfig = () => {
  return (
    <div className="page-container animate-fade-in">
      <div className="data-card">
        <h2>Outreach & Integrations Configuration</h2>
        <p style={{ marginTop: '8px' }}>Configure Serper API, AI Providers (Groq/Ollama), SMTP/IMAP credentials, Google Sheets sync, and Webhooks.</p>
      </div>
    </div>
  );
};

export default OutreachConfig;
