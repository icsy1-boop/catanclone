import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { actions } from '../../store/actions.js';
import { playDice } from '../../utils/sounds.js';

const ROLL_SECONDS = 5;   // time to roll before auto-roll
const MAIN_SECONDS = 90;  // time per main-phase turn

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
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [pulse, setPulse] = useState(false);
  const prevIsMe = useRef(false);
  const prevTurnStart = useRef(null);

  const currentPid = gameState.turnOrder[gameState.currentPlayerIndex];
  const currentPlayer = gameState.players[currentPid];
  const isMe = currentPid === playerId;
  const isMainGame = gameState.phase === 'MAIN';

  const isRollPhase = gameState.turnPhase === 'ROLL_OR_PLAY_DEV';
  const isMainPhase = gameState.turnPhase === 'MAIN';
  const showTimer = isMainGame && isMe && (isRollPhase || isMainPhase);

  const totalSeconds = isRollPhase ? ROLL_SECONDS : MAIN_SECONDS;

  // Play sound + pulse when it becomes your turn
  useEffect(() => {
    if (isMe && !prevIsMe.current) {
      setPulse(true);
      playDice();
      const t = setTimeout(() => setPulse(false), 2400);
      prevIsMe.current = true;
      return () => clearTimeout(t);
    }
    if (!isMe) prevIsMe.current = false;
  }, [isMe]);

  // Countdown timer — resets when turnStartTime changes or phase changes
  useEffect(() => {
    if (!showTimer || !gameState.turnStartTime) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
      const left = Math.max(0, totalSeconds - elapsed);
      setSecondsLeft(left);

      if (left === 0) {
        if (isRollPhase) {
          actions.rollDice();
        } else if (isMainPhase) {
          actions.endTurn();
        }
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [gameState.turnStartTime, gameState.turnPhase, showTimer, totalSeconds]);

  // Reset displayed seconds when not showing timer
  useEffect(() => {
    if (!showTimer) setSecondsLeft(null);
  }, [showTimer]);

  const sLeft = secondsLeft ?? totalSeconds;
  const timerColor = isRollPhase
    ? (sLeft <= 2 ? '#e74c3c' : sLeft <= 4 ? '#f39c12' : '#aaa')
    : (sLeft < 15 ? '#e74c3c' : sLeft < 30 ? '#f39c12' : '#aaa');
  const pct = sLeft / totalSeconds;
  const r = 10;
  const circ = 2 * Math.PI * r;
  const borderColor = pulse ? '#ffe000' : isMe ? '#f39c12' : 'rgba(255,255,255,0.1)';

  return (
    <>
      <style>{`
        @keyframes turnPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,224,0,0); }
          50% { box-shadow: 0 0 0 8px rgba(255,224,0,0.35); }
        }
      `}</style>
      <div style={{
        background: 'rgba(22,33,62,0.95)', borderRadius: 10, padding: '8px 14px',
        border: `2px solid ${borderColor}`,
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', gap: 10,
        animation: pulse ? 'turnPulse 0.6s ease 4' : 'none',
        transition: 'border-color 0.3s',
      }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: currentPlayer?.color || '#eee' }}>
            {isMe ? 'Your turn' : `${currentPlayer?.name}'s turn`}
          </span>
          <span style={{ fontSize: 12, color: '#aaa', marginLeft: 8 }}>
            — {PHASE_LABELS[gameState.turnPhase] || gameState.turnPhase}
          </span>
        </div>

        {showTimer && secondsLeft !== null && (
          <div style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
            <svg width={28} height={28} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={14} cy={14} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
              <circle cx={14} cy={14} r={r} fill="none" stroke={timerColor} strokeWidth={3}
                strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.45s linear, stroke 0.3s' }} />
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
    </>
  );
}
