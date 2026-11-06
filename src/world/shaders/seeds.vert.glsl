uniform float uPixelRatio;

attribute float aAlpha;
attribute float aSize;

varying float vAlpha;

void main() {
  vAlpha = aAlpha;

  vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation with camera distance
  float dist = max(-mvPosition.z, 0.1);
  gl_PointSize = clamp(aSize * uPixelRatio * (280.0 / dist), 1.0, 64.0);
}
