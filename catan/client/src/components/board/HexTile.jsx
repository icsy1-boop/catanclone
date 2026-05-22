import { hexCornerPixels } from '../../utils/hexMath.js';

const DOT_COUNTS = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };

const TERRAIN_GRADIENT = {
  FOREST:   ['#1c5c30', '#2a7a40', '#0e3a1c'],
  HILLS:    ['#a0522d', '#c1763f', '#7a3318'],
  MOUNTAINS:['#78909c', '#9eb3bc', '#546e7a'],
  FIELDS:   ['#c8a81a', '#e8c930', '#9a7d0a'],
  PASTURE:  ['#6aad2e', '#88cc40', '#4c8a20'],
  DESERT:   ['#c8ad7a', '#dfc896', '#a88c58'],
  WATER:    ['#1565c0', '#1e88e5', '#0d47a1'],
};

// SVG texture files — A4 plotter sheet overlaid at low opacity for texture
const TERRAIN_TEXTURE = {
  FOREST:   '/textures/wood.svg',
  HILLS:    '/textures/brick.svg',
  MOUNTAINS:'/textures/ore.svg',
  FIELDS:   '/textures/wheat.svg',
  PASTURE:  '/textures/wool.svg',
  DESERT:   '/textures/ore.svg',
};

const TERRAIN_ICON = {
  FOREST:   '🌲',
  HILLS:    '🧱',
  MOUNTAINS:'⛰',
  FIELDS:   '🌾',
  PASTURE:  '🐑',
  DESERT:   '☀',
};

export default function HexTile({ tile, cx, cy, size, isLegalRobber, onClick }) {
  const corners = hexCornerPixels(cx, cy, size);
  const points = corners.map(p => `${p.x},${p.y}`).join(' ');
  const isRed = tile.numberToken === 6 || tile.numberToken === 8;
  const dots = tile.numberToken ? (DOT_COUNTS[tile.numberToken] || 0) : 0;
  const dotR = size * 0.028;
  const dotGap = size * 0.075;
  const gradId = `tgrad-${tile.id}`;
  const clipId = `thex-${tile.id}`;
  const [base, light, dark] = TERRAIN_GRADIENT[tile.terrain] || ['#555', '#777', '#333'];
  const texSrc = TERRAIN_TEXTURE[tile.terrain];

  return (
    <g onClick={isLegalRobber ? onClick : undefined}
      style={{ cursor: isLegalRobber ? 'pointer' : 'default' }}>
      <defs>
        <radialGradient id={gradId} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={base} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        <clipPath id={clipId}>
          <polygon points={points} />
        </clipPath>
      </defs>

      {/* Base gradient fill */}
      <polygon points={points} fill={`url(#${gradId})`} stroke="#111" strokeWidth={1.5} />

      {/* SVG texture overlay — clipped to hex shape, multiply blend */}
      {texSrc && (
        <image
          href={texSrc}
          x={cx - size * 1.1}
          y={cy - size * 1.1}
          width={size * 2.2}
          height={size * 2.2}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
          opacity={0.5}
          style={{ mixBlendMode: 'multiply' }}
        />
      )}

      {/* Terrain icon */}
      {TERRAIN_ICON[tile.terrain] && (
        <text
          x={cx} y={cy + (tile.numberToken ? -size * 0.26 : size * 0.08)}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={size * (tile.terrain === 'FIELDS' ? 0.28 : 0.32)}
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          {TERRAIN_ICON[tile.terrain]}
        </text>
      )}

      {/* Number token */}
      {tile.numberToken && (
        <>
          <circle cx={cx} cy={cy} r={size * 0.28}
            fill={isLegalRobber ? 'rgba(255,100,100,0.3)' : 'rgba(255,255,230,0.93)'}
            stroke={isRed ? '#e74c3c' : '#555'}
            strokeWidth={isRed ? 2 : 1} />
          <text x={cx} y={cy - size * 0.04} textAnchor="middle" dominantBaseline="middle"
            fill={isRed ? '#e74c3c' : '#222'} fontSize={size * 0.22} fontWeight={isRed ? 700 : 600}
            style={{ userSelect: 'none' }}>
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
        <polygon points={points} fill="rgba(220,0,0,0.15)" stroke="#e74c3c"
          strokeWidth={3} strokeDasharray="6,4" />
      )}
    </g>
  );
}
