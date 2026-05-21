import { useGameStore } from '../../store/gameStore.js';
import { actions } from '../../store/actions.js';
import Button from '../shared/Button.jsx';

export default function StealModal({ onClose }) {
  const { gameState, playerId } = useGameStore();
  const gs = gameState;
  if (!gs) return null;

  const robberTile = gs.board.tiles.find(t => t.hasRobber);
  const adjacentPlayerIds = new Set();

  for (const vertex of Object.values(gs.board.vertices)) {
    if (!vertex.adjacentTiles.includes(robberTile?.id)) continue;
    if (!vertex.building) continue;
    const oid = vertex.building.playerId;
    if (oid !== playerId) adjacentPlayerIds.add(oid);
  }

  const targets = [...adjacentPlayerIds].filter(pid => {
    const p = gs.players[pid];
    return p && p.resourceCount > 0;
  });

  return (
    <Overlay onClose={onClose}>
      <h3 style={{ marginBottom: 16 }}>Steal from...</h3>
      {targets.length === 0 && <p style={{ color: '#aaa' }}>No players to steal from.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {targets.map(pid => {
          const p = gs.players[pid];
          return (
            <button key={pid} onClick={() => { actions.stealResource(pid); onClose(); }}
              style={{
                padding: '10px 16px', borderRadius: 8, border: 'none',
                background: '#0f3460', color: '#eee', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color }} />
              {p.name}
              <span style={{ marginLeft: 'auto', color: '#aaa', fontSize: 12 }}>
                {p.resourceCount} cards
              </span>
            </button>
          );
        })}
      </div>
    </Overlay>
  );
}

export function Overlay({ children, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#16213e', borderRadius: 14, padding: 28,
        minWidth: 320, maxWidth: 460, border: '1px solid rgba(255,255,255,0.1)',
        color: '#eee',
      }}>
        {children}
      </div>
    </div>
  );
}
