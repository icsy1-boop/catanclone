import { generateBoard } from './BoardGenerator.js';
import { DevCardDeck } from './DevCardDeck.js';
import { Player, RESOURCES } from './Player.js';
import { TurnPhase } from './TurnStateMachine.js';
import { hexNeighbors } from '../utils/hexMath.js';

const PLAYER_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#e91e63',
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(roomCode, playerList) {
  const board = generateBoard(playerList.length);
  const turnOrder = shuffle(playerList.map(p => p.id));

  const players = {};
  playerList.forEach((p, i) => {
    players[p.id] = new Player(p.id, p.name, PLAYER_COLORS[i % PLAYER_COLORS.length]);
  });

  return {
    roomCode,
    phase: 'SETUP',
    turnPhase: TurnPhase.SETUP_PLACE_SETTLEMENT,
    currentPlayerIndex: 0,
    turnOrder,
    setupRound: 1,
    board,
    players,
    devCardDeck: new DevCardDeck(),
    lastRoll: null,
    longestRoadOwner: null,
    longestRoadLength: 0,
    largestArmyOwner: null,
    largestArmyCount: 0,
    winner: null,
    pendingTrades: {},
    log: [],
  };
}

// Serialize game state for broadcast (removes private player data).
export function serializePublic(gs) {
  const players = {};
  for (const [id, p] of Object.entries(gs.players)) {
    players[id] = p.publicView();
  }
  return {
    roomCode: gs.roomCode,
    phase: gs.phase,
    turnPhase: gs.turnPhase,
    currentPlayerIndex: gs.currentPlayerIndex,
    turnOrder: gs.turnOrder,
    setupRound: gs.setupRound,
    board: gs.board,
    players,
    devCardDeckSize: gs.devCardDeck.remaining,
    lastRoll: gs.lastRoll,
    longestRoadOwner: gs.longestRoadOwner,
    largestArmyOwner: gs.largestArmyOwner,
    winner: gs.winner,
    pendingTrades: gs.pendingTrades,
    log: gs.log.slice(-20),
  };
}

// Distribute resources to all players after a dice roll.
export function distributeResources(gs, roll) {
  const TERRAIN_RESOURCE = {
    HILLS: 'BRICK', FOREST: 'WOOD', MOUNTAINS: 'ORE',
    FIELDS: 'WHEAT', PASTURE: 'SHEEP',
  };

  const grants = {}; // playerId → { resource: amount }

  for (const tile of gs.board.tiles) {
    if (tile.numberToken !== roll || tile.hasRobber) continue;
    const resource = TERRAIN_RESOURCE[tile.terrain];
    if (!resource) continue;

    for (const vertex of Object.values(gs.board.vertices)) {
      if (!vertex.adjacentTiles.includes(tile.id)) continue;
      if (!vertex.building) continue;
      const { playerId, type } = vertex.building;
      const amount = type === 'CITY' ? 2 : 1;
      if (!grants[playerId]) grants[playerId] = {};
      grants[playerId][resource] = (grants[playerId][resource] || 0) + amount;
    }
  }

  for (const [pid, res] of Object.entries(grants)) {
    gs.players[pid]?.addResources(res);
  }

  return grants;
}

// Validate and place a settlement (setup or main phase).
export function placeSettlement(gs, playerId, vertexId, isSetup = false) {
  const vertex = gs.board.vertices[vertexId];
  if (!vertex) return { error: 'Invalid vertex' };
  if (vertex.building) return { error: 'Vertex occupied' };

  // Distance rule: no adjacent settlement/city
  const adj = getAdjacentVertices(gs.board, vertexId);
  for (const avk of adj) {
    if (gs.board.vertices[avk]?.building) return { error: 'Too close to existing building' };
  }

  if (!isSetup) {
    const player = gs.players[playerId];
    // Must connect to own road
    const connectedRoad = getAdjacentEdges(gs.board, vertexId)
      .some(ek => gs.board.edges[ek]?.road?.playerId === playerId);
    if (!connectedRoad) return { error: 'Must connect to your road' };

    if (!player.canAfford({ WOOD: 1, BRICK: 1, SHEEP: 1, WHEAT: 1 }))
      return { error: 'Not enough resources' };
    player.deductResources({ WOOD: 1, BRICK: 1, SHEEP: 1, WHEAT: 1 });
    player.settlements--;
  } else {
    gs.players[playerId].settlements--;
  }

  vertex.building = { type: 'SETTLEMENT', playerId };
  gs.players[playerId].victoryPoints++;
  return { ok: true };
}

export function upgradeToCity(gs, playerId, vertexId) {
  const vertex = gs.board.vertices[vertexId];
  if (!vertex) return { error: 'Invalid vertex' };
  if (!vertex.building || vertex.building.type !== 'SETTLEMENT' || vertex.building.playerId !== playerId)
    return { error: 'No own settlement here' };

  const player = gs.players[playerId];
  if (!player.canAfford({ WHEAT: 2, ORE: 3 })) return { error: 'Not enough resources' };
  player.deductResources({ WHEAT: 2, ORE: 3 });
  player.settlements++;
  player.cities--;
  vertex.building = { type: 'CITY', playerId };
  player.victoryPoints++;
  return { ok: true };
}

export function placeRoad(gs, playerId, edgeId, isFree = false) {
  const edge = gs.board.edges[edgeId];
  if (!edge) return { error: 'Invalid edge' };
  if (edge.road) return { error: 'Edge occupied' };

  const player = gs.players[playerId];

  // Road must connect to player's existing road or settlement
  const connected = edge.adjacentVertices.some(vk => {
    const v = gs.board.vertices[vk];
    if (v?.building?.playerId === playerId) return true;
    return getAdjacentEdges(gs.board, vk)
      .some(ek => ek !== edgeId && gs.board.edges[ek]?.road?.playerId === playerId);
  });
  if (!connected) return { error: 'Road must connect to your network' };

  if (!isFree) {
    if (!player.canAfford({ WOOD: 1, BRICK: 1 })) return { error: 'Not enough resources' };
    player.deductResources({ WOOD: 1, BRICK: 1 });
  }

  player.roads--;
  edge.road = { playerId };
  return { ok: true };
}

// Helper: get vertex keys adjacent to a vertex (connected by an edge).
function getAdjacentVertices(board, vertexId) {
  const adjacent = [];
  for (const edge of Object.values(board.edges)) {
    if (!edge.adjacentVertices.includes(vertexId)) continue;
    for (const vk of edge.adjacentVertices) {
      if (vk !== vertexId && !adjacent.includes(vk)) adjacent.push(vk);
    }
  }
  return adjacent;
}

// Helper: get edge keys adjacent to a vertex.
function getAdjacentEdges(board, vertexId) {
  return Object.keys(board.edges).filter(ek =>
    board.edges[ek].adjacentVertices.includes(vertexId)
  );
}

export { getAdjacentVertices, getAdjacentEdges };
