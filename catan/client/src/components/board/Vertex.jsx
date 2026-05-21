import PlayerPiece from './PlayerPiece.jsx';

export default function Vertex({ vertex, cx, cy, size, isLegal, players, onClick }) {
  const building = vertex.building;
  const player = building ? players[building.playerId] : null;
  const r = size * 0.15;

  return (
    <g onClick={isLegal || building ? onClick : undefined}
       style={{ cursor: isLegal ? 'pointer' : 'default' }}>
      {isLegal && (
        <circle cx={cx} cy={cy} r={r * 2.2}
          fill="rgba(255,255,0,0.18)" stroke="#f1c40f"
          strokeWidth={2} strokeDasharray="4,3" />
      )}
      {building && (
        <PlayerPiece type={building.type} color={player?.color || '#888'}
          cx={cx} cy={cy} size={size} />
      )}
      {!building && isLegal && (
        <circle cx={cx} cy={cy} r={r} fill="#f1c40f" opacity={0.7} />
      )}
    </g>
  );
}
