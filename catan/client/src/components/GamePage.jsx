import { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import BoardCanvas from './board/BoardCanvas.jsx';
import PlayerPanel from './hud/PlayerPanel.jsx';
import PlayerList from './hud/PlayerList.jsx';
import DiceDisplay from './hud/DiceDisplay.jsx';
import TurnIndicator from './hud/TurnIndicator.jsx';
import ActionBar from './hud/ActionBar.jsx';
import GameSidebar from './hud/GameSidebar.jsx';
import TradeModal from './modals/TradeModal.jsx';
import TradeNotification from './modals/TradeNotification.jsx';
import StealModal from './modals/StealModal.jsx';
import MonopolyModal from './modals/MonopolyModal.jsx';
import YearOfPlentyModal from './modals/YearOfPlentyModal.jsx';
import DevCardModal from './modals/DevCardModal.jsx';
import DiscardModal from './modals/DiscardModal.jsx';
import RulesModal from './modals/RulesModal.jsx';
import ResourceGainPopup from './hud/ResourceGainPopup.jsx';
import { RESOURCES, RESOURCE_COLORS, RESOURCE_LABELS } from '../constants/resources.js';

function BankPanel({ bankResources }) {
  if (!bankResources) return null;
  return (
    <div style={{
      background: 'rgba(22,33,62,0.9)', borderRadius: 8, padding: '6px 10px',
      border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(4px)',
      display: 'flex', gap: 10, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 11, color: '#777', alignSelf: 'center' }}>Bank:</span>
      {RESOURCES.map(r => (
        <span key={r} style={{ fontSize: 12, color: RESOURCE_COLORS[r] }}>
          {RESOURCE_LABELS[r].slice(0, 2)} {bankResources[r] ?? 19}
        </span>
      ))}
    </div>
  );
}

export default function GamePage() {
  const { gameState, playerId } = useGameStore();
  const [modal, setModal] = useState(null);

  if (!gameState) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#aaa' }}>
      Loading game…
    </div>;
  }

  const openModal = (m) => setModal(m);
  const closeModal = () => setModal(null);

  const mustDiscard = gameState.discardNeeded?.[playerId];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
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

      {/* Bottom-left: my hand + bank */}
      <div style={{ position: 'absolute', bottom: 80, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <PlayerPanel />
        <BankPanel bankResources={gameState.bankResources} />
      </div>

      {/* Bottom-right: log + chat */}
      <div style={{ position: 'absolute', bottom: 80, right: 12 }}>
        <GameSidebar gameState={gameState} />
      </div>

      {/* Bottom: action bar */}
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)' }}>
        <ActionBar onOpenModal={openModal} />
      </div>

      {/* Always-visible trade notification panel */}
      <TradeNotification />

      {/* Resource gain popup after dice roll */}
      <ResourceGainPopup />

      {/* Discard overlay — blocks interaction until resolved */}
      {mustDiscard && <DiscardModal mustDiscard={mustDiscard} />}

      {/* Win screen */}
      {gameState.winner && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#f39c12', marginBottom: 16 }}>Game Over!</div>
          <div style={{ fontSize: 24, color: '#eee' }}>
            {gameState.players[gameState.winner]?.name} wins!
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === 'TRADE' && <TradeModal onClose={closeModal} />}
      {modal === 'STEAL' && <StealModal onClose={closeModal} />}
      {modal === 'MONOPOLY' && <MonopolyModal onClose={closeModal} />}
      {modal === 'YEAR_OF_PLENTY' && <YearOfPlentyModal onClose={closeModal} />}
      {modal === 'RULES' && <RulesModal onClose={closeModal} />}
      {modal === 'DEV_CARD' && (
        <DevCardModal onClose={closeModal}
          onSpecialCard={(card) => { closeModal(); setModal(card); }} />
      )}
    </div>
  );
}
