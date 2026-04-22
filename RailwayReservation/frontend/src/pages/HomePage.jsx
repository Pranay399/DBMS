import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

function TrainCard({ train, onSelect }) {
  const dur = train.duration_mins;
  const hours = Math.floor(dur / 60), mins = dur % 60;
  const dep = new Date(train.dep_time);
  const arr = new Date(train.arr_time);
  const fmt = d => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = d => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
      padding: '20px 24px', transition: 'all 0.25s', cursor: 'pointer'
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{train.train_name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'JetBrains Mono, monospace' }}>
            ID #{train.train_id} · Schedule #{train.schedule_id}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: train.available_seats > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: train.available_seats > 0 ? '#34d399' : '#f87171',
            border: `1px solid ${train.available_seats > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
          }}>
            {train.available_seats > 0 ? `${train.available_seats} Seats Available` : 'Fully Booked'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>{fmt(dep)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{train.source}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDate(dep)}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{hours}h {mins}m</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ flex: 1, height: 2, background: 'var(--border)' }} />
            <span style={{ color: 'var(--accent-bright)', fontSize: 16 }}>🚂</span>
            <div style={{ flex: 1, height: 2, background: 'var(--border)' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Direct</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>{fmt(arr)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{train.destination}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDate(arr)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            🪑 <span style={{ color: 'var(--text-secondary)' }}>{train.total_seats} total</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ✓ <span style={{ color: 'var(--success)' }}>{train.available_seats} free</span>
          </div>
        </div>
        <button
          disabled={train.available_seats <= 0}
          onClick={() => onSelect(train)}
          style={{
            padding: '8px 20px', background: train.available_seats > 0 ? 'var(--accent)' : 'var(--bg-surface)',
            border: 'none', borderRadius: 8, color: train.available_seats > 0 ? 'white' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 700, cursor: train.available_seats > 0 ? 'pointer' : 'not-allowed'
          }}>
          {train.available_seats > 0 ? 'Book Now →' : 'Full'}
        </button>
      </div>
    </div>
  );
}

export default function HomePage({ user, onBook }) {
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/trains/search`, { params: { source, destination: dest } });
      setResults(r.data.data || []);
      setSearched(true);
    } catch { setResults([]); setSearched(true); }
    finally { setLoading(false); }
  };

  // Popular routes
  const routes = [
    { from: 'New York', to: 'Boston' },
    { from: 'Boston', to: 'Washington' },
    { from: 'Washington', to: 'New York' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-secondary), rgba(59,130,246,0.06))',
        border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', marginBottom: 32,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 80, opacity: 0.06 }}>🚂</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
          Welcome back, {user.name.split(' ')[0]}! 👋
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Where would you like to travel today?</p>
      </div>

      {/* Search form */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '24px 28px', marginBottom: 28
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>🔍 Search Trains</div>
        <form onSubmit={search} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={labelStyle}>From</label>
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. New York" style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={labelStyle}>To</label>
            <input value={dest} onChange={e => setDest(e.target.value)} placeholder="e.g. Boston" style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '10px 28px', background: 'var(--accent)', border: 'none', borderRadius: 9,
            color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            height: 42
          }}>
            {loading ? '…' : 'Search →'}
          </button>
        </form>

        {/* Quick routes */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>Popular:</span>
          {routes.map(r => (
            <button key={r.from} onClick={() => { setSource(r.from); setDest(r.to); }}
              style={{
                padding: '4px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 20, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600
              }}>
              {r.from} → {r.to}
            </button>
          ))}
          <button onClick={() => { setSource(''); setDest(''); search(); }}
            style={{
              padding: '4px 12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 20, fontSize: 11, color: 'var(--accent-bright)', cursor: 'pointer', fontWeight: 600
            }}>
            All Trains
          </button>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
            {results.length > 0 ? `${results.length} train${results.length > 1 ? 's' : ''} found` : 'No trains found'}
            {(source || dest) && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> for "{source}" → "{dest}"</span>}
          </div>
          {results.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Try different cities or click "All Trains"</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {results.map((t, i) => <TrainCard key={`${t.train_id}-${i}`} train={t} onSelect={onBook} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 };
const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'var(--bg-primary)',
  border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif'
};
