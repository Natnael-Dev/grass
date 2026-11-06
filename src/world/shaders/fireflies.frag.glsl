uniform vec3 uColor;

varying float vBlink;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float r = length(coord);
  if (r > 0.5) discard;

  float intensity = pow(clamp(1.0 - r * 2.0, 0.0, 1.0), 2.0);
  float alpha = intensity * vBlink * vAlpha;
  if (alpha < 0.005) discard;

  gl_FragColor = vec4(uColor, alpha);
}
