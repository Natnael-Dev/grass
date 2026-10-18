# Environment and Grass (rendering spec)

**Purpose:** exact algorithms for grass, wind, interaction, sky, fireflies, seeds. **Read in:** M3, M4, M5, M7. Verify Three.js APIs with Context7 before coding.

## Grass instance generation (CPU, once, seeded)
```
rng = mulberry32(seed)               // default seed 1337; ?seed overrides
areaZ: z in [-70, 22], x in [-60, 60] // concentrated by density function
density(p) = ringWeight(dist(p, cameraBaseXZ))   // near r<14: 0.55, mid 14-32: 0.35, far 32-70: 0.10 (of total budget)
for each candidate (jittered grid per ring): keep if rng() < localDensity; y = terrainHeight(x,z)
params: height = lerp(0.35,0.9,rng()) * ringHeightScale(near 1.0, mid 1.15, far 1.5)
        width  = 0.045 * ringWidthScale(1.0, 1.6, 2.6)
        yaw = rng()*2π; bend = lerp(-0.35,0.35,rng()); rand = (rng(), rng())
Fisher–Yates shuffle all instances (seeded).
```
Total = tier blades. Unit-test: determinism, count, bounds, y == terrainHeight, ring proportions within ±5%.

## Blade geometry
Base geometry (per tier segments S = 4/3/2): vertices at heights `t = i/S`, two verts per row with half-width `w(t) = 0.5*(1 - t^1.4*0.92)`, final row collapses to a tip vertex. Attribute `position` = (x offset in blade space, t, 0). Indexed triangles. Double-sided via `side: DoubleSide` (or duplicate winding if profiling shows it's cheaper).

## Vertex shader (sketch — implement and verify, don't copy blindly)
```glsl
attribute vec3 offset; attribute vec4 params; attribute vec2 rand;
uniform float uTime, uWindStrength, uDensityComp, uReduced;
uniform vec2  uWindDir; uniform sampler2D uNoise;
uniform vec4  uTrail[16];           // x, z, radius, strength*response(age) (CPU computes response)
uniform int   uTrailCount;
uniform vec3  uCamPos;
varying float vH; varying vec3 vWorld; varying float vRand; varying float vFade;

void main() {
  float t = position.y;                       // 0..1 along blade
  float h = params.x; float w = params.y * uDensityComp;
  float yaw = params.z; float bend = params.w;
  vec3 local = vec3(position.x * w, t * h, 0.0);
  local.xz = mat2(cos(yaw), -sin(yaw), sin(yaw), cos(yaw)) * local.xz;
  vec3 root = offset;
  // static lean
  local.xz += vec2(cos(yaw), sin(yaw)) * bend * t * t * h;
  // wind: two noise taps (slow gust + fast flutter)
  vec2 uv = root.xz * 0.012 + uWindDir * uTime * 0.025;
  float gust = texture2D(uNoise, uv).r;
  float flut = texture2D(uNoise, root.xz * 0.09 + uTime * 0.35).g;
  float wind = (gust - 0.35) * 1.4 * uWindStrength + flut * 0.18 * uWindStrength * t;
  local.xz += uWindDir * wind * t * t * h * 0.9;
  // brush trail
  float flat_ = 0.0;
  for (int i = 0; i < 16; i++) { if (i >= uTrailCount) break;
    vec2 d = root.xz - uTrail[i].xy; float dist = length(d);
    float f = 1.0 - smoothstep(0.0, uTrail[i].z, dist);
    float s = uTrail[i].w * f;
    local.xz += normalize(d + 1e-4) * s * t * t * h * 0.9;
    flat_ += abs(s) ; }
  local.y *= 1.0 - clamp(flat_, 0.0, 0.55) * t;
  vec3 world = root + local;
  vWorld = world; vH = t; vRand = rand.x;
  // near-camera dither fade for lie-down
  vFade = smoothstep(0.15, 0.55, distance(world, uCamPos));
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
```
Note: `uTrail[i].w` already includes the spring response with sign (overshoot), computed on the CPU per point per frame. `uTrailCount` equals the tier's trail length.

## Fragment shader
`base = mix(grassBase, grassTip, pow(vH, 1.2))`; patch variation `mix(0.85, 1.12, noise(world.xz*0.05))`; per-blade jitter from `vRand`; root AO `mix(0.55,1.0,smoothstep(0.0,0.5,vH))`; back-light `pow(max(dot(viewDir, -lightDir),0.),3.)*0.35*lightColor*vH`; rim `pow(1.-abs(dot(N,V)),3.)*0.15`; ambient+diffuse = `ambientColor*ambientIntensity + lightColor*lightIntensity*wrapDiffuse`; apply exp2 fog; dither discard when `vFade < bayer(gl_FragCoord.xy)`.

## Terrain material
Gradient by slope/height from `terrainColor` with low-frequency noise patches; matches grass root colour so no visible seams; exp2 fog; no textures.

## Mood uniforms
`MoodController` blends presets and exposes one `MoodState` object consumed by every system each frame (`update`). Systems copy values to uniforms (no allocations).

## Sky shader (summary)
Direction `dir` from the vertex; gradient top→mid→horizon via `smoothstep` on `dir.y`; disc: `d = acos(dot(dir, sunDir))`, core `smoothstep(size, size*0.85, d)` + halo `exp(-d/halo*…)`; clouds: 2D FBM on `dir.xz/dir.y` projection scrolling with time, thresholded by `cloudCover`, lit using `cloudColor`; stars: hash-grid points on `dir`, twinkle with time, scaled by `starsAmount` and masked by horizon; always fog-blend toward horizon colour.

## Fireflies / Seeds
CPU-side typed-array state updated per frame (positions) or GPU-side animated by time in the vertex shader (preferred for fireflies: positions = home + Lissajous(time, phase); only uniforms update). Seeds update on the CPU (≤ 40 particles) into a `Float32Array` attribute with `needsUpdate`. Both use `Points` + `ShaderMaterial` (size attenuation by distance, soft round sprite by `gl_PointCoord`).

## Tree
Merged `BufferGeometry` (trunk + foliage blobs) with vertex colours; custom vertex shader adds sway `sin(time*0.6 + height)*0.01*height`; lit by the same mood uniforms (simple wrap diffuse + rim).

## Verification (M3)
Screenshot evidence at 3 camera-visible distances; no seams; wind visibly travelling (two screenshots 1 s apart with `?freeze` disabled differ in blade positions); `renderer.info.render.calls` ≤ 12; tier switch via `?quality=` changes blade count.
