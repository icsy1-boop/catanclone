import { hexCornerPixels } from '../../utils/hexMath.js';
import { TERRAIN_COLORS } from '../../constants/resources.js';

const DOT_COUNTS = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };

export default function HexTile({ tile, cx, cy, size, isLegalRobber, onClick }) {
  const corners = hexCornerPixels(cx, cy, size);
  const points = corners.map(p => `${p.x},${p.y}`).join(' ');
  const isRed = tile.numberToken === 6 || tile.numberToken === 8;
  const dots = tile.numberToken ? (DOT_COUNTS[tile.numberToken] || 0) : 0;
  const dotR = size * 0.028;
  const dotGap = size * 0.075;

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
          <text x={cx} y={cy - size * 0.04} textAnchor="middle" dominantBaseline="middle"
            fill={isRed ? '#e74c3c' : '#222'} fontSize={size * 0.22} fontWeight={isRed ? 700 : 600}>
            {tile.numberToken}
          </text>
          {Array.from({ length: dots }, (_, i) => (
            <circle key={i}
              cx={cx + (i - (dots - 1) / 2) * dotGap}
              cy={cy + size * 0.13}
              r={dotR}
              fill={isRed ? '#e74c3c' : '#555'}
            />
          ))}
        </>
      )}
      {isLegalRobber && (
        <polygon points={points} fill="rgba(255,0,0,0.12)" stroke="#e74c3c"
          strokeWidth={3} strokeDasharray="6,4" />
      )}
    </g>
  );
}
