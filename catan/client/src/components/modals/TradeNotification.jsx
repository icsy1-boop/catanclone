import { useGameStore } from '../../store/gameStore.js';
import { actions } from '../../store/actions.js';
import { RESOURCE_COLORS, RESOURCE_LABELS } from '../../constants/resources.js';
import Button from '../shared/Button.jsx';

function ResourceLine({ resources, label, labelColor }) {
  const entries = Object.entries(resources).filter(([, v]) => v > 0);
  if (!entries.length) return null;
  return (
    <div style={{ fontSize: 12, marginBottom: 3 }}>
      <span style={{ color: labelColor, marginRight: 4 }}>{label}:</span>
      {entries.map(([r, v]) => (
        <span key={r} style={{ color: RESOURCE_COLORS[r], marginRight: 6 }}>
          {v}× {RESOURCE_LABELS[r]}
        </span>
      ))}
    </div>
  );
}

export default function TradeNotification() {
  const { gameState, playerId } = useGameStore();
  if (!gameState?.pendingTrades) return null;

  const offers = Object.values(gameState.pendingTrades);
  if (!offers.length) return null;

  return (
    <div style={{
      position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50, maxWidth: 240,
    }}>
      {offers.map(offer => {
        const isMyOffer = offer.fromPlayerId === playerId;
        const fromPlayer = gameState.players[offer.fromPlayerId];
        const responses = offer.responses || {};
        const myResponse = responses[playerId];

        const acceptors = Object.entries(responses)
          .filter(([, r]) => r === 'accepted')
          .map(([pid]) => gameState.players[pid]).filter(Boolean);

        const decliners = Object.entries(responses)
          .filter(([, r]) => r === 'declined')
          .map(([pid]) => gameState.players[pid]).filter(Boolean);

        // Players who haven't responded yet (excluding offeror)
        const pending = gameState.turnOrder
          .filter(pid => pid !== offer.fromPlayerId && !responses[pid])
          .map(pid => gameState.players[pid]).filter(Boolean);

        return (
          <div key={offer.id} style={{
            background: 'rgba(15,25,60,0.97)', borderRadius: 10, padding: 14,
            border: `1px solid ${isMyOffer ? 'rgba(243,156,18,0.5)' : 'rgba(52,152,219,0.5)'}`,
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: fromPlayer?.color || '#eee', marginBottom: 8 }}>
              {isMyOffer ? 'Your offer' : `${fromPlayer?.name} offers:`}
            </div>
            <ResourceLine resources={offer.give} label="Gives" labelColor="#e74c3c" />
            <ResourceLine resources={offer.want} label="Wants" labelColor="#2ecc71" />

            <div style={{ marginTop: 10 }}>
              {isMyOffer ? (
                <>
                  {/* Acceptors — can pick any to trade with */}
                  {acceptors.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      {acceptors.map(p => (
                        <button key={p.id}
                          onClick={() => actions.confirmTrade(offer.id, p.id)}
                          style={{
                            display: 'block', width: '100%', marginBottom: 4,
                            padding: '6px 10px', borderRadius: 6, border: 'none',
                            background: '#27ae60', color: '#fff', cursor: 'pointer',
                            fontSize: 12, fontWeight: 700, textAlign: 'left',
                          }}>
                          ✓ Trade with {p.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Decliners */}
                  {decliners.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      {decliners.map(p => (
                        <div key={p.id} style={{ fontSize: 11, color: '#e74c3c', marginBottom: 2 }}>
                          ✗ {p.name} declined
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Still waiting */}
                  {pending.length > 0 && (
                    <div style={{ fontSize: 11, color: '#777', marginBottom: 6 }}>
                      Waiting: {pending.map(p => p.name).join(', ')}
                    </div>
                  )}

                  {acceptors.length === 0 && pending.length === 0 && (
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
                      Everyone declined
                    </div>
                  )}

                  <Button onClick={() => actions.cancelTrade(offer.id)} variant="ghost"
                    style={{ width: '100%', fontSize: 12 }}>
                    Cancel offer
                  </Button>
                </>
              ) : (
                myResponse ? (
                  <div style={{
                    fontSize: 12, fontWeight: 600,
                    color: myResponse === 'accepted' ? '#2ecc71' : '#888',
                  }}>
                    {myResponse === 'accepted' ? '✓ Accepted — waiting for confirmation' : '✗ You declined'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button onClick={() => actions.respondTrade(offer.id, 'accepted')}
                      style={{ flex: 1, fontSize: 12 }}>
                      ✓ Accept
                    </Button>
                    <Button onClick={() => actions.respondTrade(offer.id, 'declined')}
                      variant="ghost" style={{ flex: 1, fontSize: 12 }}>
                      ✗ Decline
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
