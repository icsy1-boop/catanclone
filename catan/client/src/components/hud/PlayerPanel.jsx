import { useGameStore } from '../../store/gameStore.js';
import ResourceIcon from '../shared/ResourceIcon.jsx';
import { RESOURCES } from '../../constants/resources.js';

const S = {
  panel: {
    background: 'rgba(22,33,62,0.95)', borderRadius: 10, padding: 14,
    minWidth: 200, backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  name: { fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#f39c12' },
  row: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  devLabel: { fontSize: 12, color: '#aaa', marginTop: 6, marginBottom: 4 },
};

const DEV_LABELS = {
  KNIGHT: 'Knight', ROAD_BUILDING: 'Road Bldg',
  YEAR_OF_PLENTY: 'YoP', MONOPOLY: 'Monopoly', VP: 'VP',
};

export default function PlayerPanel() {
  const { myResources, myDevCards, myNewDevCards, myPlayer } = useGameStore();
  const player = myPlayer();

  return (
    <div style={S.panel}>
      <div style={S.name}>{player?.name || 'You'}</div>
      <div style={S.row}>
        {RESOURCES.map(r => (
          <ResourceIcon key={r} resource={r} count={myResources[r] || 0} />
        ))}
      </div>
      <div style={S.devLabel}>Dev cards:</div>
      <div style={S.row}>
        {Object.entries(myDevCards).map(([card, count]) =>
          count > 0 ? (
            <span key={card} style={{
              background: '#0f3460', borderRadius: 6, padding: '2px 8px',
              fontSize: 12, color: '#eee',
            }}>{DEV_LABELS[card]} ×{count}</span>
          ) : null
        )}
        {myNewDevCards.map((card, i) => (
          <span key={i} style={{
            background: '#0f3460', borderRadius: 6, padding: '2px 8px',
            fontSize: 12, color: '#aaa', border: '1px dashed #555',
          }}>{DEV_LABELS[card]} (new)</span>
        ))}
        {Object.values(myDevCards).every(c => c === 0) && myNewDevCards.length === 0 &&
          <span style={{ color: '#555', fontSize: 12 }}>None</span>}
      </div>
    </div>
  );
}
