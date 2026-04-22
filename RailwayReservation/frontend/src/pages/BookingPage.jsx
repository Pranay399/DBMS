import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';
const PRICE_MAP = { AC: 150, SLEEPER: 80, GENERAL: 40 };

export default function BookingPage({ user, train, onSuccess, onBack }) {
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [payMethod, setPayMethod] = useState('CREDIT_CARD');
  const [passengerName, setPassengerName] = useState(user.name);
  const [step, setStep] = useState('seats'); // seats | payment | confirm
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/api/trains/${train.train_id}/seats`, { params: { scheduleId: train.schedule_id } })
      .then(r => { setSeats(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const grouped = seats.reduce((acc, s) => {
    if (!acc[s.coach_type]) acc[s.coach_type] = [];
    acc[s.coach_type].push(s);
    return acc;
  }, {});

  const price = selected ? (PRICE_MAP[selected.coach_type] || 80) : 0;

  const confirmBooking = async () => {
    setLoading(true); setError('');
    try {
      const r = await axios.post(`${API}/api/bookings`, {
        user_id: user.user_id, train_id: train.train_id,
        schedule_id: train.schedule_id, seat_id: selected.seat_id,
        passenger_name: passengerName, amount: price, payment_method: payMethod
      });
      setBooking(r.data.data);
      setStep('confirm');
    } catch (e) {
      setError(e.response?.data?.error || 'Booking failed');
    } finally { setLoading(false); }
  };

  const dep = new Date(train.dep_time);
  const arr = new Date(train.arr_time);
  const fmt = d => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fmtFull = d => d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // ── Step: Confirmation ────
  if (step === 'confirm' && booking) {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, padding: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Booking Confirmed!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Your ticket has been booked successfully.</p>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 24 }}>
            {[
              ['Booking ID', `#${booking.booking_id}`],
              ['Ticket ID', `#${booking.ticket_id}`],
              ['Train', train.train_name],
              ['Route', `${train.source} → ${train.destination}`],
              ['Departure', `${fmt(dep)}, ${fmtFull(dep)}`],
              ['Seat', `#${selected.seat_id} (${selected.berth_type}, ${selected.coach_type})`],
              ['Passenger', passengerName],
              ['Payment', `$${price.toFixed(2)} via ${payMethod.replace('_', ' ')}`],
              ['Status', booking.payment_status],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(30,58,110,0.4)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ color: v === 'COMPLETED' ? 'var(--success)' : 'var(--text-primary)', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onBack} style={outlineBtn}>← Search Trains</button>
            <button onClick={onSuccess} style={primaryBtn}>My Bookings →</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: Payment ────
  if (step === 'payment') {
    return (
      <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 24px' }}>
        <button onClick={() => setStep('seats')} style={{ ...outlineBtn, marginBottom: 20, display: 'inline-flex' }}>← Back</button>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>💳 Payment Details</h2>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Order Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span>{train.train_name} — Seat #{selected.seat_id} ({selected.berth_type})</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>${price}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{train.source} → {train.destination} · {fmt(dep)} {fmtFull(dep)}</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Passenger Name</label>
            <input value={passengerName} onChange={e => setPassengerName(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Payment Method</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING'].map(m => (
                <button key={m} onClick={() => setPayMethod(m)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${payMethod === m ? 'var(--accent)' : 'var(--border)'}`,
                    background: payMethod === m ? 'rgba(59,130,246,0.12)' : 'var(--bg-surface)',
                    color: payMethod === m ? 'var(--accent-bright)' : 'var(--text-secondary)'
                  }}>
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: 12, marginBottom: 16 }}>{error}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, marginBottom: 20 }}>
            <span style={{ color: 'var(--success)' }}>🔒</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Simulated secure payment — no real charges</span>
          </div>

          <button onClick={confirmBooking} disabled={loading}
            style={{ ...primaryBtn, width: '100%', justifyContent: 'center' }}>
            {loading ? 'Processing…' : `Pay $${price} & Confirm →`}
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Seat Selection ────
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <button onClick={onBack} style={{ ...outlineBtn, marginBottom: 20, display: 'inline-flex' }}>← Back to Search</button>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{train.train_name}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {train.source} → {train.destination} · {fmt(dep)} – {fmt(arr)} · {fmtFull(dep)}
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
        🪑 Select Your Seat
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['available', '#1e3a6e', 'var(--text-secondary)', 'Available'],
          ['selected', 'var(--accent)', 'white', 'Selected'],
          ['booked', 'rgba(239,68,68,0.15)', '#f87171', 'Booked']
        ].map(([k, bg, color, label]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: bg, border: '1px solid rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading seats…</div>
      ) : (
        Object.entries(grouped).map(([coachType, coachSeats]) => (
          <div key={coachType} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{coachType} Coach</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                ${PRICE_MAP[coachType] || 80}/seat
              </span>
              <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 'auto' }}>
                {coachSeats.filter(s => !s.is_booked).length} free
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {coachSeats.map(seat => {
                const isSel = selected?.seat_id === seat.seat_id;
                const bg = seat.is_booked ? 'rgba(239,68,68,0.1)' : isSel ? 'var(--accent)' : 'var(--bg-surface)';
                const border = seat.is_booked ? 'rgba(239,68,68,0.3)' : isSel ? 'var(--accent)' : 'var(--border)';
                const color = seat.is_booked ? '#f87171' : isSel ? 'white' : 'var(--text-secondary)';
                return (
                  <div key={seat.seat_id}
                    onClick={() => !seat.is_booked && setSelected(seat)}
                    style={{
                      width: 64, padding: '8px 4px', textAlign: 'center',
                      background: bg, border: `1px solid ${border}`, borderRadius: 9,
                      cursor: seat.is_booked ? 'not-allowed' : 'pointer',
                      color, transition: 'all 0.15s'
                    }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>#{seat.seat_id}</div>
                    <div style={{ fontSize: 9, marginTop: 2, opacity: 0.8 }}>{seat.berth_type.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Bottom bar */}
      {selected && (
        <div style={{
          position: 'sticky', bottom: 0, marginTop: 24,
          background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 14,
          padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backdropFilter: 'blur(12px)'
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Seat #{selected.seat_id} — {selected.berth_type} ({selected.coach_type})
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {train.source} → {train.destination}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--success)' }}>${price}</div>
            <button onClick={() => setStep('payment')} style={primaryBtn}>Proceed to Payment →</button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 };
const inputStyle = { width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' };
const primaryBtn = { padding: '9px 20px', background: 'var(--accent)', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
const outlineBtn = { padding: '7px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
