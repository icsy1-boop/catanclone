import { actions } from '../../store/actions.js';
import { RESOURCES, RESOURCE_COLORS, RESOURCE_LABELS } from '../../constants/resources.js';
import { Overlay } from './StealModal.jsx';

export default function MonopolyModal({ onClose }) {
  return (
    <Overlay onClose={onClose}>
      <h3 style={{ marginBottom: 16 }}>Monopoly — Choose a resource</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {RESOURCES.map(r => (
          <button key={r}
            onClick={() => { actions.playMonopoly(r); onClose(); }}
            style={{
              padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: RESOURCE_COLORS[r] + '33', color: '#eee',
              outline: `1px solid ${RESOURCE_COLORS[r]}`,
              fontWeight: 600, fontSize: 14,
            }}>
            {RESOURCE_LABELS[r]}
          </button>
        ))}
      </div>
    </Overlay>
  );
}
