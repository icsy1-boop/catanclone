import {
  createRoom, joinRoom, getRoom, getRoomByPlayerId, removePlayer,
} from './roomManager.js';
import { createGame, serializePublic, distributeResources, placeSettlement, placeRoad, upgradeToCity } from './game/GameState.js';
import { TurnPhase, advanceTurn, advanceSetupTurn, BUILD_COSTS } from './game/TurnStateMachine.js';
import { moveRobber, getStealTargets, stealResource } from './game/RobberManager.js';
import { createOffer, respondOffer, confirmTrade, cancelOffer, executePortTrade } from './game/TradeManager.js';
import { checkWin, updateLongestRoad, updateLargestArmy } from './game/VictoryChecker.js';
import { rollDice } from './utils/dice.js';

function broadcast(io, roomCode, event, data) {
  io.to(roomCode).emit(event, data);
}

function broadcastState(io, room) {
  if (!room.gameState) return;
  const pub = serializePublic(room.gameState);
  broadcast(io, room.code, 'game_state_update', { gameState: pub });
  // Send private hands to each player
  for (const [pid, player] of Object.entries(room.gameState.players)) {
    io.to(pid).emit('your_private_data', player.privateView());
  }
}

function err(socket, msg) {
  socket.emit('error', { message: msg });
}

function currentPlayer(gs) {
  return gs.players[gs.turnOrder[gs.currentPlayerIndex]];
}

function assertTurn(socket, gs, playerId) {
  if (currentPlayer(gs)?.id !== playerId) {
    err(socket, 'Not your turn');
    return false;
  }
  return true;
}

