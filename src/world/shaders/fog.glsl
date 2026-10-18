// Exponential squared fog calculation (exp2)
// Matches scene fog across terrain, grass, ridges, and tree

vec3 applyFog(vec3 color, float dist, vec3 fogColor, float fogDensity) {
  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * dist * dist);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  return mix(color, fogColor, fogFactor);
}
