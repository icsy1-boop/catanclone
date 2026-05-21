import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore.js';
import { actions } from '../../store/actions.js';

function CopyLinkButton({ code }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/room/${code}`;
  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      width: '100%', padding: '8px 14px', borderRadius: 8, border: '1px solid #333',
      background: copied ? '#27ae60' : '#0f3460', color: '#eee',
      fontSize: 13, cursor: 'pointer', marginBottom: 20,
    }}>
      {copied ? '✓ Link copied!' : '🔗 Copy invite link'}
    </button>
  );
}

const S = {
  page: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 24, padding: 24 },
  card: { background: '#16213e', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420 },
  code: { fontFamily: 'monospace', fontSize: 36, fontWeight: 700, color: '#f39c12', textAlign: 'center', letterSpacing: 8, marginBottom: 8 },
  hint: { textAlign: 'center', color: '#777', fontSize: 13, marginBottom: 24 },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 },
  item: { padding: '10px 14px', background: '#0f3460', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: '50%', background: '#2ecc71' },
  btn: { width: '100%', padding: 14, borderRadius: 8, border: 'none', background: '#f39c12', color: '#111', fontWeight: 700, fontSize: 16, cursor: 'pointer' },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#0f3460', color: '#eee', fontSize: 15, width: '100%', boxSizing: 'border-box' },
  label: { fontSize: 13, color: '#aaa', marginBottom: 6 },
  disabled: { opacity: 0.5, cursor: 'not-allowed' },
};

export default function RoomLobby() {
  const { code } = useParams();
  const { roomCode, isHost, lobbyPlayers, playerId } = useGameStore();
  const [name, setName] = useState('');

  // Not yet joined — show name-only join form
  if (!roomCode) {
    const valid = name.trim().length >= 1;
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.code}>{code}</div>
          <div style={S.hint}>You've been invited to join this room</div>
          <div style={{ marginBottom: 16 }}>
            <div style={S.label}>Your name</div>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter your name" maxLength={20} autoFocus
              onKeyDown={e => e.key === 'Enter' && valid && actions.joinRoom(code, name.trim())} />
          </div>
          <button style={{ ...S.btn, ...(!valid ? S.disabled : {}) }}
            disabled={!valid}
            onClick={() => actions.joinRoom(code, name.trim())}>
            Join Game
          </button>
        </div>
      </div>
    );
  }

  const canStart = isHost && lobbyPlayers.length >= 2;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.code}>{roomCode}</div>
        <CopyLinkButton code={roomCode} />

        <ul style={S.list}>
          {lobbyPlayers.map((p) => (
            <li key={p.id} style={S.item}>
              <div style={S.dot} />
              <span style={{ flex: 1 }}>{p.name}</span>
              {p.id === playerId && <span style={{ color: '#777', fontSize: 12 }}>(you)</span>}
            </li>
          ))}
        </ul>

        <div style={{ color: '#777', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
          {lobbyPlayers.length}/8 players
          {!isHost && ' • Waiting for host to start...'}
        </div>

        {isHost && (
          <button style={{ ...S.btn, ...(!canStart ? S.disabled : {}) }}
            disabled={!canStart}
            onClick={actions.startGame}>
            {canStart ? 'Start Game' : `Need at least 2 players (${lobbyPlayers.length}/2)`}
          </button>
        )}
      </div>
    </div>
  );
}
