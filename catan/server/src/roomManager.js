const rooms = new Map(); // roomCode → { code, hostId, players: [{id, name}], gameState }

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
    gameState: null,
    chat: [],
  });
  return rooms.get(code);
}

export function joinRoom(code, playerId, playerName) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.gameState) return { error: 'Game already started' };
  if (room.players.length >= 8) return { error: 'Room is full' };
  if (room.players.find(p => p.id === playerId)) return { error: 'Already in room' };
  room.players.push({ id: playerId, name: playerName });
  return { room };
}

export function getRoom(code) {
  return rooms.get(code) || null;
}

export function getRoomByPlayerId(playerId) {
  for (const room of rooms.values()) {
    if (room.players.find(p => p.id === playerId)) return room;
  }
  return null;
}

export function removePlayer(playerId) {
  for (const [code, room] of rooms.entries()) {
    const idx = room.players.findIndex(p => p.id === playerId);
    if (idx === -1) continue;
    room.players.splice(idx, 1);
    if (room.players.length === 0) {
      rooms.delete(code);
    } else if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
    }
    return room;
  }
  return null;
}
