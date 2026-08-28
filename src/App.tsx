import React, { useState } from 'react';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { StructurePage } from './pages/StructurePage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'structure'>('structure');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '60px',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📦</span>
          <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.025em' }}>
            Sistema Logístico Integral
          </span>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #334155',
            }}
          >
            Fase 004
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('structure')}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: activeTab === 'structure' ? '#2563eb' : 'transparent',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            🏢 Estructura & Almacenes
          </button>
          <button
            onClick={() => setActiveTab('system')}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: activeTab === 'system' ? '#2563eb' : 'transparent',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            ⚙️ Estado del Sistema
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main style={{ padding: '8px 0' }}>
        {activeTab === 'structure' ? <StructurePage /> : <SystemStatusPage />}
      </main>
    </div>
  );
};

export default App;
