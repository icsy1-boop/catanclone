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

function TradeOfferRow({ offer, gameState, playerId, isMyOffer }) {
  const from = gameState.players[offer.fromPlayerId];
  const hasAny = (obj) => Object.values(obj).some(v => v > 0);
  return (
    <div style={{
      background: '#0f3460', borderRadius: 8, padding: 12, marginBottom: 8,
    }}>
      <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>
        {isMyOffer ? 'Your offer' : `${from?.name} offers:`}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        <span style={{ color: '#e74c3c', fontSize: 12 }}>Gives: </span>
        {Object.entries(offer.give).filter(([, v]) => v > 0).map(([r, v]) => (
          <span key={r} style={{ color: RESOURCE_COLORS[r], fontSize: 12 }}>{v}× {RESOURCE_LABELS[r]}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ color: '#2ecc71', fontSize: 12 }}>Wants: </span>
        {Object.entries(offer.want).filter(([, v]) => v > 0).map(([r, v]) => (
          <span key={r} style={{ color: RESOURCE_COLORS[r], fontSize: 12 }}>{v}× {RESOURCE_LABELS[r]}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {isMyOffer
          ? <Button onClick={() => actions.cancelTrade(offer.id)} variant="danger">Cancel</Button>
          : <Button onClick={() => actions.acceptTrade(offer.id)}>Accept</Button>
        }
      </div>
    </div>
  );
}

export default function TradeModal({ onClose }) {
  const { gameState, playerId, myResources } = useGameStore();
  const [give, setGive] = useState({});
  const [want, setWant] = useState({});
  const [tab, setTab] = useState('player'); // 'player' | 'port'

  if (!gameState) return null;

  const pending = gameState.pendingTrades ? Object.values(gameState.pendingTrades) : [];
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
          {pending.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>Active offers:</div>
              {pending.map(offer => (
                <TradeOfferRow key={offer.id} offer={offer} gameState={gameState}
                  playerId={playerId} isMyOffer={offer.fromPlayerId === playerId} />
              ))}
            </div>
          )}
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
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>
            Trade ratios depend on your ports. Default: 4:1. With 3:1 port: 3:1. With 2:1 port: 2:1.
          </p>
          <ResourcePicker label="You give" values={give} onChange={setGiveR} maxValues={myResources} />
          <div style={{ marginTop: 12 }}>
            <ResourcePicker label="You want (1 resource)" values={want} onChange={setWantR}
              maxValues={RESOURCES.reduce((acc, r) => { acc[r] = 1; return acc; }, {})} />
          </div>
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => { actions.portTrade(give, want); onClose(); }}
              disabled={!hasOffer()}>Trade with Bank</Button>
          </div>
        </>
      )}
    </Overlay>
  );
}
