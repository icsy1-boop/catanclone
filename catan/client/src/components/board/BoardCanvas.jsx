import { useRef, useState, useCallback } from 'react';
import { axialToPixel, vertexKeyFromHexCorner, hexEdgeVertexKeys, edgeKey } from '../../utils/hexMath.js';
import HexTile from './HexTile.jsx';
import Vertex from './Vertex.jsx';
import Edge from './Edge.jsx';
import RobberToken from './RobberToken.jsx';
import { useGamePhase } from '../../hooks/useGamePhase.js';
import { actions } from '../../store/actions.js';
import { useUIStore } from '../../store/uiStore.js';

const HEX_SIZE = 60;

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
  const minX = Math.min(...allX) - HEX_SIZE * 1.2;
  const minY = Math.min(...allY) - HEX_SIZE * 1.2;
  const maxX = Math.max(...allX) + HEX_SIZE * 1.2;
  const maxY = Math.max(...allY) + HEX_SIZE * 1.2;
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
