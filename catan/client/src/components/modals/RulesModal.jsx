import { Overlay } from './StealModal.jsx';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontWeight: 700, color: '#f39c12', fontSize: 14, marginBottom: 6 }}>{title}</div>
    {children}
  </div>
);

const Row = ({ label, value, note }) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 13 }}>
    <span style={{ color: '#eee', minWidth: 110 }}>{label}</span>
    <span style={{ color: '#aaa' }}>{value}</span>
    {note && <span style={{ color: '#777', fontSize: 11 }}>{note}</span>}
  </div>
);

export default function RulesModal({ onClose }) {
  return (
    <Overlay onClose={onClose}>
      <h3 style={{ marginBottom: 16 }}>Rules Reference</h3>

      <Section title="Build Costs">
        <Row label="Road" value="Wood + Brick" />
        <Row label="Settlement" value="Wood + Brick + Sheep + Wheat" />
        <Row label="City" value="Wheat × 2 + Ore × 3" note="upgrades settlement" />
        <Row label="Dev Card" value="Sheep + Wheat + Ore" />
      </Section>

      <Section title="Victory Points">
        <Row label="Settlement" value="1 VP" />
        <Row label="City" value="2 VP" />
        <Row label="Longest Road" value="2 VP" note="≥5 roads" />
        <Row label="Largest Army" value="2 VP" note="≥3 knights" />
        <Row label="VP Dev Card" value="1 VP each" note="revealed on win" />
        <Row label="Win condition" value="10 VP" />
      </Section>

      <Section title="Rolling a 7">
        <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>
          Any player with more than 7 cards must discard half (rounded down).
          Then move the robber to any land tile. Steal 1 random card from a
          player who has a settlement or city on that tile.
        </div>
      </Section>

      <Section title="Trading">
        <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>
          <b style={{ color: '#eee' }}>Player trade:</b> Offer any resources — other players accept or decline.
          You choose who to trade with among acceptors.<br /><br />
          <b style={{ color: '#eee' }}>Bank/Port:</b> Default 4:1 (any 4 same resource → 1 of any).
          3:1 port: any 3 same → 1 any. 2:1 port: 2 of that resource → 1 any.
        </div>
      </Section>

      <Section title="Dev Cards">
        <Row label="Knight" value="Move robber, steal" note="play before or after roll" />
        <Row label="Road Building" value="Place 2 free roads" />
        <Row label="Year of Plenty" value="Take any 2 resources" />
        <Row label="Monopoly" value="Take all of one resource" />
        <Row label="VP" value="+1 victory point" />
      </Section>

      <Section title="Largest Army / Longest Road">
        <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>
          Largest Army: first to play 3+ knights gets 2 VP. Can be stolen by playing more knights.
          Longest Road: first to build 5+ continuous roads gets 2 VP. Can be stolen.
        </div>
      </Section>
    </Overlay>
  );
}
