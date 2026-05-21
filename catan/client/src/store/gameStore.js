import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  roomCode: null,
  playerId: null,
  isHost: false,
  lobbyPlayers: [],
  gameState: null,
  myResources: { WOOD: 0, BRICK: 0, SHEEP: 0, WHEAT: 0, ORE: 0 },
  myDevCards: { KNIGHT: 0, ROAD_BUILDING: 0, YEAR_OF_PLENTY: 0, MONOPOLY: 0, VP: 0 },
  myNewDevCards: [],

  setRoom: (roomCode, playerId, isHost, players) =>
    set({ roomCode, playerId, isHost, lobbyPlayers: players }),

  setLobbyPlayers: (players) => set({ lobbyPlayers: players }),

  setGameState: (gameState) => set({ gameState }),

  setPrivateData: ({ resources, devCards, newDevCards }) =>
    set({ myResources: resources, myDevCards: devCards, myNewDevCards: newDevCards }),

  isMyTurn: () => {
    const { gameState, playerId } = get();
    if (!gameState) return false;
    return gameState.turnOrder[gameState.currentPlayerIndex] === playerId;
  },

  myPlayer: () => {
    const { gameState, playerId } = get();
    return gameState?.players?.[playerId] || null;
  },
}));
