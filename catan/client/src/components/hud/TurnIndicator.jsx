import { useGameStore } from '../../store/gameStore.js';

const PHASE_LABELS = {
  SETUP_PLACE_SETTLEMENT: 'Place settlement',
  SETUP_PLACE_ROAD: 'Place road',
  ROLL_OR_PLAY_DEV: 'Roll dice',
  ROBBER_MOVE: 'Move the robber',
  ROBBER_STEAL: 'Choose player to steal from',
  ROAD_BUILDING_1: 'Place free road (1/2)',
  ROAD_BUILDING_2: 'Place free road (2/2)',
  MAIN: 'Build / trade',
  GAME_OVER: 'Game over!',
};

export default function TurnIndicator({ gameState }) {
  const { playerId } = useGameStore();
  const currentPid = gameState.turnOrder[gameState.currentPlayerIndex];
  const currentPlayer = gameState.players[currentPid];
  const isMe = currentPid === playerId;

  return (
    <div style={{
      background: 'rgba(22,33,62,0.95)', borderRadius: 10, padding: '8px 14px',
      border: `2px solid ${isMe ? '#f39c12' : 'rgba(255,255,255,0.1)'}`,
      backdropFilter: 'blur(4px)',
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: currentPlayer?.color || '#eee' }}>
        {isMe ? 'Your turn' : `${currentPlayer?.name}'s turn`}
      </span>
      <span style={{ fontSize: 12, color: '#aaa', marginLeft: 8 }}>
        — {PHASE_LABELS[gameState.turnPhase] || gameState.turnPhase}
      </span>
    </div>
  );
}
