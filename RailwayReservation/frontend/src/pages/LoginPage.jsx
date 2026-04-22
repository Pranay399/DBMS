import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const url = mode === 'login' ? `${API}/api/auth/login` : `${API}/api/auth/register`;
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
      const res = await axios.post(url, payload);
      if (res.data.success) {
        localStorage.setItem('rr_user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 40%, rgba(59,130,246,0.08) 0%, var(--bg-primary) 60%)'
    }}>
      <div style={{ width: 420, padding: '0 16px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🚂</div>
          <h1 style={{
            fontSize: 28, fontWeight: 900,
            background: 'linear-gradient(135deg,#60a5fa,#a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Railway DBMS</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
            Reservation & Analytics Platform
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 32, boxShadow: '0 8px 40px rgba(0,0,0,0.4)'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'var(--bg-primary)', borderRadius: 10, padding: 3 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--text-muted)'
                }}>
                {m === 'login' ? '🔑 Sign In' : '✨ Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Full Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Alice Smith"
                  required style={inputStyle} />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="alice@example.com" required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="••••••••" required style={inputStyle} />
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: 12 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '11px 0', background: loading ? 'var(--accent-dim)' : 'var(--accent)',
              border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              marginTop: 4
            }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Demo Credentials</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>👤 Passenger</div>
                <code style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>alice@example.com</code><br />
                <code style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>hash123</code>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>🔧 Admin</div>
                <code style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>admin@example.com</code><br />
                <code style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>hash123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'var(--bg-primary)',
  border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s'
};
