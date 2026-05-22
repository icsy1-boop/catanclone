import { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore.js';

const TYPE_STYLE = {
  error:   { bg: '#c0392b', icon: '✕' },
  success: { bg: '#27ae60', icon: '✓' },
  info:    { bg: '#2980b9', icon: 'ℹ' },
};

function Toast({ id, message, type }) {
  const removeToast = useUIStore(s => s.removeToast);

  useEffect(() => {
    const t = setTimeout(() => removeToast(id), 4500);
    return () => clearTimeout(t);
  }, [id]);

  const s = TYPE_STYLE[type] || TYPE_STYLE.info;

  return (
    <div
      onClick={() => removeToast(id)}
      style={{
        background: s.bg, color: '#fff', padding: '10px 16px',
        borderRadius: 8, fontSize: 13, cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        maxWidth: 320, wordBreak: 'break-word',
        display: 'flex', alignItems: 'flex-start', gap: 8,
        animation: 'toastIn 0.25s ease',
      }}
    >
      <span style={{ fontWeight: 700, flexShrink: 0 }}>{s.icon}</span>
      <span>{message}</span>
    </div>
  );
}

export default function ToastStack() {
  const toasts = useUIStore(s => s.toasts);
  if (!toasts.length) return null;
  return (
    <>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 2000,
        alignItems: 'center', pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast {...t} />
          </div>
        ))}
      </div>
    </>
  );
}
