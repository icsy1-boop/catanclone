import { v4 as uuidv4 } from 'uuid';
import { RESOURCES } from './Player.js';

export function getPortRatio(board, playerId, resource) {
  let ratio = 4;
  for (const vertex of Object.values(board.vertices)) {
    if (!vertex.building || vertex.building.playerId !== playerId) continue;
    if (!vertex.port) continue;
    const port = vertex.port;
    if (port.resource === resource) return 2;
    if (port.resource === null && port.ratio === 3 && ratio > 3) ratio = 3;
  }
  return ratio;
}

export function executePortTrade(gameState, playerId, give, want) {
  const player = gameState.players[playerId];
  if (!player) return { error: 'Player not found' };

  // Compute total resources receivable from what the player is giving
  let totalReceivable = 0;
  for (const [res, amount] of Object.entries(give)) {
    if (!amount) continue;
    const ratio = getPortRatio(gameState.board, playerId, res);
    if (amount % ratio !== 0) return { error: `Must give ${res} in multiples of ${ratio}` };
    if ((player.resources[res] || 0) < amount) return { error: `Not enough ${res}` };
    totalReceivable += amount / ratio;
  }

  if (totalReceivable === 0) return { error: 'Nothing to trade' };

  const totalWanted = Object.values(want).reduce((s, v) => s + (v || 0), 0);
  if (totalWanted !== totalReceivable) {
    return { error: `Must receive exactly ${totalReceivable} resource${totalReceivable !== 1 ? 's' : ''}` };
  }

  // Execute
  for (const [res, amount] of Object.entries(give)) {
    if (!amount) continue;
    player.resources[res] -= amount;
  }
  for (const [res, amount] of Object.entries(want)) {
    if (!amount) continue;
    player.resources[res] = (player.resources[res] || 0) + amount;
  }

  return { ok: true };
}

export function createOffer(gameState, fromPlayerId, give, want) {
  const id = uuidv4();
  const offer = { id, fromPlayerId, give, want, status: 'pending', responses: {} };
  if (!gameState.pendingTrades) gameState.pendingTrades = {};
  gameState.pendingTrades[id] = offer;
  return offer;
}

// Non-active player records their response (does NOT execute the trade).
export function respondOffer(gameState, tradeId, byPlayerId, response) {
  const offer = gameState.pendingTrades?.[tradeId];
  if (!offer || offer.status !== 'pending') return { error: 'Trade not found' };
  if (byPlayerId === offer.fromPlayerId) return { error: 'Cannot respond to your own offer' };
  offer.responses[byPlayerId] = response; // 'accepted' | 'declined'
  return { ok: true };
}

// Active player confirms trade with a specific player who accepted.
export function confirmTrade(gameState, tradeId, counterpartyId) {
  const offer = gameState.pendingTrades?.[tradeId];
  if (!offer || offer.status !== 'pending') return { error: 'Trade not found' };
  if (offer.responses[counterpartyId] !== 'accepted') return { error: 'Player has not accepted' };

  const from = gameState.players[offer.fromPlayerId];
  const by = gameState.players[counterpartyId];
  if (!from || !by) return { error: 'Player not found' };

  for (const [res, amt] of Object.entries(offer.give)) {
    if ((from.resources[res] || 0) < (amt || 0)) return { error: `${from.name} can't afford trade` };
  }
  for (const [res, amt] of Object.entries(offer.want)) {
    if ((by.resources[res] || 0) < (amt || 0)) return { error: `${by.name} can't afford trade` };
  }

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
  return { ok: true, give: offer.give, want: offer.want };
}

export function cancelOffer(gameState, tradeId) {
  if (gameState.pendingTrades?.[tradeId]) {
    delete gameState.pendingTrades[tradeId];
  }
}
