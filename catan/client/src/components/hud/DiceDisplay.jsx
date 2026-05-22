import { useEffect, useRef, useState } from 'react';

// 3D CSS cube die
const SIZE = 46;
const HALF = SIZE / 2;

const CUBE_TRANSFORM = {
  1: 'rotateX(0deg)',
  2: 'rotateX(90deg)',
  3: 'rotateY(-90deg)',
  4: 'rotateY(90deg)',
  5: 'rotateX(-90deg)',
  6: 'rotateX(-180deg)',
};

const FACE_PLACEMENT = [
  `rotateX(0deg) translateZ(${HALF}px)`,
  `rotateX(-90deg) translateZ(${HALF}px)`,
  `rotateY(90deg) translateZ(${HALF}px)`,
  `rotateY(-90deg) translateZ(${HALF}px)`,
  `rotateX(90deg) translateZ(${HALF}px)`,
  `rotateX(-180deg) translateZ(${HALF}px)`,
];

const PIP_POS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
};

const PIP_R = SIZE * 0.088;

function DieFace({ faceValue }) {
  const isRed = faceValue === 6;
  const pips = PIP_POS[faceValue] || [];
  return (
    <div style={{
      width: SIZE, height: SIZE, boxSizing: 'border-box',
      background: isRed ? '#c0392b' : '#f0ede0',
      borderRadius: SIZE * 0.16,
      border: `1.5px solid ${isRed ? '#8b1a0e' : '#888'}`,
      position: 'relative',
      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -1px 3px rgba(0,0,0,0.15)',
    }}>
      {pips.map(([px, py], i) => (
        <div key={i} style={{
          position: 'absolute',
          width: PIP_R * 2, height: PIP_R * 2, borderRadius: '50%',
          background: isRed ? '#fff' : '#222',
          left: `${px}%`, top: `${py}%`,
          transform: 'translate(-50%, -50%)',
          boxShadow: isRed ? 'none' : '0 1px 2px rgba(0,0,0,0.4)',
        }} />
      ))}
    </div>
  );
}

function Die3D({ value }) {
  const t = CUBE_TRANSFORM[value] || CUBE_TRANSFORM[1];
  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, perspective: `${SIZE * 10}px` }}>
      <div style={{
        position: 'absolute', width: SIZE, height: SIZE,
        transformStyle: 'preserve-3d',
        transform: `translateZ(-${HALF}px) ${t}`,
        transition: 'transform 220ms ease',
      }}>
        {[1, 2, 3, 4, 5, 6].map((fv, i) => (
          <div key={fv} style={{
            position: 'absolute', width: SIZE, height: SIZE,
            transform: FACE_PLACEMENT[i],
            backfaceVisibility: 'hidden',
          }}>
            <DieFace faceValue={fv} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DiceDisplay({ lastRoll }) {
  const [displayed, setDisplayed] = useState(null);
  const [rolling, setRolling] = useState(false);
  const seenKey = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    if (!lastRoll) return;
    const key = lastRoll.join(',');
    if (seenKey.current === key) return;
    seenKey.current = key;

    setRolling(true);
    setDisplayed([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);

    let tick = 0;
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      tick++;
      if (tick >= 9) {
        clearInterval(tickRef.current);
        setDisplayed([...lastRoll]);
        setRolling(false);
      } else {
        setDisplayed([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
      }
    }, 95);

    return () => clearInterval(tickRef.current);
  }, [lastRoll]);

  const show = displayed || lastRoll;
  if (!show) return null;

  const total = (lastRoll || show)[0] + (lastRoll || show)[1];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(22,33,62,0.9)', padding: '10px 14px',
      borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <Die3D value={show[0]} />
      <Die3D value={show[1]} />
      {!rolling && (
        <span style={{ fontSize: 20, fontWeight: 700, color: total === 7 ? '#e74c3c' : '#f1c40f', minWidth: 24 }}>
          {total}
        </span>
      )}
    </div>
  );
}
