export function moveRobber(board, tileId) {
  for (const tile of board.tiles) {
    tile.hasRobber = tile.id === tileId;
  }
}

// Returns playerIds adjacent to the tile that the active player can steal from.
export function getStealTargets(board, gameState, movingPlayerId) {
  const robberTile = board.tiles.find(t => t.hasRobber);
  if (!robberTile) return [];

  const adjacentPlayerIds = new Set();
  for (const vertex of Object.values(board.vertices)) {
    if (!vertex.adjacentTiles.includes(robberTile.id)) continue;
    if (!vertex.building) continue;
    const ownerId = vertex.building.playerId;
    if (ownerId !== movingPlayerId) {
      adjacentPlayerIds.add(ownerId);
    }
  }

  // Only include players who actually have resources
  return [...adjacentPlayerIds].filter(pid => {
    const player = gameState.players[pid];
    return player && player.totalResources() > 0;
  });
}

// Steal a random resource from target, give to thief.
export function stealResource(gameState, fromPlayerId, toPlayerId) {
  const from = gameState.players[fromPlayerId];
  const to = gameState.players[toPlayerId];
  if (!from || !to) return null;

  const hand = [];
  for (const [res, count] of Object.entries(from.resources)) {
    for (let i = 0; i < count; i++) hand.push(res);
  }
  if (hand.length === 0) return null;

  const stolen = hand[Math.floor(Math.random() * hand.length)];
  from.resources[stolen]--;
  to.resources[stolen]++;
  return stolen;
}
