export const RESOURCES = ['WOOD', 'BRICK', 'SHEEP', 'WHEAT', 'ORE'];

export class Player {
  constructor(id, name, color) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.resources = { WOOD: 0, BRICK: 0, SHEEP: 0, WHEAT: 0, ORE: 0 };
    this.devCards = { KNIGHT: 0, ROAD_BUILDING: 0, YEAR_OF_PLENTY: 0, MONOPOLY: 0, VP: 0 };
    this.newDevCards = []; // drawn this turn — unplayable until next
    this.knightsPlayed = 0;
    this.settlements = 5;
    this.cities = 4;
    this.roads = 15;
    this.victoryPoints = 0; // public VP (buildings)
    this.hiddenVP = 0;      // from VP dev cards
  }

  totalResources() {
    return Object.values(this.resources).reduce((a, b) => a + b, 0);
  }

  canAfford(costs) {
    return RESOURCES.every(r => this.resources[r] >= (costs[r] || 0));
  }

  deductResources(costs) {
    for (const r of RESOURCES) {
      this.resources[r] -= (costs[r] || 0);
    }
  }

  addResources(gains) {
    for (const r of RESOURCES) {
      this.resources[r] += (gains[r] || 0);
    }
  }

  // Public-facing view (hides hand and hidden VP)
  publicView() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      resourceCount: this.totalResources(),
      devCardCount: Object.values(this.devCards).reduce((a, b) => a + b, 0) + this.newDevCards.length,
      knightsPlayed: this.knightsPlayed,
      settlements: this.settlements,
      cities: this.cities,
      roads: this.roads,
      victoryPoints: this.victoryPoints,
      playedDevCardThisTurn: this.playedDevCardThisTurn || false,
    };
  }

  privateView() {
    return {
      resources: { ...this.resources },
      devCards: { ...this.devCards },
      newDevCards: [...this.newDevCards],
    };
  }
}
