import { useRef, useState, useCallback } from 'react';
import { axialToPixel, vertexKeyFromHexCorner, hexEdgeVertexKeys, edgeKey } from '../../utils/hexMath.js';
import HexTile from './HexTile.jsx';
import Vertex from './Vertex.jsx';
import Edge from './Edge.jsx';
import RobberToken from './RobberToken.jsx';
import { useGamePhase } from '../../hooks/useGamePhase.js';
import { actions } from '../../store/actions.js';
import { useUIStore } from '../../store/uiStore.js';
import { RESOURCE_COLORS, RESOURCE_LABELS } from '../../constants/resources.js';

const HEX_SIZE = 60;

const PORT_COLORS = {
  WOOD: RESOURCE_COLORS.WOOD,
  BRICK: RESOURCE_COLORS.BRICK,
  SHEEP: RESOURCE_COLORS.SHEEP,
  WHEAT: RESOURCE_COLORS.WHEAT,
  ORE: RESOURCE_COLORS.ORE,
  null: '#b8a98a',
};

// Group port vertices into pairs by portId, return pairs with pixel positions.
function getPortPairs(board, vertexPixels) {
  const byPortId = {};
  for (const [vk, v] of Object.entries(board.vertices)) {
    if (!v.port?.portId) continue;
    const pid = v.port.portId;
    if (!byPortId[pid]) byPortId[pid] = { port: v.port, vks: [] };
    byPortId[pid].vks.push(vk);
  }
  return Object.values(byPortId).map(({ port, vks }) => {
    const pts = vks.map(vk => vertexPixels[vk]).filter(Boolean);
    return { port, pts, vks };
  }).filter(({ pts }) => pts.length >= 1);
}

// Render a Colonist-style port: two dock posts at the vertices, connecting line, label outside.
function PortDock({ port, pts, boardCx, boardCy }) {
  const color = PORT_COLORS[port.resource] ?? PORT_COLORS[null];
  const label = port.resource ? `2:1\n${RESOURCE_LABELS[port.resource]}` : '3:1';

  if (pts.length < 2) {
    // Only one vertex found — just render a badge outward
    const { x, y } = pts[0];
    const dx = x - boardCx, dy = y - boardCy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const lx = x + (dx / len) * HEX_SIZE * 0.55;
    const ly = y + (dy / len) * HEX_SIZE * 0.55;
    return (
      <g>
        <circle cx={lx} cy={ly} r={HEX_SIZE * 0.2} fill="rgba(10,20,50,0.92)" stroke={color} strokeWidth={1.5} />
        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={HEX_SIZE * 0.13} fontWeight={700}>{label}</text>
      </g>
    );
  }

  const [p1, p2] = pts;
  // Midpoint between the two vertices
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  // Direction outward from board center
  const dx = mx - boardCx, dy = my - boardCy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / len, ny = dy / len;
  // Dock post tips — extend each vertex outward
  const dockLen = HEX_SIZE * 0.38;
  const tip1 = { x: p1.x + nx * dockLen, y: p1.y + ny * dockLen };
  const tip2 = { x: p2.x + nx * dockLen, y: p2.y + ny * dockLen };
  // Label position — further out between the two tips
  const lx = mx + nx * HEX_SIZE * 0.7;
  const ly = my + ny * HEX_SIZE * 0.7;

  return (
    <g>
      {/* Dock planks: vertex → tip */}
      <line x1={p1.x} y1={p1.y} x2={tip1.x} y2={tip1.y} stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
      <line x1={p2.x} y1={p2.y} x2={tip2.x} y2={tip2.y} stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
      {/* Cross-beam connecting the two tips */}
      <line x1={tip1.x} y1={tip1.y} x2={tip2.x} y2={tip2.y} stroke={color} strokeWidth={2} opacity={0.6} />
      {/* Post caps */}
      <circle cx={tip1.x} cy={tip1.y} r={3} fill={color} opacity={0.9} />
      <circle cx={tip2.x} cy={tip2.y} r={3} fill={color} opacity={0.9} />
      {/* Label badge */}
      <circle cx={lx} cy={ly} r={HEX_SIZE * 0.21} fill="rgba(10,20,50,0.93)" stroke={color} strokeWidth={1.5} />
      <text x={lx} y={ly - (port.resource ? 5 : 0)} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={HEX_SIZE * 0.14} fontWeight={700}>
        {port.resource ? '2:1' : '3:1'}
      </text>
      {port.resource && (
        <text x={lx} y={ly + 7} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={HEX_SIZE * 0.105}>
          {RESOURCE_LABELS[port.resource]}
        </text>
      )}
    </g>
  );
}

function vertexPixelFromKey(vk) {
  // vk = "q1,r1,s1|q2,r2,s2|q3,r3,s3" — average the 3 hex centers (incl. off-board ones)
  const hexes = vk.split('|').map(h => {
    const parts = h.split(',').map(Number);
    return { q: parts[0], r: parts[1] };
  });
  const pts = hexes.map(h => axialToPixel(h.q, h.r, HEX_SIZE));
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / 3,
    y: pts.reduce((s, p) => s + p.y, 0) / 3,
  };
}

function buildPixelMaps(board) {
  const tilePixels = {};
  for (const tile of board.tiles) {
    const { x, y } = axialToPixel(tile.q, tile.r, HEX_SIZE);
    tilePixels[tile.id] = { cx: x, cy: y };
  }

  const vertexPixels = {};
  for (const vk of Object.keys(board.vertices)) {
    vertexPixels[vk] = vertexPixelFromKey(vk);
  }

  return { tilePixels, vertexPixels };
}

