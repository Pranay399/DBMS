// Re-exports the core query explorer logic — components defined in App.jsx are passed as props
import React from 'react';
import { QUERIES, PARTS, PART_TITLES, QueryCard } from '../App';

export default function SqlExplorerPage({ setPage: setAppPage }) {
  const [page, setPage] = React.useState('overview');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sub-sidebar */}
      <aside style={{
        width: 220, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
        padding: '12px 0', overflowY: 'auto', flexShrink: 0
      }}>
        <div style={{ padding: '12px 16px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          SQL Categories
        </div>
        {PARTS.filter(p => p.id !== 'overview').map(p => (
          <div key={p.id}
            onClick={() => setPage(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              cursor: 'pointer', fontSize: 12, fontWeight: 500,
              color: page === p.id ? 'var(--accent-bright)' : 'var(--text-secondary)',
              background: page === p.id ? 'rgba(59,130,246,0.08)' : 'transparent',
              borderLeft: `2px solid ${page === p.id ? 'var(--accent)' : 'transparent'}`,
              transition: 'all 0.2s'
            }}>
            <span>{p.icon}</span>
            <span>Part {p.id} — {p.label}</span>
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700,
              padding: '1px 5px', borderRadius: 10,
              background: 'rgba(59,130,246,0.15)', color: 'var(--accent-bright)'
            }}>{p.badge}</span>
          </div>
        ))}
        <div style={{ padding: '12px 16px 0', marginTop: 8, borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setAppPage('home')} style={{
            width: '100%', padding: '7px 0', background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.3)', color: 'var(--accent-bright)',
            borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}>← Back to App</button>
        </div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            {PARTS.find(p => p.id === page)?.icon} {PART_TITLES[page] || 'SQL Query Explorer'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Click "▶ Run Query" on any card to execute it live against the MySQL database
          </div>
        </div>
        <div className="queries-grid">
          {QUERIES.filter(q => q.part === page).map(q => <QueryCard key={q.id} q={q} />)}
        </div>
        {!QUERIES.find(q => q.part === page) && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 60, fontSize: 14 }}>
            Select a category from the left sidebar to explore queries.
          </div>
        )}
      </div>
    </div>
  );
}
