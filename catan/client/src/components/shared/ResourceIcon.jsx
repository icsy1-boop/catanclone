import { RESOURCE_COLORS, RESOURCE_LABELS } from '../../constants/resources.js';

export default function ResourceIcon({ resource, count, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: RESOURCE_COLORS[resource] + '33',
      border: `1px solid ${RESOURCE_COLORS[resource]}`,
      borderRadius: 6, padding: '2px 7px', fontSize: 13,
      color: '#eee', ...style,
    }}>
      <span style={{ color: RESOURCE_COLORS[resource], fontWeight: 700 }}>
        {count !== undefined ? count : ''}
      </span>
      {RESOURCE_LABELS[resource]}
    </span>
  );
}
