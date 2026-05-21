import { Routes, Route, Navigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket.js';
import LandingPage from './components/lobby/LandingPage.jsx';
import RoomLobby from './components/lobby/RoomLobby.jsx';
import GamePage from './components/GamePage.jsx';
import { useGameStore } from './store/gameStore.js';

function RequireRoom({ children }) {
  const { roomCode } = useGameStore();
  return roomCode ? children : <Navigate to="/" replace />;
}

export default function App() {
  useSocket(); // registers all socket event listeners

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/room/:code" element={
        <RequireRoom><RoomLobby /></RequireRoom>
      } />
      <Route path="/game/:code" element={
        <RequireRoom><GamePage /></RequireRoom>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
