import { useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { actions } from '../../store/actions.js';
import { RESOURCES, RESOURCE_COLORS, RESOURCE_LABELS } from '../../constants/resources.js';
import { Overlay } from './StealModal.jsx';
import Button from '../shared/Button.jsx';

function ResourcePicker({ label, values, onChange, maxValues }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {RESOURCES.map(r => (
          <div key={r} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: RESOURCE_COLORS[r] }}>{RESOURCE_LABELS[r]}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => onChange(r, Math.max(0, (values[r] || 0) - 1))}
                style={{ width: 24, height: 24, borderRadius: 4, border: 'none', background: '#2c3e50', color: '#eee', cursor: 'pointer' }}>−</button>
              <span style={{ width: 20, textAlign: 'center', fontSize: 14, color: '#eee' }}>
                {values[r] || 0}
              </span>
              <button onClick={() => onChange(r, Math.min(maxValues?.[r] ?? 9, (values[r] || 0) + 1))}
                style={{ width: 24, height: 24, borderRadius: 4, border: 'none', background: '#2c3e50', color: '#eee', cursor: 'pointer' }}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getPortRatio(gameState, playerId, resource) {
  let ratio = 4;
  if (!gameState?.board) return ratio;
  for (const vertex of Object.values(gameState.board.vertices)) {
    if (!vertex.building || vertex.building.playerId !== playerId) continue;
    if (!vertex.port) continue;
    if (vertex.port.resource === resource) return 2;
    if (vertex.port.resource === null && vertex.port.ratio === 3 && ratio > 3) ratio = 3;
  }
  return ratio;
}

export default function TradeModal({ onClose }) {
  const { gameState, myResources, playerId } = useGameStore();
  const [give, setGive] = useState({});
  const [want, setWant] = useState({});
  const [tab, setTab] = useState('player');

  if (!gameState) return null;

  const hasOffer = () => Object.values(give).some(v => v > 0) && Object.values(want).some(v => v > 0);
  const setGiveR = (r, v) => setGive(prev => ({ ...prev, [r]: v }));
  const setWantR = (r, v) => setWant(prev => ({ ...prev, [r]: v }));

  return (
    <Overlay onClose={onClose}>
      <h3 style={{ marginBottom: 12 }}>Trade</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['player', 'port'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t ? '#f39c12' : '#2c3e50', color: tab === t ? '#111' : '#eee',
              fontWeight: 600, fontSize: 13,
            }}>{t === 'player' ? 'With Players' : 'With Bank/Port'}</button>
        ))}
      </div>

      {tab === 'player' ? (
        <>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>
            Set your offer below. Other players will see it and can accept or decline.
            You then choose who to trade with.
          </p>
          <ResourcePicker label="You give" values={give} onChange={setGiveR} maxValues={myResources} />
          <div style={{ marginTop: 12 }}>
            <ResourcePicker label="You want" values={want} onChange={setWantR} />
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <Button onClick={() => { setGive({}); setWant({}); }} variant="ghost">Clear</Button>
            <Button onClick={() => { actions.offerTrade(give, want); onClose(); }}
              disabled={!hasOffer()}>Offer Trade</Button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {RESOURCES.map(r => {
              const ratio = getPortRatio(gameState, playerId, r);
              return (
                <span key={r} style={{
                  fontSize: 12, padding: '3px 8px', borderRadius: 6,
                  background: ratio < 4 ? 'rgba(243,156,18,0.15)' : 'rgba(255,255,255,0.05)',
                  color: ratio < 4 ? '#f39c12' : '#666',
                  border: `1px solid ${ratio < 4 ? 'rgba(243,156,18,0.4)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  {RESOURCE_LABELS[r]}: {ratio}:1
                </span>
              );
            })}
          </div>
          <ResourcePicker label="You give" values={give} onChange={setGiveR} maxValues={myResources} />
          {(() => {
            // How many resources can be received based on current give selection
            const receivable = RESOURCES.reduce((sum, r) => {
              const ratio = getPortRatio(gameState, playerId, r);
              return sum + Math.floor((give[r] || 0) / ratio);
            }, 0);
            const wantMax = RESOURCES.reduce((acc, r) => { acc[r] = receivable; return acc; }, {});
            const wantTotal = RESOURCES.reduce((s, r) => s + (want[r] || 0), 0);
            const bankOk = receivable > 0 && wantTotal === receivable;
            return (
              <div style={{ marginTop: 12 }}>
                <ResourcePicker
                  label={`You want (${receivable > 0 ? `${receivable} resource${receivable !== 1 ? 's' : ''}` : 'select what to give first'})`}
                  values={want} onChange={setWantR} maxValues={wantMax} />
                <div style={{ marginTop: 16 }}>
                  <Button onClick={() => { actions.portTrade(give, want); onClose(); }}
                    disabled={!bankOk}>Trade with Bank</Button>
                  {receivable > 0 && wantTotal !== receivable && (
                    <span style={{ fontSize: 11, color: '#888', marginLeft: 10 }}>
                      Select {receivable - wantTotal} more to want
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </>
      )}
    </Overlay>
  );
}
