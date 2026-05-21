const DECK_COMPOSITION = {
  KNIGHT: 14,
  VP: 5,
  ROAD_BUILDING: 2,
  YEAR_OF_PLENTY: 2,
  MONOPOLY: 2,
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class DevCardDeck {
  constructor() {
    this.cards = shuffle(
      Object.entries(DECK_COMPOSITION).flatMap(([type, count]) =>
        Array.from({ length: count }, () => type)
      )
    );
  }

  draw() {
    return this.cards.pop() || null;
  }

  get remaining() {
    return this.cards.length;
  }
}
