precision highp float;

uniform vec3 uSkyTop;
uniform vec3 uSkyMid;
uniform vec3 uSkyHorizon;
uniform vec3 uDiscColor;
uniform vec3 uSunDir;
uniform float uDiscSize;
uniform float uHalo;
uniform vec3 uCloudColor;
uniform float uCloudCover;
uniform float uStarsAmount;
uniform vec3 uFogColor;
uniform float uTime;

varying vec3 vWorldDir;

// Procedural hash and noise for clouds and stars
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  v += 0.5000 * noise(p);
  p *= 2.02;
  v += 0.2500 * noise(p);
  p *= 2.03;
  v += 0.1250 * noise(p);
  return v;
}

// Procedural twinkling stars on celestial dome
float starField(vec3 dir, float time) {
  vec3 p = dir * 160.0;
  vec3 i = floor(p);
  vec3 f = fract(p) - 0.5;

  float h = hash(i.xy + i.z * 37.19);
  // High threshold for sparse, crisp stars
  if (h > 0.955) {
    float size = (h - 0.955) / 0.045;
    float dist = length(f);
    float twinkle = sin(time * 2.2 + h * 6.283) * 0.35 + 0.65;
    return smoothstep(0.3 * size, 0.02, dist) * twinkle;
  }
  return 0.0;
}

void main() {
  vec3 dir = normalize(vWorldDir);
  float h = clamp(dir.y, 0.0, 1.0);

  // 1. Vertical 3-stop sky gradient
  vec3 skyColor;
  if (h < 0.25) {
    float t = h / 0.25;
    skyColor = mix(uSkyHorizon, uSkyMid, smoothstep(0.0, 1.0, t));
  } else {
    float t = (h - 0.25) / 0.75;
    skyColor = mix(uSkyMid, uSkyTop, smoothstep(0.0, 1.0, t));
  }

  // 2. Celestial disc (sun or moon) & soft atmospheric halo
  float sunDot = max(0.0, dot(dir, normalize(uSunDir)));
  float discThreshold = 1.0 - (uDiscSize * uDiscSize * 0.1);
  float celestialDisc = smoothstep(discThreshold - 0.002, discThreshold, sunDot);

  // Night moon mottling: soft crater-less surface texture via noise (no bitmaps)
  if (uStarsAmount > 0.01 && celestialDisc > 0.0) {
    float mottle = noise(dir.xy * 60.0 + dir.z * 30.0) * 0.22 + noise(dir.xy * 120.0) * 0.12;
    float moonTexture = clamp(1.0 - mottle * uStarsAmount, 0.65, 1.0);
    celestialDisc *= moonTexture;
  }

  // Soft atmospheric halo
  float halo = pow(sunDot, 18.0) * uHalo;
  vec3 discGlow = uDiscColor * (celestialDisc * 2.0 + halo);

  vec3 finalColor = skyColor + discGlow;

  // 3. Twinkling night stars (masked by horizon)
  if (uStarsAmount > 0.01 && dir.y > 0.06) {
    float starMask = smoothstep(0.06, 0.28, dir.y);
    float stars = starField(dir, uTime) * uStarsAmount * starMask;
    finalColor += vec3(0.95, 0.96, 1.0) * stars;
  }

  // 4. Painterly drifting clouds in the upper dome
  if (dir.y > 0.03 && uCloudCover > 0.01) {
    vec2 cloudUV = dir.xz / (dir.y + 0.15);
    vec2 cloudPos = cloudUV * 0.75 + vec2(uTime * 0.015, uTime * 0.005);
    float cloudNoise = fbm(cloudPos);

    float cloudMask = smoothstep(1.0 - uCloudCover, 1.0 - uCloudCover + 0.25, cloudNoise);
    cloudMask *= smoothstep(0.03, 0.2, dir.y); // Fade out near horizon

    vec3 cloudLit = mix(uCloudColor * 0.85, uDiscColor, halo * 0.5);
    finalColor = mix(finalColor, cloudLit, cloudMask * 0.75);
  }

  // 5. Horizon fog blending
  if (dir.y < 0.08) {
    float horizonFog = smoothstep(0.08, 0.0, dir.y);
    finalColor = mix(finalColor, uSkyHorizon, horizonFog * 0.6);
  }

  gl_FragColor = vec4(finalColor, 1.0);

  #include <colorspace_fragment>
}
