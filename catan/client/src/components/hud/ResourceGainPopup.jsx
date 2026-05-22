import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { RESOURCE_COLORS, RESOURCE_LABELS } from '../../constants/resources.js';

export default function ResourceGainPopup() {
  const resourceGains = useGameStore(s => s.resourceGains);
  const clearResourceGains = useGameStore(s => s.clearResourceGains);
  const [active, setActive] = useState(null);
  const clearRef = useRef(null);

  useEffect(() => {
    if (!resourceGains) return;
    setActive({ ...resourceGains });
    clearTimeout(clearRef.current);
    clearRef.current = setTimeout(() => {
      setActive(null);
      clearResourceGains();
    }, 2800);
  }, [resourceGains]);

  if (!active) return null;

  return (
    <>
      <style>{`
        @keyframes gainFloat {
          0%   { opacity: 0; transform: translateX(-50%) translateY(0px); }
          12%  { opacity: 1; transform: translateX(-50%) translateY(-10px); }
          75%  { opacity: 1; transform: translateX(-50%) translateY(-28px); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-44px); }
        }
      `}</style>
      <div style={{
        position: 'fixed', left: '50%', top: '42%',
        zIndex: 500, pointerEvents: 'none',
        animation: 'gainFloat 2.8s ease-out forwards',
      }}>
        <div style={{
          background: 'rgba(10,15,35,0.92)', borderRadius: 10,
          padding: '10px 18px', display: 'flex', gap: 12, alignItems: 'center',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
          flexWrap: 'wrap',
        }}>
          {Object.entries(active).map(([r, amt]) => (
            <span key={r} style={{ fontSize: 15, fontWeight: 700, color: RESOURCE_COLORS[r] }}>
              +{amt} {RESOURCE_LABELS[r]}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
