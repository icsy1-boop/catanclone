import {
  spiralRings, hexNeighbors, vertexKeyFromHexCorner,
  hexEdgeVertexKeys, edgeKey,
} from '../utils/hexMath.js';

// ── Terrain tile counts per board size ─────────────────────────────────────
const BOARD_CONFIGS = {
  small: {  // 3-4 players: 19 tiles
    terrains: {
      HILLS: 3, FOREST: 4, MOUNTAINS: 3, FIELDS: 4, PASTURE: 4, DESERT: 1,
    },
    tokens: [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11],
    rings: 2,
    ports: [
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'WOOD' },
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'BRICK' },
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'WHEAT' },
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'SHEEP' },
      { ratio: 2, resource: 'ORE' },
    ],
  },
  medium: { // 5-6 players: 30 tiles
    terrains: {
      HILLS: 5, FOREST: 6, MOUNTAINS: 5, FIELDS: 6, PASTURE: 6, DESERT: 2,
    },
    tokens: [
      2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12,
      3, 4, 5, 6, 8, 9, 10, 11, 2, 12,
    ],
    rings: 3,
    extraHexes: 11, // remove outer ring corners to get ~30
    ports: [
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'WOOD' },
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'BRICK' },
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'WHEAT' },
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'SHEEP' },
      { ratio: 2, resource: 'ORE' },
      { ratio: 3, resource: null },
      { ratio: 3, resource: null },
    ],
  },
  large: {  // 7-8 players: 37 tiles (full 3-ring board)
    terrains: {
      HILLS: 7, FOREST: 7, MOUNTAINS: 7, FIELDS: 7, PASTURE: 7, DESERT: 2,
    },
    tokens: [
      2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5,
      6, 6, 6, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10,
      11, 11, 11, 11, 12, 12, 2,
    ],
    rings: 3,
    ports: [
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'WOOD' },
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'BRICK' },
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'WHEAT' },
      { ratio: 3, resource: null },
      { ratio: 2, resource: 'SHEEP' },
      { ratio: 2, resource: 'ORE' },
      { ratio: 3, resource: null },
      { ratio: 3, resource: null },
      { ratio: 3, resource: null },
    ],
  },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function expandTerrains(terrainCounts) {
  const arr = [];
  for (const [terrain, count] of Object.entries(terrainCounts)) {
    for (let i = 0; i < count; i++) arr.push(terrain);
  }
  return arr;
}

// Check if 6 or 8 tokens are adjacent to each other
function hasAdjacentRedNumbers(tiles, tileMap) {
  for (const tile of tiles) {
    if (tile.numberToken !== 6 && tile.numberToken !== 8) continue;
    for (const nb of hexNeighbors(tile.q, tile.r)) {
      const key = `${nb.q},${nb.r}`;
      const nbTile = tileMap[key];
      if (nbTile && (nbTile.numberToken === 6 || nbTile.numberToken === 8)) {
        return true;
      }
    }
  }
  return false;
}

function buildTileMap(tiles) {
  const map = {};
  for (const t of tiles) map[`${t.q},${t.r}`] = t;
  return map;
}

// Identify coastal hex positions (those adjacent to at least one missing hex)
function getCoastalHexes(tiles, allRingPositions) {
  const tileSet = new Set(tiles.map(t => `${t.q},${t.r}`));
  return tiles.filter(tile => {
    for (const nb of hexNeighbors(tile.q, tile.r)) {
      if (!tileSet.has(`${nb.q},${nb.r}`)) return true;
    }
    return false;
  });
}

// Build the vertex and edge graph from a set of tiles
function buildGraph(tiles) {
  const tileSet = new Set(tiles.map(t => `${t.q},${t.r}`));
  const vertices = {};
  const edges = {};
  const tileLookup = buildTileMap(tiles);

  for (const tile of tiles) {
    for (let corner = 0; corner < 6; corner++) {
      const vk = vertexKeyFromHexCorner(tile.q, tile.r, corner);
      if (!vertices[vk]) {
        vertices[vk] = { id: vk, building: null, port: null, adjacentTiles: [] };
      }
      if (!vertices[vk].adjacentTiles.includes(tile.id)) {
        vertices[vk].adjacentTiles.push(tile.id);
      }

      // Edge between corner and next corner
      const [vk1, vk2] = hexEdgeVertexKeys(tile.q, tile.r, corner);
      const ek = edgeKey(vk1, vk2);
      if (!edges[ek]) {
        edges[ek] = { id: ek, road: null, adjacentVertices: [vk1, vk2] };
      }
    }
  }

  return { vertices, edges };
}

