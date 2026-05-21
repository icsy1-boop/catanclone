import { useState } from 'react';
import { actions } from '../../store/actions.js';
import { RESOURCES, RESOURCE_COLORS, RESOURCE_LABELS } from '../../constants/resources.js';
import { Overlay } from './StealModal.jsx';
import Button from '../shared/Button.jsx';

export default function YearOfPlentyModal({ onClose }) {
  const [picks, setPicks] = useState([]);

  const pick = (r) => {
    if (picks.length < 2) setPicks([...picks, r]);
  };

  const confirm = () => {
    if (picks.length === 2) {
      actions.playYearOfPlenty(picks[0], picks[1]);
      onClose();
    }
  };

  return (
    <Overlay onClose={onClose}>
      <h3 style={{ marginBottom: 8 }}>Year of Plenty — Take 2 resources</h3>
      <p style={{ color: '#aaa', fontSize: 13, marginBottom: 16 }}>
        Selected: {picks.map(r => RESOURCE_LABELS[r]).join(', ') || 'none'}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {RESOURCES.map(r => (
          <button key={r} onClick={() => pick(r)}
            disabled={picks.length >= 2}
            style={{
              padding: '10px 18px', borderRadius: 8, cursor: picks.length < 2 ? 'pointer' : 'not-allowed',
              background: RESOURCE_COLORS[r] + '33', color: '#eee',
              border: `1px solid ${RESOURCE_COLORS[r]}`,
              fontWeight: 600, fontSize: 14,
              opacity: picks.length >= 2 ? 0.5 : 1,
            }}>
            {RESOURCE_LABELS[r]}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={() => setPicks([])} variant="ghost">Reset</Button>
        <Button onClick={confirm} disabled={picks.length < 2}>Confirm</Button>
      </div>
    </Overlay>
  );
}
