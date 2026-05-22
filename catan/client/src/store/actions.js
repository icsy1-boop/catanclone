import socket from '../socket.js';
import { useGameStore } from './gameStore.js';

const getCode = () => useGameStore.getState().roomCode;

export const actions = {
  createRoom: (playerName) => socket.emit('create_room', { playerName }),
  joinRoom: (roomCode, playerName) => socket.emit('join_room', { roomCode, playerName }),
  startGame: () => socket.emit('start_game', { roomCode: getCode() }),

  placeInitialSettlement: (vertexId) =>
    socket.emit('place_initial_settlement', { roomCode: getCode(), vertexId }),
  placeInitialRoad: (edgeId) =>
    socket.emit('place_initial_road', { roomCode: getCode(), edgeId }),

  rollDice: () => socket.emit('roll_dice', { roomCode: getCode() }),
  moveRobber: (tileId) => socket.emit('move_robber', { roomCode: getCode(), tileId }),
  stealResource: (targetPlayerId) =>
    socket.emit('steal_resource', { roomCode: getCode(), targetPlayerId }),

  buildRoad: (edgeId) => socket.emit('build_road', { roomCode: getCode(), edgeId }),
  buildSettlement: (vertexId) => socket.emit('build_settlement', { roomCode: getCode(), vertexId }),
  buildCity: (vertexId) => socket.emit('build_city', { roomCode: getCode(), vertexId }),
  buyDevCard: () => socket.emit('buy_dev_card', { roomCode: getCode() }),

  playDevCard: (cardType) => socket.emit('play_dev_card', { roomCode: getCode(), cardType }),
  playMonopoly: (resource) => socket.emit('play_monopoly', { roomCode: getCode(), resource }),
  playYearOfPlenty: (r1, r2) =>
    socket.emit('play_year_of_plenty', { roomCode: getCode(), resource1: r1, resource2: r2 }),

  offerTrade: (give, want) => socket.emit('offer_trade', { roomCode: getCode(), give, want }),
  respondTrade: (tradeId, response) => socket.emit('respond_trade', { roomCode: getCode(), tradeId, response }),
  confirmTrade: (tradeId, counterpartyId) => socket.emit('confirm_trade', { roomCode: getCode(), tradeId, counterpartyId }),
  cancelTrade: (tradeId) => socket.emit('cancel_trade', { roomCode: getCode(), tradeId }),
  portTrade: (give, want) => socket.emit('port_trade', { roomCode: getCode(), give, want }),

  endTurn: () => socket.emit('end_turn', { roomCode: getCode() }),
  discardResources: (resources) => socket.emit('discard_resources', { roomCode: getCode(), resources }),
  sendChat: (text) => socket.emit('chat_message', { roomCode: getCode(), text }),
  leaveGame: () => socket.emit('leave_game', { roomCode: getCode() }),
};
