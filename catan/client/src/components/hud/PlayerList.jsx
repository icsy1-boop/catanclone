import { useGameStore } from '../../store/gameStore.js';

export default function PlayerList({ gameState }) {
  const { playerId, longestRoadOwner, largestArmyOwner } = { ...useGameStore(), ...gameState };
  const currentPid = gameState.turnOrder[gameState.currentPlayerIndex];

  return (
    <div style={{
      background: 'rgba(22,33,62,0.95)', borderRadius: 10, padding: 12,
      minWidth: 180, backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {gameState.turnOrder.map(pid => {
        const p = gameState.players[pid];
        const isActive = pid === currentPid;
        const isMe = pid === playerId;
        return (
          <div key={pid} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px', borderRadius: 6, marginBottom: 4,
            background: isActive ? 'rgba(243,156,18,0.15)' : 'transparent',
            border: isActive ? '1px solid rgba(243,156,18,0.4)' : '1px solid transparent',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: isMe ? '#f39c12' : '#eee' }}>
              {p.name}{isMe ? ' (you)' : ''}
            </div>
            <div style={{ fontSize: 12, color: '#f1c40f', fontWeight: 700 }}>
              {p.victoryPoints} VP
            </div>
            {gameState.longestRoadOwner === pid && <span title="Longest Road" style={{ fontSize: 11 }}>🛣</span>}
            {gameState.largestArmyOwner === pid && <span title="Largest Army" style={{ fontSize: 11 }}>⚔</span>}
          </div>
        );
      })}
    </div>
  );
}
