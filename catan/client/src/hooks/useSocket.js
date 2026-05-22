import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket.js';
import { useGameStore } from '../store/gameStore.js';
import { useUIStore } from '../store/uiStore.js';

export function useSocket() {
  const navigate = useNavigate();
  const { setRoom, setLobbyPlayers, setGameState, setPrivateData } = useGameStore();
  const addToast = useUIStore(s => s.addToast);

  useEffect(() => {
    socket.on('room_created', ({ roomCode, playerId, players, isHost }) => {
      sessionStorage.setItem('catanRoom', roomCode);
      sessionStorage.setItem('catanName', players.find(p => p.id === playerId)?.name || '');
      setRoom(roomCode, playerId, isHost, players);
      navigate(`/room/${roomCode}`);
    });

    socket.on('room_joined', ({ roomCode, playerId, players, isHost }) => {
      const myName = players.find(p => p.id === playerId)?.name || '';
      sessionStorage.setItem('catanRoom', roomCode);
      sessionStorage.setItem('catanName', myName);
      setRoom(roomCode, playerId, isHost, players);
      navigate(`/room/${roomCode}`);
    });

    socket.on('player_joined', ({ players }) => setLobbyPlayers(players));
    socket.on('player_left', ({ players }) => setLobbyPlayers(players));

    socket.on('game_started', ({ gameState }) => {
      setGameState(gameState);
      navigate(`/game/${gameState.roomCode}`);
    });

    socket.on('game_state_update', ({ gameState }) => setGameState(gameState));
    socket.on('your_private_data', (data) => setPrivateData(data));

    socket.on('error', ({ message }) => addToast(message, 'error'));

    socket.on('you_left', () => {
      sessionStorage.removeItem('catanRoom');
      sessionStorage.removeItem('catanName');
      useGameStore.getState().setRoom(null, null, false, []);
      useGameStore.getState().setGameState(null);
      navigate('/');
    });

    // Auto-rejoin in-progress game after reconnect
    socket.on('connect', () => {
      const savedRoom = sessionStorage.getItem('catanRoom');
      const savedName = sessionStorage.getItem('catanName');
      const { roomCode, gameState } = useGameStore.getState();
      // Only attempt rejoin if we had a game but lost the connection
      if (savedRoom && savedName && !roomCode && !gameState) {
        socket.emit('join_room', { roomCode: savedRoom, playerName: savedName });
      }
    });

    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_started');
      socket.off('game_state_update');
      socket.off('your_private_data');
      socket.off('error');
      socket.off('you_left');
      socket.off('connect');
    };
  }, []);
}