export default function BoardCanvas({ gameState }) {
  const svgRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(null);

  const { legalVertices, legalEdges, legalTiles, legalCityVertices,
    isSetupSettlement, isSetupRoad, isRobberMove, isRoadBuilding } = useGamePhase();
  const selectedAction = useUIStore(s => s.selectedAction);

  const board = gameState.board;
  const players = gameState.players;

  const { tilePixels, vertexPixels } = buildPixelMaps(board);

  // Compute SVG viewBox to fit all tiles
  const allX = Object.values(tilePixels).map(p => p.cx);
  const allY = Object.values(tilePixels).map(p => p.cy);
  const minX = Math.min(...allX) - HEX_SIZE * 1.8;
  const minY = Math.min(...allY) - HEX_SIZE * 1.8;
  const maxX = Math.max(...allX) + HEX_SIZE * 1.8;
  const maxY = Math.max(...allY) + HEX_SIZE * 1.8;
  const vbWidth = maxX - minX;
  const vbHeight = maxY - minY;

  // Pan & zoom handlers
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(3, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  }, []);

  const onMouseDown = (e) => { dragging.current = { x: e.clientX, y: e.clientY, pan: { ...pan } }; };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = (e.clientX - dragging.current.x) / zoom;
    const dy = (e.clientY - dragging.current.y) / zoom;
    setPan({ x: dragging.current.pan.x + dx, y: dragging.current.pan.y + dy });
  };
  const onMouseUp = () => { dragging.current = null; };

  const isLegalVertex = (vk) => legalVertices.has(vk) || legalCityVertices.has(vk);
  const isLegalEdge = (ek) => legalEdges.has(ek);

  const handleVertexClick = (vk) => {
    if (isSetupSettlement) { actions.placeInitialSettlement(vk); return; }
    if (selectedAction === 'BUILD_SETTLEMENT' && legalVertices.has(vk)) { actions.buildSettlement(vk); return; }
    if (selectedAction === 'BUILD_CITY' && legalCityVertices.has(vk)) { actions.buildCity(vk); return; }
  };

  const handleEdgeClick = (ek) => {
    if (isSetupRoad) { actions.placeInitialRoad(ek); return; }
    if (isRoadBuilding && legalEdges.has(ek)) { actions.buildRoad(ek); return; }
    if (selectedAction === 'BUILD_ROAD' && legalEdges.has(ek)) { actions.buildRoad(ek); return; }
  };

  const robberTile = board.tiles.find(t => t.hasRobber);

  // Board center (average of all tile centers) — used for port outward direction
  const tilePixelList = Object.values(tilePixels);
  const boardCx = tilePixelList.reduce((s, p) => s + p.cx, 0) / tilePixelList.length;
  const boardCy = tilePixelList.reduce((s, p) => s + p.cy, 0) / tilePixelList.length;

  const portPairs = getPortPairs(board, vertexPixels);

  // Compute edge pixel endpoints from vertex pixel positions
  const edgeEntries = Object.entries(board.edges).map(([ek, edge]) => {
    const [vk1, vk2] = edge.adjacentVertices;
    const p1 = vertexPixels[vk1];
    const p2 = vertexPixels[vk2];
    if (!p1 || !p2) return null;
    return { ek, edge, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  }).filter(Boolean);

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '100%', background: '#1a3a5c', userSelect: 'none' }}
      viewBox={`${minX} ${minY} ${vbWidth} ${vbHeight}`}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
         transformOrigin="center">

        {/* Port docks — rendered before tiles so they appear behind */}
        {portPairs.map(({ port, pts }, i) => (
          <PortDock key={port.portId ?? i} port={port} pts={pts} boardCx={boardCx} boardCy={boardCy} />
        ))}

        {/* Tiles */}
        {board.tiles.map(tile => {
          const { cx, cy } = tilePixels[tile.id];
          return (
            <HexTile key={tile.id} tile={tile} cx={cx} cy={cy} size={HEX_SIZE}
              isLegalRobber={isRobberMove && legalTiles.has(tile.id)}
              onClick={() => actions.moveRobber(tile.id)} />
          );
        })}

        {/* Edges (roads) */}
        {edgeEntries.map(({ ek, edge, x1, y1, x2, y2 }) => (
          <Edge key={ek} edge={edge} x1={x1} y1={y1} x2={x2} y2={y2}
            size={HEX_SIZE} isLegal={isLegalEdge(ek)}
            players={players} onClick={() => handleEdgeClick(ek)} />
        ))}

        {/* Vertices (settlements/cities) */}
        {Object.entries(board.vertices).map(([vk, vertex]) => {
          const p = vertexPixels[vk];
          if (!p) return null;
          return (
            <Vertex key={vk} vertex={vertex} cx={p.x} cy={p.y}
              size={HEX_SIZE} isLegal={isLegalVertex(vk)}
              players={players} onClick={() => handleVertexClick(vk)} />
          );
        })}

        {/* Robber */}
        {robberTile && (() => {
          const { cx, cy } = tilePixels[robberTile.id];
          return <RobberToken cx={cx} cy={cy} size={HEX_SIZE} />;
        })()}

      </g>
    </svg>
  );
}
