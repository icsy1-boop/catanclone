import { useGamePhase } from '../../hooks/useGamePhase.js';
import { useUIStore } from '../../store/uiStore.js';
import { actions } from '../../store/actions.js';
import { useGameStore } from '../../store/gameStore.js';
import Button from '../shared/Button.jsx';

export default function ActionBar({ onOpenModal }) {
  const { canRoll, canEndTurn, canBuild, isSetupSettlement, isSetupRoad,
    isRobberMove, isRobberSteal, isRoadBuilding, canPlayDevCard, phase, myTurn } = useGamePhase();
  const { selectedAction, setAction, clearAction } = useUIStore();
  const { myDevCards, myNewDevCards } = useGameStore();

  const hasPlayableDevCards = myTurn && canPlayDevCard &&
    Object.entries(myDevCards).some(([k, v]) => v > 0 && k !== 'VP');

  const toggle = (a) => selectedAction === a ? clearAction() : setAction(a);

  const S = {
    bar: {
      display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      background: 'rgba(22,33,62,0.95)', padding: '10px 14px',
      borderRadius: 10, backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255,255,255,0.08)',
    },
    active: { outline: '2px solid #f39c12' },
  };

  return (
    <div style={S.bar}>
      {canRoll && (
        <Button onClick={actions.rollDice}>🎲 Roll Dice</Button>
      )}
      {isSetupSettlement && (
        <span style={{ color: '#f1c40f', fontSize: 13 }}>Click a vertex to place your settlement</span>
      )}
      {isSetupRoad && (
        <span style={{ color: '#f1c40f', fontSize: 13 }}>Click an edge to place your road</span>
      )}
      {isRobberMove && (
        <span style={{ color: '#e74c3c', fontSize: 13 }}>Click a tile to move the robber</span>
      )}
      {isRobberSteal && (
        <Button onClick={() => onOpenModal('STEAL')} variant="danger">Choose who to steal from</Button>
      )}
      {isRoadBuilding && (
        <span style={{ color: '#3498db', fontSize: 13 }}>Place a free road on the board</span>
      )}

      {phase === 'MAIN' && myTurn && (
        <>
          <Button
            disabled={!canBuild.ROAD}
            style={selectedAction === 'BUILD_ROAD' ? S.active : {}}
            onClick={() => toggle('BUILD_ROAD')} variant="secondary">
            Road (🪵🧱)
          </Button>
          <Button
            disabled={!canBuild.SETTLEMENT}
            style={selectedAction === 'BUILD_SETTLEMENT' ? S.active : {}}
            onClick={() => toggle('BUILD_SETTLEMENT')} variant="secondary">
            Settlement
          </Button>
          <Button
            disabled={!canBuild.CITY}
            style={selectedAction === 'BUILD_CITY' ? S.active : {}}
            onClick={() => toggle('BUILD_CITY')} variant="secondary">
            City
          </Button>
          <Button disabled={!canBuild.DEV_CARD} onClick={actions.buyDevCard} variant="secondary">
            Buy Dev Card
          </Button>
          <Button onClick={() => onOpenModal('TRADE')} variant="secondary">
            Trade
          </Button>
          {hasPlayableDevCards && (
            <Button onClick={() => onOpenModal('DEV_CARD')} variant="secondary">
              Play Dev Card
            </Button>
          )}
          <Button onClick={actions.endTurn} variant="primary">End Turn →</Button>
        </>
      )}
    </div>
  );
}
