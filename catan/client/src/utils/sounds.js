const cache = {};

function get(src, volume = 1.0) {
  if (!cache[src]) {
    cache[src] = new Audio(src);
    cache[src].volume = volume;
  }
  return cache[src];
}

export function playDice() {
  const s = get('/sounds/dice.wav', 0.55);
  s.currentTime = 0;
  s.play().catch(() => {});
}
