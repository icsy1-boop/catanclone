import { useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';

export default function PlayerList({ gameState }) {
  const { playerId } = useGameStore();
  const currentPid = gameState.turnOrder[gameState.currentPlayerIndex];
  const [hoveredPid, setHoveredPid] = useState(null);

  return (
    <div style={{
      background: 'rgba(22,33,62,0.95)', borderRadius: 10, padding: 12,
      minWidth: 200, backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255,255,255,0.08)',
      position: 'relative',
    }}>
      {gameState.turnOrder.map(pid => {
        const p = gameState.players[pid];
        const isActive = pid === currentPid;
        const isMe = pid === playerId;
        const hasLR = gameState.longestRoadOwner === pid;
        const hasLA = gameState.largestArmyOwner === pid;
        const lrBonus = hasLR ? 2 : 0;
        const laBonus = hasLA ? 2 : 0;
        const totalVP = p.victoryPoints + lrBonus + laBonus;

        const placedS = 5 - p.settlements;
        const placedC = 4 - p.cities;
        const breakdown = [
          placedS > 0 ? `${placedS} settlement${placedS !== 1 ? 's' : ''} = ${placedS} VP` : null,
          placedC > 0 ? `${placedC} cit${placedC !== 1 ? 'ies' : 'y'} = ${placedC * 2} VP` : null,
          lrBonus ? 'Longest Road = 2 VP' : null,
          laBonus ? 'Largest Army = 2 VP' : null,
        ].filter(Boolean);

        // Road count = roads placed = 15 - remaining
        const roadsPlaced = 15 - p.roads;

        return (
          <div key={pid} style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredPid(pid)}
            onMouseLeave={() => setHoveredPid(null)}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 8px', borderRadius: 6, marginBottom: 4,
              background: isActive ? 'rgba(243,156,18,0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(243,156,18,0.4)' : '1px solid transparent',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: isMe ? '#f39c12' : '#eee', minWidth: 0 }}>
                {p.name}{isMe ? ' (you)' : ''}
              </div>

              {/* VP */}
              <div style={{ fontSize: 12, color: '#f1c40f', fontWeight: 700 }}>
                {totalVP}VP
              </div>

              {/* Road count */}
              <div style={{
                fontSize: 11, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                background: hasLR ? 'rgba(52,152,219,0.25)' : 'rgba(255,255,255,0.06)',
                color: hasLR ? '#3498db' : '#666',
                border: `1px solid ${hasLR ? 'rgba(52,152,219,0.5)' : 'rgba(255,255,255,0.08)'}`,
                title: 'Roads built',
              }} title={hasLR ? 'Longest Road' : 'Roads built'}>
                🛣{roadsPlaced}
              </div>

              {/* Army count */}
              <div style={{
                fontSize: 11, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                background: hasLA ? 'rgba(231,76,60,0.25)' : 'rgba(255,255,255,0.06)',
                color: hasLA ? '#e74c3c' : '#666',
                border: `1px solid ${hasLA ? 'rgba(231,76,60,0.5)' : 'rgba(255,255,255,0.08)'}`,
              }} title={hasLA ? 'Largest Army' : 'Knights played'}>
                ⚔{p.knightsPlayed}
              </div>

              <div style={{ fontSize: 11, color: '#aaa' }}>{p.resourceCount}🃏</div>
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
