precision highp float;

uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;
uniform vec3 uSunDir;
uniform vec3 uFogColor;
uniform float uFogDensity;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vColor;

vec3 applyFog(vec3 color, float dist, vec3 fogColor, float fogDensity) {
  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * dist * dist);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  return mix(color, fogColor, fogFactor);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uSunDir);

  // Soft wrap diffuse for stylized painterly shading
  float nDotL = dot(normal, lightDir);
  float wrap = max(0.0, nDotL * 0.6 + 0.4);
  vec3 direct = uLightColor * (uLightIntensity * wrap);
  vec3 ambient = uAmbientColor * uAmbientIntensity;
  vec3 lit = vColor * (direct + ambient);

  // Gentle rim light for silhouette readability
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float rim = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0) * 0.25;
  lit += uLightColor * rim;

  // Atmospheric fog
  float dist = length(vWorldPos - cameraPosition);
  vec3 finalColor = applyFog(lit, dist, uFogColor, uFogDensity);

  gl_FragColor = vec4(finalColor, 1.0);

  #include <colorspace_fragment>
}
