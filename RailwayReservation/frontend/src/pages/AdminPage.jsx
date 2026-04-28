import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

function StatCard({ label, value, color = 'var(--accent-bright)', sub }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Trains Tab ────────────────────────────────────────────────────────────────
function TrainsTab() {
  const [trains, setTrains] = useState([]);
  const [editing, setEditing] = useState(null); // {train_id?, train_name, source, destination, status}
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); axios.get(`${API}/api/admin/trains`).then(r => setTrains(r.data.data || [])).finally(() => setLoading(false)); };
  useEffect(load, []);

  const blank = { train_name: '', source: '', destination: '', status: 'ACTIVE' };
  const save = async () => {
    setSaving(true);
    try {
      if (editing.train_id) await axios.put(`${API}/api/admin/trains/${editing.train_id}`, editing);
      else await axios.post(`${API}/api/admin/trains`, editing);
      setEditing(null); load();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };
  const del = async (id) => {
    if (!window.confirm('Delete this train and all its data?')) return;
    await axios.delete(`${API}/api/admin/trains/${id}`).catch(e => alert(e.response?.data?.error || 'Failed'));
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Train Management</div>
        <button onClick={() => setEditing(blank)} style={primaryBtn}>+ Add Train</button>
      </div>

      {/* Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              {editing.train_id ? 'Edit Train' : 'Add New Train'}
            </div>
            {[['train_name', 'Train Name'], ['source', 'Source City'], ['destination', 'Destination City']].map(([k, lbl]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{lbl}</label>
                <input value={editing[k]} onChange={e => setEditing(prev => ({ ...prev, [k]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Status</label>
              <select value={editing.status} onChange={e => setEditing(prev => ({ ...prev, status: e.target.value }))} style={{ ...inputStyle, appearance: 'auto' }}>
                <option>ACTIVE</option><option>INACTIVE</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditing(null)} style={outlineBtn}>Cancel</button>
              <button onClick={save} disabled={saving} style={primaryBtn}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading…</div> : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['ID', 'Name', 'Source', 'Destination', 'Status', 'Schedules', 'Coaches', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trains.map(t => (
                <tr key={t.train_id} style={{ borderBottom: '1px solid rgba(30,58,110,0.3)' }}>
                  <td style={td}><span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-bright)' }}>#{t.train_id}</span></td>
                  <td style={{ ...td, fontWeight: 600, color: 'var(--text-primary)' }}>{t.train_name}</td>
                  <td style={td}>{t.source}</td>
                  <td style={td}>{t.destination}</td>
                  <td style={td}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: t.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: t.status === 'ACTIVE' ? '#34d399' : '#f87171' }}>{t.status}</span>
                  </td>
                  <td style={td}>{t.schedules}</td>
                  <td style={td}>{t.coaches}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditing(t)} style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--accent-bright)', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => del(t.train_id)} style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Schedules Tab ─────────────────────────────────────────────────────────────
function SchedulesTab() {
  const [schedules, setSchedules] = useState([]);
  const [trains, setTrains] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ train_id: '', dep_time: '', arr_time: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/admin/schedules`),
      axios.get(`${API}/api/trains`)
    ]).then(([s, t]) => { setSchedules(s.data.data || []); setTrains(t.data.data || []); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    try { await axios.post(`${API}/api/admin/schedules`, form); setAdding(false); setForm({ train_id: '', dep_time: '', arr_time: '' }); load(); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };
  const del = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    await axios.delete(`${API}/api/admin/schedules/${id}`).catch(e => alert(e.response?.data?.error || 'Failed'));
    load();
  };

  const fmt = d => new Date(d).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Schedule Management</div>
        <button onClick={() => setAdding(true)} style={primaryBtn}>+ Add Schedule</button>
      </div>

      {adding && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>New Schedule</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>Train</label>
              <select value={form.train_id} onChange={e => setForm(f => ({ ...f, train_id: e.target.value }))} style={{ ...inputStyle, appearance: 'auto' }}>
                <option value="">Select train</option>
                {trains.map(t => <option key={t.train_id} value={t.train_id}>{t.train_name} ({t.source} → {t.destination})</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>Departure</label>
              <input type="datetime-local" value={form.dep_time} onChange={e => setForm(f => ({ ...f, dep_time: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>Arrival</label>
              <input type="datetime-local" value={form.arr_time} onChange={e => setForm(f => ({ ...f, arr_time: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => setAdding(false)} style={outlineBtn}>Cancel</button>
            <button onClick={save} style={primaryBtn}>Save Schedule</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading…</div> : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['ID', 'Train', 'Route', 'Departure', 'Arrival', 'Bookings', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.schedule_id} style={{ borderBottom: '1px solid rgba(30,58,110,0.3)' }}>
                  <td style={td}><span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-bright)' }}>#{s.schedule_id}</span></td>
                  <td style={{ ...td, fontWeight: 600, color: 'var(--text-primary)' }}>{s.train_name}</td>
                  <td style={td}>{s.source} → {s.destination}</td>
                  <td style={td}>{fmt(s.dep_time)}</td>
                  <td style={td}>{fmt(s.arr_time)}</td>
                  <td style={td}>{s.bookings}</td>
                  <td style={td}><button onClick={() => del(s.schedule_id)} style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/admin/analytics`).then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading analytics…</div>;
  if (!data) return null;
  const { 
    revenue, trainRankings, revenueByMethod, ticketStatus, recentBookings, 
    growth = [], peakHours = [], classDistribution = [] 
  } = data;

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Analytics Dashboard</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Revenue" value={`$${Number(revenue?.total_revenue || 0).toLocaleString()}`} color="var(--success)" />
        <StatCard label="Refunds Paid" value={`$${Number(revenue?.total_refunds || 0).toLocaleString()}`} color="#f87171" />
        <StatCard label="Transactions" value={revenue?.total_transactions || 0} color="var(--accent-bright)" />
        <StatCard label="Confirmed Tickets" value={ticketStatus?.confirmed || 0} color="#34d399" />
        <StatCard label="Cancelled Tickets" value={ticketStatus?.cancelled || 0} color="#f87171" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>🚂 Train Rankings</div>
          {trainRankings.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(59,130,246,0.15)', color: 'var(--accent-bright)', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>#{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{t.train_name}</div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 4 }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'var(--accent)', width: `${Math.max(5, (t.booking_cnt / (trainRankings[0]?.booking_cnt || 1)) * 100)}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-bright)', fontFamily: 'JetBrains Mono, monospace' }}>{t.booking_cnt}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>💳 Revenue by Method</div>
          {revenueByMethod.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{m.payment_method?.replace('_', ' ')}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>${Number(m.total_revenue).toFixed(2)}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.cnt} txns</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* MoM Growth Chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>📈 Revenue Growth (MoM)</div>
          {growth.map((g, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '4px 0' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Month {g.month}</span>
              <div style={{ flex: 1, margin: '0 15px', height: 4, background: 'var(--border)', borderRadius: 2, position: 'relative' }}>
                <div style={{ height: '100%', borderRadius: 2, background: 'var(--success)', width: `${Math.min(100, (g.revenue / (Math.max(...growth.map(x=>x.revenue)) || 1)) * 100)}%` }} />
              </div>
              <div style={{ textAlign: 'right', minWidth: 60 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>${Number(g.revenue).toLocaleString()}</div>
                {g.growth !== null && (
                  <div style={{ fontSize: 10, color: g.growth >= 0 ? '#34d399' : '#f87171' }}>
                    {g.growth >= 0 ? '▲' : '▼'} ${Math.abs(g.growth).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Peak Hours Visual */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>🕒 Peak Booking Hours</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, paddingBottom: 20 }}>
            {peakHours.map((p, i) => (
              <div key={i} title={`${p.hr}:00 - ${p.cnt} bookings`} style={{ 
                flex: 1, background: p.cnt === Math.max(...peakHours.map(x=>x.cnt)) ? 'var(--accent-bright)' : 'rgba(59,130,246,0.3)', 
                height: `${(p.cnt / (Math.max(...peakHours.map(x=>x.cnt)) || 1)) * 100}%`,
                borderRadius: '2px 2px 0 0', minWidth: 4
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)' }}>
            <span>00:00</span><span>12:00</span><span>23:59</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 28 }}>
         <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>💎 Class Distribution (AC vs General)</div>
            <div style={{ height: 20, width: '100%', background: 'var(--border)', borderRadius: 10, display: 'flex', overflow: 'hidden', marginBottom: 12 }}>
               {classDistribution.map((c, i) => (
                 <div key={i} style={{ 
                   height: '100%', width: `${c.pct}%`, 
                   background: c.coach_type === 'AC' ? 'var(--accent)' : 'var(--accent-bright)',
                   opacity: 1 - (i * 0.2)
                 }} title={`${c.coach_type}: ${c.pct}%`} />
               ))}
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
               {classDistribution.map((c, i) => (
                 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: c.coach_type === 'AC' ? 'var(--accent)' : 'var(--accent-bright)', opacity: 1 - (i * 0.2) }} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.coach_type}: <strong>{Number(c.pct).toFixed(1)}%</strong></span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Bookings</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: 'var(--bg-surface)' }}>
            {['#', 'User', 'Train', 'Date', 'Amount', 'Status'].map(h => (
              <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {recentBookings.map(b => (
              <tr key={b.booking_id} style={{ borderBottom: '1px solid rgba(30,58,110,0.3)' }}>
                <td style={td}><span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-bright)' }}>#{b.booking_id}</span></td>
                <td style={td}>{b.name}</td>
                <td style={td}>{b.train_name}</td>
                <td style={td}>{new Date(b.booking_date).toLocaleDateString()}</td>
                <td style={{ ...td, color: 'var(--success)', fontWeight: 700 }}>${Number(b.amount || 0).toFixed(2)}</td>
                <td style={td}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: b.payment_status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: b.payment_status === 'COMPLETED' ? '#34d399' : '#f87171' }}>{b.payment_status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Logs Tab ──────────────────────────────────────────────────────────────────
function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/admin/cancellations`)
      .then(r => setLogs(r.data.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Cancellation Audit Logs</div>
        <button onClick={load} style={outlineBtn}>↺ Refresh Logs</button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        This audit trail is automatically populated by the <code>trg_log_cancellations</code> trigger whenever a booking is cancelled.
      </div>

      {loading ? <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading logs…</div> : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['Log ID', 'Payment ID', 'Booking ID', 'Amount', 'Cancel Time'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No cancellation logs found.</td></tr>
              ) : logs.map(log => (
                <tr key={log.log_id} style={{ borderBottom: '1px solid rgba(30,58,110,0.3)' }}>
                  <td style={td}><span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-bright)' }}>#{log.log_id}</span></td>
                  <td style={td}>#{log.payment_id}</td>
                  <td style={td}>#{log.booking_id}</td>
                  <td style={{ ...td, color: '#f87171', fontWeight: 700 }}>${Number(log.amount).toFixed(2)}</td>
                  <td style={td}>{new Date(log.cancel_time).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Library Tab (Part K) ──────────────────────────────────────────────────────
function LibraryTab() {
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const libQueries = useMemo(() => [
    { id: 46, title: 'Monthly Revenue', icon: '📈', color: '#10b981' },
    { id: 47, title: 'Station Traffic', icon: '🚉', color: '#3b82f6' },
    { id: 50, title: 'Journey Durations', icon: '⏱️', color: '#8b5cf6' },
    { id: 51, title: 'Age Demographics', icon: '👥', color: '#f59e0b' },
    { id: 53, title: 'Refund Analysis', icon: '💸', color: '#ef4444' },
    { id: 54, title: 'Coach Occupancy', icon: '🎟️', color: '#06b6d4' },
    { id: 63, title: 'Class Distribution', icon: '💎', color: '#ec4899' },
    { id: 68, title: 'Peak Hours', icon: '🕒', color: '#6366f1' },
    { id: 79, title: 'Top Destinations', icon: '📍', color: '#14b8a6' },
    { id: 85, title: 'System Uptime', icon: '⚡', color: '#f43f5e' },
  ], []);

  const run = async (q) => {
    setSelected(q);
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/q${q.id}`);
      setResults(r.data.data);
    } catch (e) { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Advanced Analytics Library (Part K)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {libQueries.map(q => (
          <div key={q.id} onClick={() => run(q)} style={{ 
            background: 'var(--bg-card)', border: `1px solid ${selected?.id === q.id ? q.color : 'var(--border)'}`, 
            borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'transform 0.2s',
            transform: selected?.id === q.id ? 'translateY(-2px)' : 'none',
            boxShadow: selected?.id === q.id ? `0 4px 12px ${q.color}22` : 'none'
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{q.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{q.title}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Run Report #{q.id}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{selected.title} Report Results</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Real-time database fetch for Query Q{selected.id}</div>
            </div>
            {loading && <div style={{ fontSize: 12, color: 'var(--accent-bright)' }}>Fetching...</div>}
          </div>

          {!loading && results && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)' }}>
                    {Object.keys(results[0] || {}).map(k => (
                      <th key={k} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{k.replace('_', ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(30,58,110,0.2)' }}>
                      {Object.values(row).map((val, j) => {
                        const key = Object.keys(row)[j];
                        // Mini-visuals for specific keys
                        let content = val;
                        if (key.includes('revenue') || key.includes('amount')) content = <span style={{ color: 'var(--success)', fontWeight: 800 }}>${Number(val).toLocaleString()}</span>;
                        if (key.includes('rate') || key.includes('pct') || key.includes('utilization')) {
                           content = (
                             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                               <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                                 <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent)', width: `${Math.min(100, val)}%` }} />
                               </div>
                               <span>{Number(val).toFixed(1)}%</span>
                             </div>
                           );
                        }
                        return <td key={j} style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{content}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState('analytics');
  const tabs = [['analytics', '📊 Analytics'], ['library', '📚 Library'], ['trains', '🚂 Trains'], ['schedules', '📅 Schedules'], ['logs', '📋 Logs']];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>🔧 Admin Panel</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Manage trains, schedules, and view system analytics</div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 11, padding: 4, marginBottom: 28, width: 'fit-content' }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
            background: tab === id ? 'var(--accent)' : 'transparent',
            color: tab === id ? 'white' : 'var(--text-muted)'
          }}>{label}</button>
        ))}
      </div>

      {tab === 'trains' && <TrainsTab />}
      {tab === 'schedules' && <SchedulesTab />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'library' && <LibraryTab />}
      {tab === 'logs' && <LogsTab />}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 };
const inputStyle = { width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' };
const primaryBtn = { padding: '8px 18px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const outlineBtn = { padding: '7px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const td = { padding: '10px 14px', color: 'var(--text-secondary)', verticalAlign: 'middle' };
