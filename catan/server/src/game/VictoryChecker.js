// DFS to find the longest road for a player.
// An opponent's settlement/city on a vertex breaks road continuity.
export function computeLongestRoad(board, gameState, playerId) {
  const playerEdges = Object.values(board.edges)
    .filter(e => e.road?.playerId === playerId);

  if (playerEdges.length === 0) return 0;

  // Build adjacency: vertex → list of edge ids reachable (player's roads)
  const adj = {};
  for (const edge of playerEdges) {
    for (const vk of edge.adjacentVertices) {
      if (!adj[vk]) adj[vk] = [];
      adj[vk].push(edge.id);
    }
  }

  let best = 0;

  function dfs(currentVertex, cameFromEdge, visitedEdges) {
    const reachable = (adj[currentVertex] || [])
      .filter(eid => !visitedEdges.has(eid));

    for (const eid of reachable) {
      visitedEdges.add(eid);
      const edge = board.edges[eid];
      const nextVertex = edge.adjacentVertices.find(v => v !== currentVertex);

      // Check if nextVertex has an opponent's building (road break)
      const building = board.vertices[nextVertex]?.building;
      const isBlocked = building && building.playerId !== playerId;

      if (!isBlocked) {
        dfs(nextVertex, eid, visitedEdges);
      }
      visitedEdges.delete(eid);
    }

    best = Math.max(best, visitedEdges.size);
  }

  for (const edge of playerEdges) {
    for (const startVertex of edge.adjacentVertices) {
      const visited = new Set([edge.id]);
      const otherVertex = edge.adjacentVertices.find(v => v !== startVertex);
      const building = board.vertices[otherVertex]?.building;
      if (!building || building.playerId === playerId) {
        dfs(otherVertex, edge.id, visited);
      }
    }
  }

  return best;
}

export function computePublicVP(player, gameState) {
  let vp = player.victoryPoints; // settlements + cities already tracked
  if (gameState.longestRoadOwner === player.id) vp += 2;
  if (gameState.largestArmyOwner === player.id) vp += 2;
  return vp;
}

export function checkWin(gameState) {
  for (const pid of gameState.turnOrder) {
    const player = gameState.players[pid];
    const totalVP = computePublicVP(player, gameState) + player.hiddenVP;
    if (totalVP >= 10) return pid;
  }
  return null;
}

export function updateLongestRoad(gameState) {
  const board = gameState.board;
  let best = gameState.longestRoadLength || 4; // must be > 4 to count
  let owner = gameState.longestRoadOwner;

  for (const pid of gameState.turnOrder) {
    const len = computeLongestRoad(board, gameState, pid);
    gameState.players[pid]._roadLength = len;
    if (len > best) {
      best = len;
      owner = pid;
    }
  }

  // If current owner no longer has the longest, it becomes vacant
  if (owner && gameState.players[owner]._roadLength < best) {
    owner = null;
  }

  gameState.longestRoadOwner = owner;
  gameState.longestRoadLength = best;
}

export function updateLargestArmy(gameState) {
  let best = gameState.largestArmyCount || 2; // must be > 2
  let owner = gameState.largestArmyOwner;

  for (const pid of gameState.turnOrder) {
    const k = gameState.players[pid].knightsPlayed;
    if (k > best) {
      best = k;
      owner = pid;
    }
  }

  gameState.largestArmyOwner = owner;
  gameState.largestArmyCount = best;
}
