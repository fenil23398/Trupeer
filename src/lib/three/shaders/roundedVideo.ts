export const roundedVideoVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const roundedVideoFragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uRadius;
  uniform vec2 uSize;
  varying vec2 vUv;

  float roundedBoxSDF(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 uv = vUv;
    vec2 pos = (uv - 0.5) * uSize;
    float dist = roundedBoxSDF(pos, uSize * 0.5, uRadius);

    if (dist > 0.0) {
      discard;
    }

    gl_FragColor = texture2D(uTexture, uv);
  }
`;
