export default function Edge({ edge, x1, y1, x2, y2, size, isLegal, players, onClick }) {
  const road = edge.road;
  const player = road ? players[road.playerId] : null;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const w = size * 0.18;

  return (
    <g onClick={isLegal ? onClick : undefined}
       style={{ cursor: isLegal ? 'pointer' : 'default' }}>
      {road && (
        <rect x={mx - len / 2 + 4} y={my - w / 2}
          width={len - 8} height={w}
          fill={player?.color || '#888'} stroke="#fff" strokeWidth={1}
          rx={w / 2}
          transform={`rotate(${angle}, ${mx}, ${my})`} />
      )}
      {isLegal && (
        <rect x={mx - len / 2 + 4} y={my - w}
          width={len - 8} height={w * 2}
          fill="rgba(241,196,15,0.25)" stroke="#f1c40f" strokeWidth={1.5}
          rx={w} strokeDasharray="4,3"
          transform={`rotate(${angle}, ${mx}, ${my})`} />
      )}
      {/* Invisible wider hit area */}
      <rect x={mx - len / 2} y={my - size * 0.22}
        width={len} height={size * 0.44}
        fill="transparent"
        transform={`rotate(${angle}, ${mx}, ${my})`} />
    </g>
  );
}
