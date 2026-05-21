export default function RobberToken({ cx, cy, size }) {
  const r = size * 0.22;
  return (
    <g pointerEvents="none">
      <circle cx={cx} cy={cy} r={r} fill="#1a1a1a" stroke="#555" strokeWidth={2} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#eee" fontSize={r * 0.9} fontWeight={700}>R</text>
    </g>
  );
}
