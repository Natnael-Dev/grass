import * as THREE from 'three';

/**
 * Generates procedural single blade geometry for given vertical segments S (4/3/2).
 * Vertices at heights t = i/S, half-width w(t) = 0.5 * (1 - t^1.4 * 0.92),
 * final row collapses to a single tip vertex at (0, 1, 0).
 */
export function createBladeGeometry(segments: number): THREE.BufferGeometry {
  const S = Math.max(2, Math.floor(segments));
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Rows 0 to S-1: 2 vertices per row (left and right)
  for (let i = 0; i < S; i++) {
    const t = i / S;
    const w = 0.5 * (1.0 - Math.pow(t, 1.4) * 0.92);

    // Left vertex
    positions.push(-w, t, 0.0);
    normals.push(0.0, 0.0, 1.0);
    uvs.push(0.0, t);

    // Right vertex
    positions.push(w, t, 0.0);
    normals.push(0.0, 0.0, 1.0);
    uvs.push(1.0, t);
  }

  // Row S: single tip vertex
  const tipIndex = 2 * S;
  positions.push(0.0, 1.0, 0.0);
  normals.push(0.0, 0.0, 1.0);
  uvs.push(0.5, 1.0);

  // Build indexed triangles
  for (let i = 0; i < S - 1; i++) {
    const bL = i * 2;
    const bR = i * 2 + 1;
    const tL = (i + 1) * 2;
    const tR = (i + 1) * 2 + 1;

    indices.push(bL, bR, tL);
    indices.push(bR, tR, tL);
  }

  // Connect last row to tip vertex
  const lastL = (S - 1) * 2;
  const lastR = (S - 1) * 2 + 1;
  indices.push(lastL, lastR, tipIndex);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}
