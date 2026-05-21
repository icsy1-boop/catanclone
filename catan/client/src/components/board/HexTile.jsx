import { hexCornerPixels } from '../../utils/hexMath.js';
import { TERRAIN_COLORS } from '../../constants/resources.js';

export default function HexTile({ tile, cx, cy, size, isLegalRobber, onClick }) {
  const corners = hexCornerPixels(cx, cy, size);
  const points = corners.map(p => `${p.x},${p.y}`).join(' ');
  const isRed = tile.numberToken === 6 || tile.numberToken === 8;

  return (
    <g onClick={isLegalRobber ? onClick : undefined}
       style={{ cursor: isLegalRobber ? 'pointer' : 'default' }}>
      <polygon
        points={points}
        fill={TERRAIN_COLORS[tile.terrain] || '#555'}
        stroke="#1a1a2e"
        strokeWidth={2}
      />
      {tile.numberToken && (
        <>
          <circle cx={cx} cy={cy} r={size * 0.28}
            fill={isLegalRobber ? 'rgba(255,100,100,0.3)' : 'rgba(255,255,240,0.9)'}
            stroke={isRed ? '#e74c3c' : '#333'}
            strokeWidth={isRed ? 2 : 1} />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
            fill={isRed ? '#e74c3c' : '#222'} fontSize={size * 0.22} fontWeight={isRed ? 700 : 600}>
            {tile.numberToken}
          </text>
        </>
      )}
      {isLegalRobber && (
        <polygon points={points} fill="rgba(255,0,0,0.12)" stroke="#e74c3c"
          strokeWidth={3} strokeDasharray="6,4" />
      )}
    </g>
  );
}