// Assign ports to coastal vertices.
// Strategy: walk the outer perimeter of the board in order, placing ports
// on edge midpoints at regular intervals.
function assignPorts(tiles, vertices, portConfigs) {
  // Find the perimeter vertices (vertices touching only 1 or 2 tiles in the board)
  const tileSet = new Set(tiles.map(t => `${t.q},${t.r}`));

  // Find coastal edges: edges between two vertices where at least one adjacent tile
  // has a missing neighbor (i.e., the edge is on the outside)
  // Simpler approach: find vertices adjacent to only 1 or 2 board tiles
  const coastalVertices = Object.values(vertices).filter(v => v.adjacentTiles.length <= 2);

  if (coastalVertices.length === 0 || portConfigs.length === 0) return;

  // Distribute ports evenly along coastal vertices
  const step = Math.floor(coastalVertices.length / portConfigs.length);
  const shuffledPorts = shuffle(portConfigs);

  for (let i = 0; i < shuffledPorts.length; i++) {
    const idx = (i * step) % coastalVertices.length;
    const v = coastalVertices[idx];
    if (!v.port) {
      v.port = shuffledPorts[i];
      // Also assign to an adjacent coastal vertex to make a 2-vertex port
      const nextIdx = (idx + 1) % coastalVertices.length;
      const v2 = coastalVertices[nextIdx];
      if (!v2.port) v2.port = shuffledPorts[i];
    }
  }
}

export function generateBoard(playerCount) {
  let config;
  if (playerCount <= 4) config = BOARD_CONFIGS.small;
  else if (playerCount <= 6) config = BOARD_CONFIGS.medium;
  else config = BOARD_CONFIGS.large;

  // Generate hex positions
  let positions = spiralRings(config.rings);

  // For medium board, trim outer ring to ~30 tiles by removing every other corner
  if (config.extraHexes) {
    // Remove some outer ring hexes to reach desired count
    const totalTerrains = Object.values(config.terrains).reduce((a, b) => a + b, 0);
    const ring3 = positions.filter(p => Math.max(Math.abs(p.q), Math.abs(p.r), Math.abs(-p.q - p.r)) === 3);
    const ring3ToKeep = ring3.length - (positions.length - totalTerrains);
    const keptRing3 = ring3.filter((_, i) => i < ring3ToKeep);
    positions = positions.filter(p => Math.max(Math.abs(p.q), Math.abs(p.r), Math.abs(-p.q - p.r)) < 3)
      .concat(keptRing3);
  }

  // Trim to exact tile count needed
  const totalTerrains = Object.values(config.terrains).reduce((a, b) => a + b, 0);
  positions = positions.slice(0, totalTerrains);

  // Shuffle terrains — desert always gets placed but no special first-placement needed
  let terrains = shuffle(expandTerrains(config.terrains));

  // Assign terrains to positions
  let tiles = positions.map((pos, i) => ({
    id: `tile_${i}`,
    q: pos.q,
    r: pos.r,
    terrain: terrains[i],
    numberToken: null,
    hasRobber: false,
  }));

  // Place robber on first desert
  const desertTile = tiles.find(t => t.terrain === 'DESERT');
  if (desertTile) desertTile.hasRobber = true;

  // Assign number tokens to non-desert tiles, retrying if 6/8 are adjacent
  const nonDesertTiles = tiles.filter(t => t.terrain !== 'DESERT');
  let tokens = [...config.tokens];

  // Pad or trim tokens to match non-desert count
  while (tokens.length < nonDesertTiles.length) tokens.push(3);
  tokens = tokens.slice(0, nonDesertTiles.length);

  let assigned = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    const shuffledTokens = shuffle(tokens);
    nonDesertTiles.forEach((tile, i) => { tile.numberToken = shuffledTokens[i]; });
    const tileMap = buildTileMap(tiles);
    if (!hasAdjacentRedNumbers(tiles, tileMap)) {
      assigned = true;
      break;
    }
  }

  // Build vertex/edge graph
  const { vertices, edges } = buildGraph(tiles);

  // Assign ports
  assignPorts(tiles, vertices, config.ports);

  return { tiles, vertices, edges };
}
