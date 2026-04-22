import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

export default function MyBookingsPage({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/bookings/user/${user.user_id}`)
      .then(r => setBookings(r.data.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking? A $10 fee applies.')) return;
    setCancelling(id);
    try {
      await axios.post(`${API}/api/bookings/${id}/cancel`);
      load();
    } catch (e) { alert(e.response?.data?.error || 'Cancel failed'); }
    finally { setCancelling(null); }
  };

  const statusColor = { CONFIRMED: '#34d399', CANCELLED: '#f87171', WAITING: '#fbbf24', PENDING: '#94a3b8' };
  const statusBg = { CONFIRMED: 'rgba(16,185,129,0.1)', CANCELLED: 'rgba(239,68,68,0.1)', WAITING: 'rgba(245,158,11,0.1)', PENDING: 'rgba(148,163,184,0.1)' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>🎫 My Bookings</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>All your past and upcoming trips</div>
        </div>
        <button onClick={load} style={{ padding: '7px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          ↺ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading…</div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No bookings yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Search for trains and book your first ticket!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bookings.map(b => {
            const dep = new Date(b.dep_time);
            const arr = new Date(b.arr_time);
            const fmt = d => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const fmtDate = d => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            const isCancelled = b.ticket_status === 'CANCELLED';

            return (
              <div key={b.booking_id} style={{
                background: 'var(--bg-card)', border: `1px solid ${isCancelled ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                borderRadius: 14, overflow: 'hidden', opacity: isCancelled ? 0.75 : 1
              }}>
                {/* Header */}
                <div style={{
                  padding: '12px 20px', background: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12
                }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{b.train_name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    Booking #{b.booking_id}
                  </span>
                  <span style={{
                    marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: statusBg[b.ticket_status] || statusBg.PENDING,
                    color: statusColor[b.ticket_status] || statusColor.PENDING
                  }}>{b.ticket_status}</span>
                </div>

                {/* Body */}
                <div style={{ padding: '16px 20px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Route */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 2, minWidth: 260 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{fmt(dep)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.source}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDate(dep)}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: 18 }}>✈️</div>
                      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{fmt(arr)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.destination}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDate(arr)}</div>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      ['Passenger', b.passenger_name],
                      ['Seat', `#${b.seat_id} (${b.coach_type})`],
                      ['Payment', b.payment_method?.replace('_', ' ')],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)', minWidth: 70 }}>{k}</span>
                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Amount + action */}
                  <div style={{ textAlign: 'right', minWidth: 120 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: isCancelled ? 'var(--text-muted)' : 'var(--success)', marginBottom: 8 }}>
                      ${Number(b.amount || 0).toFixed(2)}
                    </div>
                    {!isCancelled && (
                      <button
                        onClick={() => cancel(b.booking_id)}
                        disabled={cancelling === b.booking_id}
                        style={{
                          padding: '6px 14px', background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.3)', borderRadius: 7,
                          color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                        }}>
                        {cancelling === b.booking_id ? 'Cancelling…' : '✕ Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
