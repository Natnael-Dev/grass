# Scene and Camera

**Purpose:** coordinates, scene graph, camera parameters, terrain function. **Read in:** M2, M6.

## Conventions
Right-handed, Y up, metres. Origin at the foreground centre. +Z toward the camera, −Z into the scene (hill is at −Z). Wind default direction +X.

## Scene graph
```
Scene
├─ Sky (large inverted sphere r=400, ShaderMaterial, depthWrite=false, renderOrder -10, follows camera position)
├─ Ridges[3]  (z = -160, -230, -310; wide ribbons with noisy skyline, fog-blended)
├─ Terrain    (PlaneGeometry 160×160, 128×128 segs, y from terrainHeight, custom/standard material)
├─ Tree       (group at hill crest)
├─ Grass      (single InstancedMesh-like mesh)
├─ Fireflies  (Points, additive, depthWrite=false)
└─ Seeds      (Points, normal/additive blend, depthWrite=false)
```
`scene.fog` is not used for custom shaders; implement exp2 fog manually in each shader via shared GLSL chunk `fog.glsl` driven by uniforms (`uFogColor`, `uFogDensity`) so all materials match.

## Terrain (single source of truth, `src/world/terrain.ts`)
```ts
// Pure, deterministic, unit-tested. Used by mesh, grass placement, tree, seeds, fireflies, camera, raycaster.
const G = (x:number,z:number,cx:number,cz:number,s:number,a:number)=> a*Math.exp(-((x-cx)**2+(z-cz)**2)/(2*s*s));
export function terrainHeight(x: number, z: number): number {
  const hill  = G(x,z,  6, -26, 15, 5.2);       // main hill with the tree on top
  const hill2 = G(x,z,-30, -40, 18, 3.2);       // secondary rise
  const swell = 0.35*Math.sin(x*0.09+1.3)*Math.cos(z*0.07) + 0.18*Math.sin(x*0.21+z*0.17);
  const flatten = Math.min(1, Math.max(0, (z + 4) / 10)); // calmer near the camera (z>-4 ≈ flat)
  return hill + hill2 + swell * (1 - 0.7*flatten);
}
```
(Tune constants for the composition in `art-direction.md`; keep the function pure and keep tests: range bounds, determinism, continuity, tree position height.) Terrain normals from central differences (ε=0.1).
Tree position: `(6, terrainHeight(6,-26), -26)` → x=6, z=−26.

## Camera
| Param | Value |
|---|---|
| type | PerspectiveCamera, near 0.1, far 900 |
| fov | 48° landscape; 55° if aspect < 1 (portrait); lerp when resizing |
| base position | `(0, terrainHeight(0,10)+1.65, 10)` |
| base look-at | `(0, 2.4, -22)` (aim slightly above hill base; tune so horizon ≈ 42% from top) |
| entry pose | base + (0, 0.9, 3.5), eases to base over 1.4 s |
| parallax | yaw ±6°, pitch ±3° from pointer position (spring ω=4) |
| dip pose | y = terrainHeight(x,z)+0.38 (always recomputed), pitch +14°, fov +4° |
| bounds | camera never moves in XZ except tiny parallax sway (±0.15 m); no collision system needed beyond ground clamp: `y = max(y, terrainHeight+0.25)` |

`CameraRig` is the only owner of the camera; others request poses via `rig.setLying(bool)`, `rig.setParallaxTarget(x,y)`, `rig.startEntry()`, `rig.setIdle(bool)`. All transitions use `damp()`/tweens from `core/math.ts` with explicit durations and the easings in `motion-and-interactions.md`.

## Resize
On resize: update aspect, fov by aspect rule, renderer size/DPR, re-evaluate tier DPR cap. Never recreate GPU resources on resize.

## Context loss
Listen to `webglcontextlost` (preventDefault) and `webglcontextrestored`; on restore rebuild GPU resources from CPU-side data (instances are regenerable from seed).
