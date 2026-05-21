import { useState, useEffect, useRef } from 'react';
import socket from '../../socket.js';
import { useGameStore } from '../../store/gameStore.js';
import { actions } from '../../store/actions.js';

export default function GameSidebar({ gameState }) {
  const [tab, setTab] = useState('log');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    const handler = (msg) => {
      setMessages(prev => [...prev.slice(-99), msg]);
      if (tab !== 'chat') setTab(t => t); // keep tab, just accumulate
    };
    socket.on('chat_message', handler);
    return () => socket.off('chat_message', handler);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tab]);

  const sendMsg = () => {
    const t = input.trim();
    if (!t) return;
    actions.sendChat(t);
    setInput('');
  };

  const log = gameState?.log || [];

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      flex: 1, padding: '5px 0', border: 'none', borderRadius: 6,
      background: tab === id ? 'rgba(255,255,255,0.12)' : 'transparent',
      color: tab === id ? '#eee' : '#777', cursor: 'pointer', fontSize: 12, fontWeight: 600,
    }}>{label}</button>
  );

  return (
    <div style={{
      background: 'rgba(22,33,62,0.95)', borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(4px)',
      width: 220, display: 'flex', flexDirection: 'column', maxHeight: 320,
    }}>
      <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabBtn('log', 'Log')}
        {tabBtn('chat', 'Chat')}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', minHeight: 0 }}>
        {tab === 'log' ? (
          log.length === 0
            ? <div style={{ color: '#555', fontSize: 12 }}>No events yet</div>
            : [...log].reverse().map((entry, i) => (
              <div key={i} style={{ fontSize: 12, color: '#bbb', marginBottom: 4, lineHeight: 1.4 }}>
                {entry}
              </div>
            ))
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 11, color: '#f39c12' }}>{m.name}: </span>
                <span style={{ fontSize: 12, color: '#ddd' }}>{m.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {tab === 'chat' && (
        <div style={{ display: 'flex', padding: '6px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', gap: 6 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="Message…"
            style={{
              flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #333',
              background: '#0f3460', color: '#eee', fontSize: 12,
            }}
          />
          <button onClick={sendMsg} style={{
            padding: '5px 10px', borderRadius: 6, border: 'none',
            background: '#f39c12', color: '#111', fontWeight: 700, cursor: 'pointer', fontSize: 12,
          }}>→</button>
        </div>
      )}
    </div>
  );
}
