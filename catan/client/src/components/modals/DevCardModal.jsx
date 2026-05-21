import { useGameStore } from '../../store/gameStore.js';
import { actions } from '../../store/actions.js';
import { Overlay } from './StealModal.jsx';
import Button from '../shared/Button.jsx';

const CARD_DESCRIPTIONS = {
  KNIGHT: 'Move the robber and steal a resource.',
  ROAD_BUILDING: 'Build 2 roads for free.',
  YEAR_OF_PLENTY: 'Take any 2 resources from the bank.',
  MONOPOLY: 'Claim all of one resource from all players.',
};

export default function DevCardModal({ onClose, onSpecialCard }) {
  const { myDevCards } = useGameStore();

  const playable = Object.entries(myDevCards)
    .filter(([k, v]) => v > 0 && k !== 'VP')
    .map(([k]) => k);

  return (
    <Overlay onClose={onClose}>
      <h3 style={{ marginBottom: 16 }}>Play a Development Card</h3>
      {playable.length === 0 && <p style={{ color: '#aaa' }}>No playable dev cards.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {playable.map(card => (
          <button key={card}
            onClick={() => {
              if (card === 'MONOPOLY') { onSpecialCard('MONOPOLY'); }
              else if (card === 'YEAR_OF_PLENTY') { onSpecialCard('YEAR_OF_PLENTY'); }
              else { actions.playDevCard(card); }
              onClose();
            }}
            style={{
              padding: '12px 16px', borderRadius: 8, border: '1px solid #333',
              background: '#0f3460', color: '#eee', cursor: 'pointer', textAlign: 'left',
            }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{card.replace('_', ' ')}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{CARD_DESCRIPTIONS[card]}</div>
          </button>
        ))}
      </div>
    </Overlay>
  );
}
