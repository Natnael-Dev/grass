attribute vec3 color;

uniform float uTime;
uniform vec2 uWindDir;
uniform float uWindStrength;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vColor;

void main() {
  vColor = color;
  vNormal = normalize(normalMatrix * normal);

  // Gentle wind sway at crown, zero at trunk base
  vec3 localPos = position;
  float heightFactor = max(0.0, position.y);
  float sway = sin(uTime * 0.6 + heightFactor * 0.4) * 0.012 * pow(heightFactor, 1.4) * uWindStrength;
  localPos.x += sway * uWindDir.x;
  localPos.z += sway * uWindDir.y;

  vec4 worldPosition = modelMatrix * vec4(localPos, 1.0);
  vWorldPos = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
