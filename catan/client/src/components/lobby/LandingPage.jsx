import { useState } from 'react';
import { actions } from '../../store/actions.js';

const S = {
  page: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 32, padding: 24 },
  title: { fontSize: 48, fontWeight: 700, color: '#f39c12', letterSpacing: 2 },
  sub: { color: '#aaa', marginTop: -24, fontSize: 14 },
  card: { background: '#16213e', borderRadius: 12, padding: 28, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 },
  label: { fontSize: 13, color: '#aaa', marginBottom: 4 },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#0f3460', color: '#eee', fontSize: 15, width: '100%' },
  btn: { padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15 },
  primary: { background: '#f39c12', color: '#111' },
  secondary: { background: '#2c3e50', color: '#eee' },
  div: { textAlign: 'center', color: '#555', fontSize: 13 },
};

export default function LandingPage() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tab, setTab] = useState('create');

  const valid = name.trim().length >= 1;

  return (
    <div style={S.page}>
      <div>
        <div style={S.title}>CATAN</div>
        <div style={S.sub}>Online multiplayer • 3–8 players</div>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['create', 'join'].map(t => (
            <button key={t} style={{ ...S.btn, flex: 1, ...(tab === t ? S.primary : S.secondary) }}
              onClick={() => setTab(t)}>
              {t === 'create' ? 'Create Game' : 'Join Game'}
            </button>
          ))}
        </div>

        <div>
          <div style={S.label}>Your name</div>
          <input style={S.input} value={name} onChange={e => setName(e.target.value)}
            placeholder="Enter your name" maxLength={20} />
        </div>

        {tab === 'join' && (
          <div>
            <div style={S.label}>Room code</div>
            <input style={S.input} value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. XKCD42" maxLength={6} />
          </div>
        )}

        <button style={{ ...S.btn, ...S.primary, opacity: valid ? 1 : 0.5 }}
          disabled={!valid || (tab === 'join' && code.length !== 6)}
          onClick={() => tab === 'create'
            ? actions.createRoom(name.trim())
            : actions.joinRoom(code, name.trim())
          }>
          {tab === 'create' ? 'Create Room' : 'Join Room'}
        </button>
      </div>
    </div>
  );
}
