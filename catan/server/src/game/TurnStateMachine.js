export const TurnPhase = {
  SETUP_PLACE_SETTLEMENT: 'SETUP_PLACE_SETTLEMENT',
  SETUP_PLACE_ROAD: 'SETUP_PLACE_ROAD',
  ROLL_OR_PLAY_DEV: 'ROLL_OR_PLAY_DEV',
  ROBBER_MOVE: 'ROBBER_MOVE',
  ROBBER_STEAL: 'ROBBER_STEAL',
  ROAD_BUILDING_1: 'ROAD_BUILDING_1',
  ROAD_BUILDING_2: 'ROAD_BUILDING_2',
  MAIN: 'MAIN',
  GAME_OVER: 'GAME_OVER',
};

export const BUILD_COSTS = {
  ROAD: { WOOD: 1, BRICK: 1 },
  SETTLEMENT: { WOOD: 1, BRICK: 1, SHEEP: 1, WHEAT: 1 },
  CITY: { WHEAT: 2, ORE: 3 },
  DEV_CARD: { SHEEP: 1, WHEAT: 1, ORE: 1 },
};

// Advance to the next player's turn.
export function advanceTurn(gameState) {
  const player = gameState.players[gameState.turnOrder[gameState.currentPlayerIndex]];
  // Move newDevCards into playable hand
  for (const card of player.newDevCards) {
    player.devCards[card] = (player.devCards[card] || 0) + 1;
  }
  player.newDevCards = [];
  player.playedDevCardThisTurn = false;

  const n = gameState.turnOrder.length;
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % n;
  gameState.turnPhase = TurnPhase.ROLL_OR_PLAY_DEV;
  gameState.pendingTrades = {};
  gameState.turnStartTime = Date.now();
}

// Advance setup turn (special snake-draft order).
export function advanceSetupTurn(gameState) {
  const n = gameState.turnOrder.length;
  const { setupRound, currentPlayerIndex } = gameState;

  if (setupRound === 1) {
    if (currentPlayerIndex < n - 1) {
      gameState.currentPlayerIndex++;
    } else {
      gameState.setupRound = 2;
      // stay on last player for round 2
    }
  } else {
    if (currentPlayerIndex > 0) {
      gameState.currentPlayerIndex--;
    } else {
      // Setup done — start real game
      gameState.phase = 'MAIN';
      gameState.turnPhase = TurnPhase.ROLL_OR_PLAY_DEV;
      gameState.turnStartTime = Date.now();
      return;
    }
  }
  gameState.turnPhase = TurnPhase.SETUP_PLACE_SETTLEMENT;
}
