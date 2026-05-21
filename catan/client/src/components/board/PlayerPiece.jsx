export default function PlayerPiece({ type, color, cx, cy, size }) {
  const s = size * 0.35;
  if (type === 'ROAD') {
    // Rendered by Edge component
    return null;
  }
  if (type === 'SETTLEMENT') {
    // House shape: square base + triangle roof
    const w = s * 1.2, h = s;
    return (
      <g transform={`translate(${cx - w / 2}, ${cy - h})`}>
        <rect x={0} y={h * 0.45} width={w} height={h * 0.55} fill={color} stroke="#fff" strokeWidth={1.5} />
        <polygon points={`0,${h * 0.5} ${w / 2},0 ${w},${h * 0.5}`} fill={color} stroke="#fff" strokeWidth={1.5} />
      </g>
    );
  }
  if (type === 'CITY') {
    // Taller/wider shape for city
    const w = s * 1.6, h = s * 1.3;
    return (
      <g transform={`translate(${cx - w / 2}, ${cy - h})`}>
        <rect x={0} y={h * 0.4} width={w * 0.55} height={h * 0.6} fill={color} stroke="#fff" strokeWidth={1.5} />
        <rect x={w * 0.5} y={h * 0.25} width={w * 0.5} height={h * 0.75} fill={color} stroke="#fff" strokeWidth={1.5} />
        <polygon points={`${w * 0.5},${h * 0.3} ${w * 0.75},0 ${w},${h * 0.3}`} fill={color} stroke="#fff" strokeWidth={1.5} />
      </g>
    );
  }
  return null;
}
