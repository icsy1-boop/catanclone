const rooms = new Map(); // roomCode → room

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCode() {
  let code;
  do {
    code = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
}

export function createRoom(hostId, hostName) {
  const code = generateCode();
  rooms.set(code, {
    code,
    hostId,
    players: [{ id: hostId, name: hostName }],
    socketMap: { [hostId]: hostId }, // originalPlayerId → currentSocketId
    gameState: null,
    chat: [],
  });
  return rooms.get(code);
}

export function joinRoom(code, socketId, playerName) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };

  // In-progress game: allow reconnect by name match
  if (room.gameState) {
    const existing = Object.values(room.gameState.players)
      .find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (existing) {
      room.socketMap[existing.id] = socketId;
      return { room, reconnected: true, playerId: existing.id };
    }
    return { error: 'Game already started' };
  }

  if (room.players.length >= 8) return { error: 'Room is full' };
  if (room.players.find(p => p.id === socketId)) return { error: 'Already in room' };
  room.players.push({ id: socketId, name: playerName });
  room.socketMap[socketId] = socketId;
  return { room };
}

export function getRoom(code) {
  return rooms.get(code) || null;
}

export function getRoomByPlayerId(playerId) {
  for (const room of rooms.values()) {
    if (room.players.find(p => p.id === playerId)) return room;
    if (room.socketMap && Object.values(room.socketMap).includes(playerId)) return room;
  }
  return null;
}

// Returns the original playerId for a given current socketId.
export function getPlayerId(room, socketId) {
  if (!room?.socketMap) return socketId;
  for (const [pid, sid] of Object.entries(room.socketMap)) {
    if (sid === socketId) return pid;
  }
  return socketId;
}

export function removePlayer(socketId) {
  for (const [code, room] of rooms.entries()) {
    const pid = getPlayerId(room, socketId);
    const idx = room.players.findIndex(p => p.id === pid);
    if (idx === -1) continue;

    // During a game, keep the player slot — just note disconnection
    if (room.gameState) {
      return { room, inGame: true };
    }

    room.players.splice(idx, 1);
    if (room.socketMap) delete room.socketMap[pid];
    if (room.players.length === 0) {
      rooms.delete(code);
    } else if (room.hostId === pid) {
      room.hostId = room.players[0].id;
    }
    return { room, inGame: false };
  }
  return null;
}
