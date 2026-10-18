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
uniform float uTime;

varying vec3 vWorldDir;

// Simple procedural noise for painterly clouds
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

  // 2. Sun disc & soft atmospheric halo
  float sunDot = max(0.0, dot(dir, normalize(uSunDir)));
  float discThreshold = 1.0 - (uDiscSize * uDiscSize * 0.1);
  float sunDisc = smoothstep(discThreshold - 0.002, discThreshold, sunDot);

  // Soft atmospheric halo
  float halo = pow(sunDot, 18.0) * uHalo;
  vec3 sunGlow = uDiscColor * (sunDisc * 2.0 + halo);

  // 3. Painterly drifting clouds in the upper dome
  vec3 finalColor = skyColor + sunGlow;
  if (dir.y > 0.03 && uCloudCover > 0.01) {
    // Project direction onto planar cloud plane
    vec2 cloudUV = dir.xz / (dir.y + 0.15);
    vec2 cloudPos = cloudUV * 0.75 + vec2(uTime * 0.015, uTime * 0.005);
    float cloudNoise = fbm(cloudPos);

    // Shape clouds with cover threshold
    float cloudMask = smoothstep(1.0 - uCloudCover, 1.0 - uCloudCover + 0.25, cloudNoise);
    cloudMask *= smoothstep(0.03, 0.2, dir.y); // Fade out near horizon

    vec3 cloudLit = mix(uCloudColor * 0.85, uDiscColor, halo * 0.5);
    finalColor = mix(finalColor, cloudLit, cloudMask * 0.75);
  }

  gl_FragColor = vec4(finalColor, 1.0);

  #include <colorspace_fragment>
}
