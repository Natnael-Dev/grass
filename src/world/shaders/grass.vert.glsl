attribute vec3 offset;
attribute vec4 params;
attribute vec2 rand;

uniform float uTime;
uniform float uWindStrength;
uniform float uDensityComp;
uniform float uReduced;
uniform vec2 uWindDir;
uniform sampler2D uNoise;
uniform vec4 uTrail[16];
uniform int uTrailCount;
uniform vec3 uCamPos;

varying float vH;
varying vec3 vWorld;
varying float vRand;
varying float vFade;
varying vec3 vNormal;

void main() {
  float t = position.y; // 0..1 along blade
  float h = params.x;
  float w = params.y * uDensityComp;
  float yaw = params.z;
  float bend = params.w;

  // 1. Blade shape in local space
  vec3 local = vec3(position.x * w, t * h, 0.0);

  // 2. Rotate by yaw
  float cosY = cos(yaw);
  float sinY = sin(yaw);
  local.xz = mat2(cosY, -sinY, sinY, cosY) * local.xz;

  // 3. Static curvature lean
  local.xz += vec2(cosY, sinY) * bend * t * t * h;

  vec3 root = offset;

  // 4. Dual-octave traveling wind waves
  vec2 uv = root.xz * 0.012 + uWindDir * uTime * 0.025;
  float gust = texture2D(uNoise, uv).r;
  float flut = texture2D(uNoise, root.xz * 0.09 + uTime * 0.35).g;
  float wind = (gust - 0.35) * 1.4 * uWindStrength + flut * 0.18 * uWindStrength * t;
  local.xz += uWindDir * wind * t * t * h * 0.9;

  // 5. Brush trail interaction
  float flat_ = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= uTrailCount) break;
    vec2 d = root.xz - uTrail[i].xy;
    float dist = length(d);
    float f = 1.0 - smoothstep(0.0, uTrail[i].z, dist);
    float s = uTrail[i].w * f;
    local.xz += normalize(d + 1e-4) * s * t * t * h * 0.9;
    flat_ += abs(s);
  }
  local.y *= 1.0 - clamp(flat_, 0.0, 0.55) * t;

  vec3 world = root + local;
  vWorld = world;
  vH = t;
  vRand = rand.x;

  // 6. Blend blade normal 60% toward terrain up for soft painterly shading
  vec3 bladeNormal = vec3(-sinY, 0.0, cosY);
  vNormal = normalize(mix(bladeNormal, vec3(0.0, 1.0, 0.0), 0.6));

  // 7. Near-camera dither fade factor
  vFade = smoothstep(0.15, 0.55, distance(world, uCamPos));

  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
