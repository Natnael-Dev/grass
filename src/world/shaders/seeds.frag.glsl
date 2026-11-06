uniform sampler2D uTexture;
uniform vec3 uColor;

varying float vAlpha;

void main() {
  vec4 tex = texture2D(uTexture, gl_PointCoord);
  float alpha = tex.a * vAlpha;
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(uColor * tex.rgb, alpha);
}
