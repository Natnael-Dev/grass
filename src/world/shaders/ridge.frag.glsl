precision highp float;

uniform vec3 uColor;
uniform vec3 uFogColor;
uniform float uFogDensity;

varying vec3 vWorldPos;

vec3 applyFog(vec3 color, float dist, vec3 fogColor, float fogDensity) {
  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * dist * dist);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  return mix(color, fogColor, fogFactor);
}

void main() {
  float dist = length(vWorldPos - cameraPosition);
  vec3 finalColor = applyFog(uColor, dist, uFogColor, uFogDensity);
  gl_FragColor = vec4(finalColor, 1.0);

  #include <colorspace_fragment>
}
