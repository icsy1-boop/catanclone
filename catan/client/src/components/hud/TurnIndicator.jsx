import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { actions } from '../../store/actions.js';

const TURN_SECONDS = 90;

const PHASE_LABELS = {
  SETUP_PLACE_SETTLEMENT: 'Place settlement',
  SETUP_PLACE_ROAD: 'Place road',
  ROLL_OR_PLAY_DEV: 'Roll dice',
  DISCARD_RESOURCES: 'Discarding…',
  ROBBER_MOVE: 'Move the robber',
  ROBBER_STEAL: 'Choose player to steal from',
  ROAD_BUILDING_1: 'Place free road (1/2)',
  ROAD_BUILDING_2: 'Place free road (2/2)',
  MAIN: 'Build / trade',
  GAME_OVER: 'Game over!',
};

export default function TurnIndicator({ gameState }) {
  const { playerId } = useGameStore();
  const [secondsLeft, setSecondsLeft] = useState(TURN_SECONDS);

  const currentPid = gameState.turnOrder[gameState.currentPlayerIndex];
  const currentPlayer = gameState.players[currentPid];
  const isMe = currentPid === playerId;
  const isMainGame = gameState.phase === 'MAIN';

  useEffect(() => {
    if (!isMainGame || !gameState.turnStartTime) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
      const left = Math.max(0, TURN_SECONDS - elapsed);
      setSecondsLeft(left);
      if (left === 0 && isMe && gameState.turnPhase === 'MAIN') {
        actions.endTurn();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gameState.turnStartTime, isMainGame, isMe, gameState.turnPhase]);

  const timerColor = secondsLeft < 15 ? '#e74c3c' : secondsLeft < 30 ? '#f39c12' : '#aaa';
  const pct = secondsLeft / TURN_SECONDS;
  const r = 10;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{
      background: 'rgba(22,33,62,0.95)', borderRadius: 10, padding: '8px 14px',
      border: `2px solid ${isMe ? '#f39c12' : 'rgba(255,255,255,0.1)'}`,
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: currentPlayer?.color || '#eee' }}>
          {isMe ? 'Your turn' : `${currentPlayer?.name}'s turn`}
        </span>
        <span style={{ fontSize: 12, color: '#aaa', marginLeft: 8 }}>
          — {PHASE_LABELS[gameState.turnPhase] || gameState.turnPhase}
        </span>
      </div>

      {isMainGame && (
        <div style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
          <svg width={28} height={28} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={14} cy={14} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
            <circle cx={14} cy={14} r={r} fill="none" stroke={timerColor} strokeWidth={3}
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }} />
          </svg>
          <span style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: timerColor, fontVariantNumeric: 'tabular-nums',
          }}>
            {secondsLeft}
          </span>
        </div>
      )}
    </div>
  );
}
