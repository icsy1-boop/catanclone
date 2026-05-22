import { useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';

export default function PlayerList({ gameState }) {
  const { playerId } = useGameStore();
  const currentPid = gameState.turnOrder[gameState.currentPlayerIndex];
  const [hoveredPid, setHoveredPid] = useState(null);

  return (
    <div style={{
      background: 'rgba(22,33,62,0.95)', borderRadius: 10, padding: 12,
      minWidth: 180, backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255,255,255,0.08)',
      position: 'relative',
    }}>
      {gameState.turnOrder.map(pid => {
        const p = gameState.players[pid];
        const isActive = pid === currentPid;
        const isMe = pid === playerId;
        const lrBonus = gameState.longestRoadOwner === pid ? 2 : 0;
        const laBonus = gameState.largestArmyOwner === pid ? 2 : 0;
        const totalVP = p.victoryPoints + lrBonus + laBonus;

        const placedS = 5 - p.settlements;
        const placedC = 4 - p.cities;
        const breakdown = [
          placedS > 0 ? `${placedS} settlement${placedS !== 1 ? 's' : ''} = ${placedS} VP` : null,
          placedC > 0 ? `${placedC} cit${placedC !== 1 ? 'ies' : 'y'} = ${placedC * 2} VP` : null,
          lrBonus ? 'Longest Road = 2 VP' : null,
          laBonus ? 'Largest Army = 2 VP' : null,
        ].filter(Boolean);

        return (
          <div key={pid} style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredPid(pid)}
            onMouseLeave={() => setHoveredPid(null)}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', borderRadius: 6, marginBottom: 4,
              background: isActive ? 'rgba(243,156,18,0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(243,156,18,0.4)' : '1px solid transparent',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: isMe ? '#f39c12' : '#eee' }}>
                {p.name}{isMe ? ' (you)' : ''}
              </div>
              <div style={{ fontSize: 12, color: '#f1c40f', fontWeight: 700, cursor: 'help' }}>
                {totalVP} VP
              </div>
              <div style={{ fontSize: 11, color: '#aaa' }}>{p.resourceCount}🃏</div>
              {gameState.longestRoadOwner === pid && <span title="Longest Road" style={{ fontSize: 11 }}>🛣</span>}
              {gameState.largestArmyOwner === pid && <span title="Largest Army" style={{ fontSize: 11 }}>⚔</span>}
            </div>

            {hoveredPid === pid && breakdown.length > 0 && (
              <div style={{
                position: 'absolute', right: '105%', top: 0,
                background: 'rgba(10,15,35,0.97)', borderRadius: 8, padding: '8px 12px',
                border: '1px solid rgba(255,255,255,0.15)', zIndex: 100,
                whiteSpace: 'nowrap', pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}>
                <div style={{ fontSize: 12, color: '#f39c12', fontWeight: 700, marginBottom: 4 }}>
                  VP breakdown
                </div>
                {breakdown.map((line, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#ccc' }}>{line}</div>
                ))}
                <div style={{
                  fontSize: 12, color: '#f1c40f', fontWeight: 700,
                  borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 4, paddingTop: 4,
                }}>
                  Total: {totalVP} VP
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
