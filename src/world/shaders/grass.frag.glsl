precision highp float;

uniform vec3 uGrassBase;
uniform vec3 uGrassTip;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;
uniform vec3 uSunDir;
uniform vec3 uFogColor;
uniform float uFogDensity;

varying float vH;
varying vec3 vWorld;
varying float vRand;
varying float vFade;
varying vec3 vNormal;

// Atmospheric fog calculation (exp2)
vec3 applyFog(vec3 color, float dist, vec3 fogColor, float fogDensity) {
  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * dist * dist);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  return mix(color, fogColor, fogFactor);
}

// 4x4 Bayer dither threshold for near-camera fade
float bayer4(vec2 coord) {
  int x = int(mod(coord.x, 4.0));
  int y = int(mod(coord.y, 4.0));
  int idx = x + y * 4;
  if (idx == 0) return 0.0 / 16.0;
  if (idx == 1) return 8.0 / 16.0;
  if (idx == 2) return 2.0 / 16.0;
  if (idx == 3) return 10.0 / 16.0;
  if (idx == 4) return 12.0 / 16.0;
  if (idx == 5) return 4.0 / 16.0;
  if (idx == 6) return 14.0 / 16.0;
  if (idx == 7) return 6.0 / 16.0;
  if (idx == 8) return 3.0 / 16.0;
  if (idx == 9) return 11.0 / 16.0;
  if (idx == 10) return 1.0 / 16.0;
  if (idx == 11) return 9.0 / 16.0;
  if (idx == 12) return 15.0 / 16.0;
  if (idx == 13) return 7.0 / 16.0;
  if (idx == 14) return 13.0 / 16.0;
  return 5.0 / 16.0;
}

// Low-frequency procedural patch noise without texture sampling
float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float patchNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  // Near-camera dither fade for lie-down
  if (vFade < bayer4(gl_FragCoord.xy)) {
    discard;
  }

  // 1. Color gradient from root to tip
  vec3 baseColor = mix(uGrassBase, uGrassTip, pow(vH, 1.2));

  // 2. Large-scale meadow patch variation (lighter/darker patches)
  float meadowPatch = mix(0.88, 1.12, patchNoise(vWorld.xz * 0.05));

  // 3. Per-blade lightness/hue jitter
  float bladeJitter = mix(0.92, 1.08, vRand);
  vec3 albedo = baseColor * meadowPatch * bladeJitter;

  // 4. Root ambient occlusion (darkens blade root to 55%)
  float rootAO = mix(0.55, 1.0, smoothstep(0.0, 0.5, vH));
  albedo *= rootAO;

  // 5. Lighting vectors
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uSunDir);
  vec3 V = normalize(cameraPosition - vWorld);

  // Soft wrap diffuse
  float wrapDiffuse = max(0.0, dot(N, L) * 0.5 + 0.5);
  vec3 direct = uLightColor * (uLightIntensity * wrapDiffuse);
  vec3 ambient = uAmbientColor * uAmbientIntensity;

  // 6. Back-light translucency toward sun
  float backDot = max(0.0, dot(V, -L));
  vec3 backLight = pow(backDot, 3.0) * 0.35 * uLightColor * vH;

  // 7. Rim light at grazing angles
  float rim = pow(1.0 - abs(dot(N, V)), 3.0) * 0.15;

  vec3 lit = albedo * (ambient + direct) + backLight + uLightColor * rim;

  // 8. Exponential squared atmospheric fog
  float dist = length(vWorld - cameraPosition);
  vec3 finalColor = applyFog(lit, dist, uFogColor, uFogDensity);

  gl_FragColor = vec4(finalColor, 1.0);

  #include <colorspace_fragment>
}
