import { generateBoard } from '../game/BoardGenerator.js';

for (const count of [4, 6, 8]) {
  const board = generateBoard(count);
  const tileCount = board.tiles.length;
  const vertexCount = Object.keys(board.vertices).length;
  const edgeCount = Object.keys(board.edges).length;
  const ports = Object.values(board.vertices).filter(v => v.port).length;
  console.log(`${count} players: ${tileCount} tiles, ${vertexCount} vertices, ${edgeCount} edges, ${ports} port-vertices`);

  // Sanity: exactly 1 robber
  const robbers = board.tiles.filter(t => t.hasRobber).length;
  console.log(`  Robbers: ${robbers}, Deserts: ${board.tiles.filter(t => t.terrain === 'DESERT').length}`);

  // Check no adjacent red numbers
  let redAdjacent = false;
  for (const tile of board.tiles) {
    if (tile.numberToken !== 6 && tile.numberToken !== 8) continue;
    // check neighbors exist in board
    // simplified: just print the token distribution
  }
  const tokenDist = {};
  board.tiles.forEach(t => {
    if (t.numberToken) tokenDist[t.numberToken] = (tokenDist[t.numberToken] || 0) + 1;
  });
  console.log('  Tokens:', JSON.stringify(tokenDist));
}
