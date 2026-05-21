import { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import BoardCanvas from './board/BoardCanvas.jsx';
import PlayerPanel from './hud/PlayerPanel.jsx';
import PlayerList from './hud/PlayerList.jsx';
import DiceDisplay from './hud/DiceDisplay.jsx';
import TurnIndicator from './hud/TurnIndicator.jsx';
import ActionBar from './hud/ActionBar.jsx';
import TradeModal from './modals/TradeModal.jsx';
import TradeNotification from './modals/TradeNotification.jsx';
import StealModal from './modals/StealModal.jsx';
import MonopolyModal from './modals/MonopolyModal.jsx';
import YearOfPlentyModal from './modals/YearOfPlentyModal.jsx';
import DevCardModal from './modals/DevCardModal.jsx';

export default function GamePage() {
  const { gameState } = useGameStore();
  const [modal, setModal] = useState(null);

  if (!gameState) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#aaa' }}>
      Loading game…
    </div>;
  }

  const openModal = (m) => setModal(m);
  const closeModal = () => setModal(null);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Board fills the whole screen */}
      <BoardCanvas gameState={gameState} />

      {/* Top-left: turn indicator + dice */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <TurnIndicator gameState={gameState} />
        <DiceDisplay lastRoll={gameState.lastRoll} />
      </div>

      {/* Top-right: player list */}
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <PlayerList gameState={gameState} />
      </div>

      {/* Bottom-left: my hand */}
      <div style={{ position: 'absolute', bottom: 80, left: 12 }}>
        <PlayerPanel />
      </div>

      {/* Bottom: action bar */}
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)' }}>
        <ActionBar onOpenModal={openModal} />
      </div>

      {/* Win screen */}
      {gameState.winner && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#f39c12', marginBottom: 16 }}>🏆 Game Over!</div>
          <div style={{ fontSize: 24, color: '#eee' }}>
            {gameState.players[gameState.winner]?.name} wins!
          </div>
        </div>
      )}

      {/* Always-visible trade notification panel */}
      <TradeNotification />

      {/* Modals */}
      {modal === 'TRADE' && <TradeModal onClose={closeModal} />}
      {modal === 'STEAL' && <StealModal onClose={closeModal} />}
      {modal === 'MONOPOLY' && <MonopolyModal onClose={closeModal} />}
      {modal === 'YEAR_OF_PLENTY' && <YearOfPlentyModal onClose={closeModal} />}
      {modal === 'DEV_CARD' && (
        <DevCardModal onClose={closeModal}
          onSpecialCard={(card) => { closeModal(); setModal(card); }} />
      )}
    </div>
  );
}
