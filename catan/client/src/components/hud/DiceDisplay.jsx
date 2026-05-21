const pips = {
  1: [[50, 50]], 2: [[25, 25], [75, 75]], 3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function Die({ value }) {
  const isRed = value === 6;
  return (
    <svg width={40} height={40} viewBox="0 0 100 100">
      <rect x={5} y={5} width={90} height={90} rx={15}
        fill={isRed ? '#c0392b' : '#f5f5f5'} stroke="#333" strokeWidth={4} />
      {(pips[value] || []).map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={9}
          fill={isRed ? '#fff' : '#222'} />
      ))}
    </svg>
  );
}

export default function DiceDisplay({ lastRoll }) {
  if (!lastRoll) return null;
  const total = lastRoll[0] + lastRoll[1];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(22,33,62,0.9)', padding: '8px 12px',
      borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
      <Die value={lastRoll[0]} />
      <Die value={lastRoll[1]} />
      <span style={{ fontSize: 20, fontWeight: 700, color: total === 7 ? '#e74c3c' : '#f1c40f' }}>
        {total}
      </span>
    </div>
  );
}
