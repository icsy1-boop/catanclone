import { useGameStore } from '../../store/gameStore.js';
import { actions } from '../../store/actions.js';

const S = {
  page: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 24, padding: 24 },
  card: { background: '#16213e', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420 },
  code: { fontFamily: 'monospace', fontSize: 36, fontWeight: 700, color: '#f39c12', textAlign: 'center', letterSpacing: 8, marginBottom: 8 },
  hint: { textAlign: 'center', color: '#777', fontSize: 13, marginBottom: 24 },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 },
  item: { padding: '10px 14px', background: '#0f3460', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: '50%', background: '#2ecc71' },
  btn: { width: '100%', padding: 14, borderRadius: 8, border: 'none', background: '#f39c12', color: '#111', fontWeight: 700, fontSize: 16, cursor: 'pointer' },
  disabled: { opacity: 0.5, cursor: 'not-allowed' },
};

export default function RoomLobby() {
  const { roomCode, isHost, lobbyPlayers, playerId } = useGameStore();

  const canStart = isHost && lobbyPlayers.length >= 2;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.code}>{roomCode}</div>
        <div style={S.hint}>Share this code with friends to join</div>

        <ul style={S.list}>
          {lobbyPlayers.map((p, i) => (
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
