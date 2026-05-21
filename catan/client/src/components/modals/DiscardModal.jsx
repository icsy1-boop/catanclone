import { useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { actions } from '../../store/actions.js';
import { RESOURCES, RESOURCE_COLORS, RESOURCE_LABELS } from '../../constants/resources.js';

export default function DiscardModal({ mustDiscard }) {
  const { myResources } = useGameStore();
  const [selected, setSelected] = useState({});

  const total = RESOURCES.reduce((s, r) => s + (selected[r] || 0), 0);
  const remaining = mustDiscard - total;

  const add = (r) => {
    if (total >= mustDiscard) return;
    if ((selected[r] || 0) >= (myResources[r] || 0)) return;
    setSelected(prev => ({ ...prev, [r]: (prev[r] || 0) + 1 }));
  };

  const remove = (r) => {
    if ((selected[r] || 0) <= 0) return;
    setSelected(prev => ({ ...prev, [r]: prev[r] - 1 }));
  };

  const confirm = () => {
    if (total === mustDiscard) actions.discardResources(selected);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{
        background: '#16213e', borderRadius: 14, padding: 28, width: 360,
        border: '2px solid #e74c3c',
      }}>
        <h3 style={{ color: '#e74c3c', marginBottom: 6 }}>Discard Resources</h3>
        <p style={{ color: '#aaa', fontSize: 13, marginBottom: 20 }}>
          You rolled a 7 with {(myResources ? RESOURCES.reduce((s,r) => s+(myResources[r]||0), 0) : 0)} cards.
          Choose {mustDiscard} to discard. ({remaining} remaining)
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {RESOURCES.map(r => {
            const have = myResources?.[r] || 0;
            const sel = selected[r] || 0;
            if (have === 0) return null;
            return (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: RESOURCE_COLORS[r], fontWeight: 600, width: 60, fontSize: 13 }}>
                  {RESOURCE_LABELS[r]}
                </span>
                <span style={{ color: '#777', fontSize: 12, width: 40 }}>({have})</span>
                <button onClick={() => remove(r)} style={btnStyle}>−</button>
                <span style={{ width: 28, textAlign: 'center', fontWeight: 700,
                  color: sel > 0 ? '#e74c3c' : '#555' }}>{sel}</span>
                <button onClick={() => add(r)} disabled={total >= mustDiscard || sel >= have}
                  style={{ ...btnStyle, opacity: (total >= mustDiscard || sel >= have) ? 0.4 : 1 }}>+</button>
              </div>
            );
          })}
        </div>

        <button
          onClick={confirm}
          disabled={total !== mustDiscard}
          style={{
            width: '100%', padding: 12, borderRadius: 8, border: 'none',
            background: total === mustDiscard ? '#e74c3c' : '#333',
            color: '#fff', fontWeight: 700, fontSize: 15,
            cursor: total === mustDiscard ? 'pointer' : 'not-allowed',
          }}>
          {total === mustDiscard ? 'Discard' : `Select ${remaining} more`}
        </button>
      </div>
    </div>
  );
}

const btnStyle = {
  width: 28, height: 28, borderRadius: 6, border: 'none',
  background: '#2c3e50', color: '#eee', cursor: 'pointer', fontSize: 16,
};
