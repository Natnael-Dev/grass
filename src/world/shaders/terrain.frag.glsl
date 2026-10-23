precision highp float;

uniform vec3 uTerrainColor;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;
uniform vec3 uSunDir;
uniform vec3 uFogColor;
uniform float uFogDensity;

varying vec3 vWorldPos;
varying vec3 vNormal;

// Exponential squared fog calculation (exp2)
vec3 applyFog(vec3 color, float dist, vec3 fogColor, float fogDensity) {
  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * dist * dist);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  return mix(color, fogColor, fogFactor);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uSunDir);

  // Directional diffuse and calibrated ambient for distinct terrain hill shadows
  float nDotL = max(0.0, dot(normal, lightDir));
  vec3 direct = uLightColor * (uLightIntensity * nDotL);
  vec3 ambient = uAmbientColor * (uAmbientIntensity * 0.4);
  vec3 litColor = uTerrainColor * (direct + ambient);

  // Fog blending with distance from camera
  float dist = length(vWorldPos - cameraPosition);
  vec3 finalColor = applyFog(litColor, dist, uFogColor, uFogDensity);

  gl_FragColor = vec4(finalColor, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
