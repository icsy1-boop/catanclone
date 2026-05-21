// Pointy-top axial hex coordinate system (q, r). Cube: s = -q - r.
// Corner numbering: 0=upper-right, 1=lower-right, 2=bottom, 3=lower-left, 4=upper-left, 5=top
//   (i.e., corner i is at angle 60*i - 30 degrees, going clockwise)
//
// Edge s connects corners s and (s+1)%6 and is shared with direction (6-s)%6 neighbor.
// Corner c is shared between hex and its direction (6-c)%6 and (7-c)%6 neighbors.

export const DIRECTIONS = [
  [1, 0],   // 0: right
  [1, -1],  // 1: upper-right
  [0, -1],  // 2: upper-left
  [-1, 0],  // 3: left
  [-1, 1],  // 4: lower-left
  [0, 1],   // 5: lower-right
];

export function hexNeighbors(q, r) {
  return DIRECTIONS.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
}

export function hexDistance(q1, r1, q2, r2) {
  const dq = q2 - q1, dr = r2 - r1;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr));
}

// Ring index of a hex from origin (0 = center, 1 = first ring, etc.)
export function hexRing(q, r) {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
}

// All hex positions within `rings` rings (ring 0 = center tile).
// Uses direction 4 (-1,1) as the starting direction for each ring.
export function spiralRings(rings) {
  const hexes = [{ q: 0, r: 0 }];
  for (let ring = 1; ring <= rings; ring++) {
    let q = DIRECTIONS[4][0] * ring; // -ring
    let r = DIRECTIONS[4][1] * ring; // +ring
    for (let side = 0; side < 6; side++) {
      for (let step = 0; step < ring; step++) {
        hexes.push({ q, r });
        q += DIRECTIONS[side][0];
        r += DIRECTIONS[side][1];
      }
    }
  }
  return hexes;
}

// The 3 hexes that share vertex at corner `c` of hex (q,r).
// Corner c is shared with: (q,r), dir-(6-c)%6 neighbor, dir-(7-c)%6 neighbor.
export function getVertexHexes(q, r, corner) {
  const d1 = DIRECTIONS[(6 - corner) % 6];
  const d2 = DIRECTIONS[(7 - corner) % 6];
  return [
    { q, r },
    { q: q + d1[0], r: r + d1[1] },
    { q: q + d2[0], r: r + d2[1] },
  ];
}

function hexCubeStr({ q, r }) {
  return `${q},${r},${-q - r}`;
}

export function vertexKey(hexA, hexB, hexC) {
  return [hexCubeStr(hexA), hexCubeStr(hexB), hexCubeStr(hexC)]
    .sort()
    .join('|');
}

export function vertexKeyFromHexCorner(q, r, corner) {
  const [a, b, c] = getVertexHexes(q, r, corner);
  return vertexKey(a, b, c);
}

export function edgeKey(vk1, vk2) {
  return [vk1, vk2].sort().join('~~');
}

// Returns [vk1, vk2] for edge `side` of hex (q,r).
// Edge side s connects corner s and corner (s+1)%6.
export function hexEdgeVertexKeys(q, r, side) {
  const vk1 = vertexKeyFromHexCorner(q, r, side);
  const vk2 = vertexKeyFromHexCorner(q, r, (side + 1) % 6);
  return [vk1, vk2];
}

// Pixel center of hex (q,r) with given tile size (pointy-top).
export function axialToPixel(q, r, size) {
  return {
    x: size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r),
    y: size * (3 / 2 * r),
  };
}

// Pixel positions of the 6 corners of a hex given its center (cx, cy).
export function hexCornerPixels(cx, cy, size) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = Math.PI / 180 * (60 * i - 30);
    return { x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) };
  });
}
