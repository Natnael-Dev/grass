/**
 * Analytic terrain function and surface normals.
 * Single source of truth across mesh, grass placement, tree, seeds, fireflies, camera, and raycaster.
 * Specified in docs/03-frontend/scene-and-camera.md.
 */

const G = (x: number, z: number, cx: number, cz: number, s: number, a: number): number =>
  a * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * s * s));

/**
 * Calculates the terrain elevation Y in metres for given world (X, Z) coordinates.
 * Deterministic and continuous.
 */
export function terrainHeight(x: number, z: number): number {
  const hill = G(x, z, 6, -26, 15, 5.2); // main hill with the tree on top
  const hill2 = G(x, z, -30, -40, 18, 3.2); // secondary rise
  const swell =
    0.35 * Math.sin(x * 0.09 + 1.3) * Math.cos(z * 0.07) + 0.18 * Math.sin(x * 0.21 + z * 0.17);
  const flatten = Math.min(1, Math.max(0, (z + 4) / 10)); // calmer near camera (z > -4 is flatter)
  return hill + hill2 + swell * (1 - 0.7 * flatten);
}

export interface TerrainNormal {
  x: number;
  y: number;
  z: number;
}

/**
 * Computes normalized terrain surface normal vector at (X, Z) using central differences.
 */
export function terrainNormal(x: number, z: number, eps = 0.1): TerrainNormal {
  const hL = terrainHeight(x - eps, z);
  const hR = terrainHeight(x + eps, z);
  const hD = terrainHeight(x, z - eps);
  const hU = terrainHeight(x, z + eps);

  // Partial derivatives
  const dx = (hR - hL) / (2 * eps);
  const dz = (hU - hD) / (2 * eps);

  // Surface normal (-dx, 1, -dz) normalized
  const len = Math.hypot(-dx, 1, -dz);
  return {
    x: -dx / len,
    y: 1 / len,
    z: -dz / len,
  };
}

/**
 * Lone tree coordinates on the hill crest.
 */
export const TREE_COORDS = {
  x: 6,
  z: -26,
  get y(): number {
    return terrainHeight(this.x, this.z);
  },
} as const;

export { TerrainMesh, Terrain } from './TerrainMesh';
