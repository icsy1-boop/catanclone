import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket.js';
import { useGameStore } from '../store/gameStore.js';

export function useSocket() {
  const navigate = useNavigate();
  const { setRoom, setLobbyPlayers, setGameState, setPrivateData } = useGameStore();

  useEffect(() => {
    socket.on('room_created', ({ roomCode, playerId, players, isHost }) => {
      setRoom(roomCode, playerId, isHost, players);
      navigate(`/room/${roomCode}`);
    });

    socket.on('room_joined', ({ roomCode, playerId, players, isHost }) => {
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

    socket.on('error', ({ message }) => {
      // Simple alert for prototype; replace with toast in production
      alert(`Error: ${message}`);
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
    };
  }, []);
}
