uniform float uTime;
uniform float uPixelRatio;
uniform float uAmount;

attribute vec4 aPhase;
attribute float aSize;
attribute vec2 aBlinkParams;

varying float vBlink;
varying float vAlpha;

void main() {
  float t = uTime;
  vec3 pos = position;

  // Smooth Lissajous wander around home position
  float sx = sin(t * 0.45 * aPhase.w + aPhase.x) * 1.4 + cos(t * 0.18 + aPhase.y) * 0.6;
  float sy = sin(t * 0.70 * aPhase.w + aPhase.y) * 0.45 + cos(t * 0.32 + aPhase.z) * 0.25;
  float sz = cos(t * 0.40 * aPhase.w + aPhase.z) * 1.2 + sin(t * 0.22 + aPhase.x) * 0.5;

  pos += vec3(sx, sy, sz);

  vec4 mvPosition = viewMatrix * modelMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation with distance
  float dist = max(-mvPosition.z, 0.1);
  gl_PointSize = clamp(aSize * uPixelRatio * (280.0 / dist), 1.0, 36.0);

  // Blink: smoothstep(0.55, 1.0, sin(t * f + phase))^2
  float wave = sin(t * aBlinkParams.x + aBlinkParams.y);
  float blink = smoothstep(0.55, 1.0, wave);
  vBlink = blink * blink;
  vAlpha = uAmount;
}
