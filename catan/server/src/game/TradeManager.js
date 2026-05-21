import { v4 as uuidv4 } from 'uuid';
import { RESOURCES } from './Player.js';

// Get the best port ratio a player has for a given resource.
export function getPortRatio(board, playerId, resource) {
  let ratio = 4; // default bank trade
  for (const vertex of Object.values(board.vertices)) {
    if (!vertex.building || vertex.building.playerId !== playerId) continue;
    if (!vertex.port) continue;
    const port = vertex.port;
    if (port.resource === resource) return 2;
    if (port.resource === null && port.ratio === 3 && ratio > 3) ratio = 3;
  }
  return ratio;
}

// Execute a port/bank trade.
export function executePortTrade(gameState, playerId, give, want) {
  const player = gameState.players[playerId];
  if (!player) return { error: 'Player not found' };

  for (const [res, amount] of Object.entries(give)) {
    if (!amount) continue;
    const ratio = getPortRatio(gameState.board, playerId, res);
    if (amount % ratio !== 0) return { error: `Must trade in multiples of ${ratio} for ${res}` };
    const wantTotal = amount / ratio;
    const wantRes = Object.keys(want).find(r => want[r]);
    if (!wantRes) return { error: 'No wanted resource specified' };
    if (player.resources[res] < amount) return { error: `Not enough ${res}` };
    player.resources[res] -= amount;
    player.resources[wantRes] = (player.resources[wantRes] || 0) + wantTotal;
  }
  return { ok: true };
}

// Create a trade offer.
export function createOffer(gameState, fromPlayerId, give, want) {
  const id = uuidv4();
  const offer = { id, fromPlayerId, give, want, status: 'pending', responses: {} };
  if (!gameState.pendingTrades) gameState.pendingTrades = {};
  gameState.pendingTrades[id] = offer;
  return offer;
}

export function acceptOffer(gameState, tradeId, byPlayerId) {
  const offer = gameState.pendingTrades?.[tradeId];
  if (!offer || offer.status !== 'pending') return { error: 'Trade not found' };

  const from = gameState.players[offer.fromPlayerId];
  const by = gameState.players[byPlayerId];
  if (!from || !by) return { error: 'Player not found' };

  // Validate both sides can afford
  for (const [res, amt] of Object.entries(offer.give)) {
    if ((from.resources[res] || 0) < (amt || 0)) return { error: `${from.name} can't afford trade` };
  }
  for (const [res, amt] of Object.entries(offer.want)) {
    if ((by.resources[res] || 0) < (amt || 0)) return { error: `${by.name} can't afford trade` };
  }

  // Execute exchange
  for (const [res, amt] of Object.entries(offer.give)) {
    from.resources[res] -= (amt || 0);
    by.resources[res] = (by.resources[res] || 0) + (amt || 0);
  }
  for (const [res, amt] of Object.entries(offer.want)) {
    by.resources[res] -= (amt || 0);
    from.resources[res] = (from.resources[res] || 0) + (amt || 0);
  }

  offer.status = 'completed';
  delete gameState.pendingTrades[tradeId];
  return { ok: true };
}

export function cancelOffer(gameState, tradeId) {
  if (gameState.pendingTrades?.[tradeId]) {
    delete gameState.pendingTrades[tradeId];
  }
}
