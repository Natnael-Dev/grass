import * as THREE from 'three';
import ridgeVert from './shaders/ridge.vert.glsl?raw';
import ridgeFrag from './shaders/ridge.frag.glsl?raw';

interface RidgeConfig {
  z: number;
  color: string;
  baseElevation: number;
  crestFn: (x: number) => number;
}

export class Ridges {
  public readonly group: THREE.Group;
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.ShaderMaterial[] = [];

  public readonly uFogColor = { value: new THREE.Color('#f3cf9f') };
  public readonly uFogDensity = { value: 0.016 };

  public readonly uRidge1Color = { value: new THREE.Color('#8a9a7a') };
  public readonly uRidge2Color = { value: new THREE.Color('#b0a890') };
  public readonly uRidge3Color = { value: new THREE.Color('#d6bf9a') };

  constructor() {
    this.group = new THREE.Group();

    const configs: RidgeConfig[] = [
      {
        z: -160,
        color: '#8a9a7a',
        baseElevation: 12,
        crestFn: (x) =>
          12 +
          6.0 * Math.sin(x * 0.025 + 0.8) +
          3.5 * Math.sin(x * 0.055 + 2.1) +
          1.8 * Math.cos(x * 0.11 + 0.5),
      },
      {
        z: -230,
        color: '#b0a890',
        baseElevation: 26,
        crestFn: (x) =>
          26 +
          10.0 * Math.sin(x * 0.018 + 2.4) +
          5.5 * Math.cos(x * 0.042 + 1.2) +
          2.4 * Math.sin(x * 0.08 + 3.1),
      },
      {
        z: -310,
        color: '#d6bf9a',
        baseElevation: 44,
        crestFn: (x) =>
          44 +
          14.0 * Math.cos(x * 0.014 + 1.1) +
          7.5 * Math.sin(x * 0.031 + 4.2) +
          3.8 * Math.cos(x * 0.065 + 0.9),
      },
    ];

    const uniformColors = [this.uRidge1Color, this.uRidge2Color, this.uRidge3Color];

    configs.forEach((config, idx) => {
      const geometry = this.createRidgeRibbon(config.z, config.baseElevation, config.crestFn);
      this.geometries.push(geometry);

      const material = new THREE.ShaderMaterial({
        vertexShader: ridgeVert,
        fragmentShader: ridgeFrag,
        side: THREE.DoubleSide,
        depthWrite: true,
        uniforms: {
          uColor: uniformColors[idx]!,
          uFogColor: this.uFogColor,
          uFogDensity: this.uFogDensity,
        },
      });
      this.materials.push(material);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = -5 + idx;
      this.group.add(mesh);
    });
  }

  private createRidgeRibbon(
    z: number,
    _baseElevation: number,
    crestFn: (x: number) => number,
  ): THREE.BufferGeometry {
    const width = 600;
    const segments = 80;
    const halfWidth = width / 2;
    const bottomY = -20;

    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const x = -halfWidth + (i / segments) * width;
      const topY = crestFn(x);

      // Bottom vertex
      vertices.push(x, bottomY, z);
      // Top vertex
      vertices.push(x, topY, z);

      if (i < segments) {
        const b0 = i * 2;
        const t0 = i * 2 + 1;
        const b1 = (i + 1) * 2;
        const t1 = (i + 1) * 2 + 1;

        indices.push(b0, t0, b1);
        indices.push(t0, t1, b1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  }

  public dispose(): void {
    for (const g of this.geometries) {
      g.dispose();
    }
    for (const m of this.materials) {
      m.dispose();
    }
  }
}
