import { useGameStore } from '../store/gameStore.js';
import { useUIStore } from '../store/uiStore.js';
import { BUILD_COSTS } from '../constants/buildCosts.js';

export function useGamePhase() {
  const { gameState, playerId, myResources, isMyTurn } = useGameStore();
  const { selectedAction } = useUIStore();

  if (!gameState || !playerId) {
    return { canRoll: false, canEndTurn: false, canBuild: {}, isSetupPhase: false, legalVertices: new Set(), legalEdges: new Set() };
  }

  const phase = gameState.turnPhase;
  const myTurn = isMyTurn();

  const canAfford = (costs) =>
    Object.entries(costs).every(([r, amt]) => (myResources[r] || 0) >= amt);

  const canRoll = myTurn && phase === 'ROLL_OR_PLAY_DEV';
  const canEndTurn = myTurn && phase === 'MAIN';
  const canBuild = {
    ROAD: myTurn && phase === 'MAIN' && canAfford(BUILD_COSTS.ROAD),
    SETTLEMENT: myTurn && phase === 'MAIN' && canAfford(BUILD_COSTS.SETTLEMENT),
    CITY: myTurn && phase === 'MAIN' && canAfford(BUILD_COSTS.CITY),
    DEV_CARD: myTurn && phase === 'MAIN' && canAfford(BUILD_COSTS.DEV_CARD) && gameState.devCardDeckSize > 0,
  };

  const isSetupPhase = gameState.phase === 'SETUP';
  const isSetupSettlement = myTurn && phase === 'SETUP_PLACE_SETTLEMENT';
  const isSetupRoad = myTurn && phase === 'SETUP_PLACE_ROAD';
  const isRobberMove = myTurn && (phase === 'ROBBER_MOVE');
  const isRobberSteal = myTurn && phase === 'ROBBER_STEAL';
  const isRoadBuilding = myTurn && (phase === 'ROAD_BUILDING_1' || phase === 'ROAD_BUILDING_2');

  // Compute legal vertices for settlement placement
  const legalVertices = new Set();
  if ((isSetupSettlement || (myTurn && phase === 'MAIN' && selectedAction === 'BUILD_SETTLEMENT'))
    && gameState.board) {
    const board = gameState.board;
    for (const [vk, vertex] of Object.entries(board.vertices)) {
      if (vertex.building) continue;
      // Check distance rule: no adjacent buildings
      let tooClose = false;
      for (const ek of Object.keys(board.edges)) {
        const edge = board.edges[ek];
        if (!edge.adjacentVertices.includes(vk)) continue;
        const other = edge.adjacentVertices.find(v => v !== vk);
        if (board.vertices[other]?.building) { tooClose = true; break; }
      }
      if (tooClose) continue;

      // During main phase, must connect to own road
      if (!isSetupSettlement) {
        const connected = Object.values(board.edges).some(e =>
          e.adjacentVertices.includes(vk) && e.road?.playerId === playerId
        );
        if (!connected) continue;
      }

      legalVertices.add(vk);
    }
  }

  // City placements
  const legalCityVertices = new Set();
  if (myTurn && phase === 'MAIN' && selectedAction === 'BUILD_CITY' && gameState.board) {
    for (const [vk, vertex] of Object.entries(gameState.board.vertices)) {
      if (vertex.building?.type === 'SETTLEMENT' && vertex.building?.playerId === playerId) {
        legalCityVertices.add(vk);
      }
    }
  }

  // Legal edges for road placement
  const legalEdges = new Set();
  if ((isSetupRoad || (myTurn && phase === 'MAIN' && selectedAction === 'BUILD_ROAD') || isRoadBuilding)
    && gameState.board) {
    const board = gameState.board;
    for (const [ek, edge] of Object.entries(board.edges)) {
      if (edge.road) continue;
      const connected = edge.adjacentVertices.some(vk => {
        const v = board.vertices[vk];
        if (v?.building?.playerId === playerId) return true;
        return Object.values(board.edges).some(e =>
          e.id !== ek && e.adjacentVertices.includes(vk) && e.road?.playerId === playerId
        );
      });
      if (connected) legalEdges.add(ek);
    }
  }

  // Legal tiles for robber
  const legalTiles = new Set();
  if (isRobberMove && gameState.board) {
    for (const tile of gameState.board.tiles) {
      if (!tile.hasRobber) legalTiles.add(tile.id);
    }
  }

  return {
    canRoll, canEndTurn, canBuild,
    isSetupPhase, isSetupSettlement, isSetupRoad,
    isRobberMove, isRobberSteal, isRoadBuilding,
    legalVertices, legalEdges, legalTiles, legalCityVertices,
    phase, myTurn,
    canPlayDevCard: myTurn && !gameState.players?.[playerId]?.playedDevCardThisTurn,
  };
}