export function registerHandlers(io, socket) {
  // ── Lobby ───────────────────────────────────────────────────────────────
  socket.on('create_room', ({ playerName }) => {
    const room = createRoom(socket.id, playerName);
    socket.join(room.code);
    socket.emit('room_created', {
      roomCode: room.code,
      playerId: socket.id,
      players: room.players,
      isHost: true,
    });
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const result = joinRoom(roomCode, socket.id, playerName);
    if (result.error) return err(socket, result.error);
    const room = result.room;
    socket.join(roomCode);
    socket.emit('room_joined', { playerId: socket.id, players: room.players, isHost: false, roomCode });
    socket.to(roomCode).emit('player_joined', { players: room.players });
  });

  socket.on('start_game', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return err(socket, 'Room not found');
    if (room.hostId !== socket.id) return err(socket, 'Only host can start');
    if (room.players.length < 2) return err(socket, 'Need at least 2 players');
    if (room.gameState) return err(socket, 'Game already started');

    room.gameState = createGame(roomCode, room.players);
    const pub = serializePublic(room.gameState);
    broadcast(io, roomCode, 'game_started', { gameState: pub });
    for (const [pid, player] of Object.entries(room.gameState.players)) {
      io.to(pid).emit('your_private_data', player.privateView());
    }
  });

  // ── Setup Phase ─────────────────────────────────────────────────────────
  socket.on('place_initial_settlement', ({ roomCode, vertexId }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.SETUP_PLACE_SETTLEMENT) return err(socket, 'Wrong phase');

    const result = placeSettlement(gs, socket.id, vertexId, true);
    if (result.error) return err(socket, result.error);

    gs.turnPhase = TurnPhase.SETUP_PLACE_ROAD;
    broadcastState(io, room);
  });

  socket.on('place_initial_road', ({ roomCode, edgeId }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.SETUP_PLACE_ROAD) return err(socket, 'Wrong phase');

    const result = placeRoad(gs, socket.id, edgeId, true);
    if (result.error) return err(socket, result.error);

    // If round 2: grant starting resources from second settlement's adjacent tiles
    if (gs.setupRound === 2) {
      const TERRAIN_RESOURCE = {
        HILLS: 'BRICK', FOREST: 'WOOD', MOUNTAINS: 'ORE',
        FIELDS: 'WHEAT', PASTURE: 'SHEEP',
      };
      // Find the settlement this player just placed (last one placed)
      const playerVertices = Object.values(gs.board.vertices)
        .filter(v => v.building?.playerId === socket.id);
      const lastSettlement = playerVertices[playerVertices.length - 1];
      if (lastSettlement) {
        for (const tileId of lastSettlement.adjacentTiles) {
          const tile = gs.board.tiles.find(t => t.id === tileId);
          if (!tile || tile.terrain === 'DESERT') continue;
          const res = TERRAIN_RESOURCE[tile.terrain];
          if (res) gs.players[socket.id].resources[res]++;
        }
      }
    }

    advanceSetupTurn(gs);
    broadcastState(io, room);
  });

  // ── Main Turn ────────────────────────────────────────────────────────────
  socket.on('roll_dice', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.ROLL_OR_PLAY_DEV) return err(socket, 'Wrong phase');

    const [d1, d2] = rollDice();
    const total = d1 + d2;
    gs.lastRoll = [d1, d2];

    const pName = currentPlayer(gs).name;
    gs.log.push(`${pName} rolled a ${total}`);

    if (total === 7) {
      const discardNeeded = {};
      for (const [pid, player] of Object.entries(gs.players)) {
        const count = player.totalResources();
        if (count > 7) discardNeeded[pid] = Math.floor(count / 2);
      }
      if (Object.keys(discardNeeded).length > 0) {
        gs.discardNeeded = discardNeeded;
        gs.turnPhase = TurnPhase.DISCARD_RESOURCES;
      } else {
        gs.turnPhase = TurnPhase.ROBBER_MOVE;
      }
      broadcast(io, roomCode, 'dice_rolled', { roll: [d1, d2], total, playerId: socket.id });
      broadcastState(io, room);
    } else {
      distributeResources(gs, total);
      gs.turnPhase = TurnPhase.MAIN;
      gs.turnStartTime = Date.now();
      broadcast(io, roomCode, 'dice_rolled', { roll: [d1, d2], total, playerId: socket.id });
      broadcastState(io, room);
    }
  });

  socket.on('move_robber', ({ roomCode, tileId }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.ROBBER_MOVE) return err(socket, 'Wrong phase');

    const tile = gs.board.tiles.find(t => t.id === tileId);
    if (!tile) return err(socket, 'Invalid tile');
    if (tile.hasRobber) return err(socket, 'Robber already there');

    moveRobber(gs.board, tileId);
    const targets = getStealTargets(gs.board, gs, socket.id);

    if (targets.length > 0) {
      gs.turnPhase = TurnPhase.ROBBER_STEAL;
      gs._robberTargets = targets;
      broadcastState(io, room);
    } else {
      gs.turnPhase = gs._postRobberPhase || TurnPhase.MAIN;
      gs._postRobberPhase = null;
      broadcastState(io, room);
    }
  });

  socket.on('steal_resource', ({ roomCode, targetPlayerId }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.ROBBER_STEAL) return err(socket, 'Wrong phase');
    if (!(gs._robberTargets || []).includes(targetPlayerId)) return err(socket, 'Invalid target');

    const stolenFrom = gs.players[targetPlayerId];
    stealResource(gs, targetPlayerId, socket.id);
    gs.log.push(`${currentPlayer(gs).name} stole from ${stolenFrom.name}`);
    gs._robberTargets = null;
    gs.turnPhase = gs._postRobberPhase || TurnPhase.MAIN;
    gs._postRobberPhase = null;
    broadcastState(io, room);
  });

  socket.on('build_road', ({ roomCode, edgeId }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;

    const isFreeRoad = gs.turnPhase === TurnPhase.ROAD_BUILDING_1 || gs.turnPhase === TurnPhase.ROAD_BUILDING_2;
    if (gs.turnPhase !== TurnPhase.MAIN && !isFreeRoad) return err(socket, 'Wrong phase');

    const result = placeRoad(gs, socket.id, edgeId, isFreeRoad);
    if (result.error) return err(socket, result.error);

    if (gs.turnPhase === TurnPhase.ROAD_BUILDING_1) {
      gs.turnPhase = TurnPhase.ROAD_BUILDING_2;
    } else if (gs.turnPhase === TurnPhase.ROAD_BUILDING_2) {
      gs.turnPhase = TurnPhase.MAIN;
    }

    updateLongestRoad(gs);
    const pn = gs.players[socket.id].name;
    finishBuildAction(io, room, socket, `${pn} built a road`);
  });

  socket.on('build_settlement', ({ roomCode, vertexId }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.MAIN) return err(socket, 'Wrong phase');

    const player = gs.players[socket.id];
    if (player.settlements <= 0) return err(socket, 'No settlements left');

    const result = placeSettlement(gs, socket.id, vertexId, false);
    if (result.error) return err(socket, result.error);

    finishBuildAction(io, room, socket, `${player.name} built a settlement`);
  });

  socket.on('build_city', ({ roomCode, vertexId }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.MAIN) return err(socket, 'Wrong phase');

    const player = gs.players[socket.id];
    if (player.cities <= 0) return err(socket, 'No cities left');

    const result = upgradeToCity(gs, socket.id, vertexId);
    if (result.error) return err(socket, result.error);

    finishBuildAction(io, room, socket, `${player.name} upgraded to a city`);
  });

  socket.on('buy_dev_card', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.MAIN) return err(socket, 'Wrong phase');

    const player = gs.players[socket.id];
    if (!player.canAfford(BUILD_COSTS.DEV_CARD)) return err(socket, 'Not enough resources');
    if (gs.devCardDeck.remaining === 0) return err(socket, 'No dev cards left');

    player.deductResources(BUILD_COSTS.DEV_CARD);
    const card = gs.devCardDeck.draw();
    player.newDevCards.push(card);
    gs.log.push(`${player.name} bought a dev card`);

    broadcastState(io, room);
  });

  socket.on('play_dev_card', ({ roomCode, cardType }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;

    const validPhases = [TurnPhase.ROLL_OR_PLAY_DEV, TurnPhase.MAIN];
    // Knight can be played before roll, others only after
    if (cardType === 'KNIGHT' && !validPhases.includes(gs.turnPhase)) return err(socket, 'Wrong phase');
    if (cardType !== 'KNIGHT' && gs.turnPhase !== TurnPhase.MAIN) return err(socket, 'Wrong phase');

    const player = gs.players[socket.id];
    if (!player.devCards[cardType] || player.devCards[cardType] < 1) return err(socket, 'No such card');
    if (player.playedDevCardThisTurn) return err(socket, 'Already played a dev card this turn');

    player.devCards[cardType]--;
    player.playedDevCardThisTurn = true;

    if (cardType === 'KNIGHT') {
      player.knightsPlayed++;
      updateLargestArmy(gs);
      gs._postRobberPhase = gs.turnPhase === TurnPhase.ROLL_OR_PLAY_DEV
        ? TurnPhase.ROLL_OR_PLAY_DEV : TurnPhase.MAIN;
      gs.turnPhase = TurnPhase.ROBBER_MOVE;
      broadcastState(io, room);
    } else if (cardType === 'ROAD_BUILDING') {
      gs.turnPhase = TurnPhase.ROAD_BUILDING_1;
      broadcastState(io, room);
    } else if (cardType === 'VP') {
      player.hiddenVP++;
      const winner = checkWin(gs);
      if (winner) { gs.winner = winner; gs.turnPhase = TurnPhase.GAME_OVER; }
      broadcastState(io, room);
    }
    // MONOPOLY and YEAR_OF_PLENTY handled by separate events
  });

  socket.on('play_monopoly', ({ roomCode, resource }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.MAIN) return err(socket, 'Wrong phase');

    const player = gs.players[socket.id];
    if (!player.devCards.MONOPOLY) return err(socket, 'No Monopoly card');
    if (player.playedDevCardThisTurn) return err(socket, 'Already played a dev card');

    player.devCards.MONOPOLY--;
    player.playedDevCardThisTurn = true;

    for (const [pid, other] of Object.entries(gs.players)) {
      if (pid === socket.id) continue;
      const amount = other.resources[resource] || 0;
      other.resources[resource] = 0;
      player.resources[resource] = (player.resources[resource] || 0) + amount;
    }

    gs.log.push(`${player.name} played Monopoly on ${resource}`);
    broadcastState(io, room);
  });

  socket.on('play_year_of_plenty', ({ roomCode, resource1, resource2 }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.MAIN) return err(socket, 'Wrong phase');

    const player = gs.players[socket.id];
    if (!player.devCards.YEAR_OF_PLENTY) return err(socket, 'No Year of Plenty card');
    if (player.playedDevCardThisTurn) return err(socket, 'Already played a dev card');

    player.devCards.YEAR_OF_PLENTY--;
    player.playedDevCardThisTurn = true;
    player.resources[resource1] = (player.resources[resource1] || 0) + 1;
    player.resources[resource2] = (player.resources[resource2] || 0) + 1;

    gs.log.push(`${player.name} played Year of Plenty`);
    broadcastState(io, room);
  });

  socket.on('offer_trade', ({ roomCode, give, want }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.MAIN) return err(socket, 'Wrong phase');

    const offer = createOffer(gs, socket.id, give, want);
    broadcastState(io, room);
  });

  // Any non-active player records accept/decline (does not execute trade).
  socket.on('respond_trade', ({ roomCode, tradeId, response }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const result = respondOffer(room.gameState, tradeId, socket.id, response);
    if (result.error) return err(socket, result.error);
    broadcastState(io, room);
  });

  // Active player picks which accepting player to trade with.
  socket.on('confirm_trade', ({ roomCode, tradeId, counterpartyId }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    const result = confirmTrade(gs, tradeId, counterpartyId);
    if (result.error) return err(socket, result.error);
    gs.log.push(`${currentPlayer(gs).name} traded with ${gs.players[counterpartyId]?.name}`);
    broadcastState(io, room);
  });

  socket.on('cancel_trade', ({ roomCode, tradeId }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    cancelOffer(room.gameState, tradeId);
    broadcastState(io, room);
  });

  socket.on('port_trade', ({ roomCode, give, want }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.MAIN) return err(socket, 'Wrong phase');

    const result = executePortTrade(gs, socket.id, give, want);
    if (result.error) return err(socket, result.error);
    gs.log.push(`${gs.players[socket.id].name} traded with the bank`);
    broadcastState(io, room);
  });

  socket.on('discard_resources', ({ roomCode, resources }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (gs.turnPhase !== TurnPhase.DISCARD_RESOURCES) return err(socket, 'Wrong phase');
    const needed = gs.discardNeeded?.[socket.id];
    if (!needed) return err(socket, 'You don\'t need to discard');

    let total = 0;
    for (const amt of Object.values(resources)) total += (amt || 0);
    if (total !== needed) return err(socket, `Must discard exactly ${needed} resources`);

    const player = gs.players[socket.id];
    for (const [res, amt] of Object.entries(resources)) {
      if ((player.resources[res] || 0) < (amt || 0)) return err(socket, `Not enough ${res}`);
    }
    for (const [res, amt] of Object.entries(resources)) {
      player.resources[res] -= (amt || 0);
    }

    gs.log.push(`${player.name} discarded ${needed} cards`);
    delete gs.discardNeeded[socket.id];
    if (Object.keys(gs.discardNeeded).length === 0) {
      gs.discardNeeded = null;
      gs.turnPhase = TurnPhase.ROBBER_MOVE;
    }
    broadcastState(io, room);
  });

  socket.on('chat_message', ({ roomCode, text }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    const msg = { name: player.name, text: text.slice(0, 200), ts: Date.now() };
    room.chat.push(msg);
    if (room.chat.length > 100) room.chat.shift();
    io.to(roomCode).emit('chat_message', msg);
  });

  socket.on('end_turn', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return err(socket, 'No game');
    const gs = room.gameState;
    if (!assertTurn(socket, gs, socket.id)) return;
    if (gs.turnPhase !== TurnPhase.MAIN) return err(socket, 'Wrong phase');

    advanceTurn(gs);
    broadcastState(io, room);
  });

  // ── Disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const room = removePlayer(socket.id);
    if (room) {
      io.to(room.code).emit('player_left', { players: room.players, leftId: socket.id });
    }
  });
}

function finishBuildAction(io, room, socket, logMsg) {
  const gs = room.gameState;
  if (logMsg) gs.log.push(logMsg);
  const winner = checkWin(gs);
  if (winner) {
    gs.winner = winner;
    gs.turnPhase = TurnPhase.GAME_OVER;
    gs.log.push(`🏆 ${gs.players[winner].name} wins!`);
  }
  broadcastState(io, room);
}
