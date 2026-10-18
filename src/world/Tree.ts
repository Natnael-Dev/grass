import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TREE_COORDS } from './terrain';
import treeVert from './shaders/tree.vert.glsl?raw';
import treeFrag from './shaders/tree.frag.glsl?raw';

export class Tree {
  public readonly mesh: THREE.Mesh;
  public readonly geometry: THREE.BufferGeometry;
  public readonly material: THREE.ShaderMaterial;

  public readonly uTime = { value: 0.0 };
  public readonly uWindDir = { value: new THREE.Vector2(1.0, 0.2).normalize() };
  public readonly uWindStrength = { value: 0.9 };
  public readonly uLightColor = { value: new THREE.Color('#ffcf8a') };
  public readonly uLightIntensity = { value: 1.1 };
  public readonly uAmbientColor = { value: new THREE.Color('#a8a0b0') };
  public readonly uAmbientIntensity = { value: 0.6 };
  public readonly uSunDir = { value: new THREE.Vector3(0.485, 0.242, -0.84).normalize() };
  public readonly uFogColor = { value: new THREE.Color('#f3cf9f') };
  public readonly uFogDensity = { value: 0.016 };

  constructor() {
    this.geometry = this.buildTreeGeometry();

    this.material = new THREE.ShaderMaterial({
      vertexShader: treeVert,
      fragmentShader: treeFrag,
      uniforms: {
        uTime: this.uTime,
        uWindDir: this.uWindDir,
        uWindStrength: this.uWindStrength,
        uLightColor: this.uLightColor,
        uLightIntensity: this.uLightIntensity,
        uAmbientColor: this.uAmbientColor,
        uAmbientIntensity: this.uAmbientIntensity,
        uSunDir: this.uSunDir,
        uFogColor: this.uFogColor,
        uFogDensity: this.uFogDensity,
      },
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(TREE_COORDS.x, TREE_COORDS.y, TREE_COORDS.z);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
  }

  private buildTreeGeometry(): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];

    // 1. Tapered Trunk
    const trunk = new THREE.CylinderGeometry(0.2, 0.42, 3.4, 6).toNonIndexed();
    trunk.translate(0, 1.7, 0);

    const trunkColor = new THREE.Color('#38281d');
    const trunkColors = new Float32Array(trunk.attributes.position!.count * 3);
    for (let i = 0; i < trunk.attributes.position!.count; i++) {
      trunkColors[i * 3] = trunkColor.r;
      trunkColors[i * 3 + 1] = trunkColor.g;
      trunkColors[i * 3 + 2] = trunkColor.b;
    }
    trunk.setAttribute('color', new THREE.BufferAttribute(trunkColors, 3));
    geometries.push(trunk);

    // 2. Foliage clusters (6 low-poly icosahedra)
    const clusters = [
      { r: 1.5, pos: [0.0, 3.6, 0.0] as const },
      { r: 1.25, pos: [0.2, 4.6, -0.1] as const },
      { r: 1.2, pos: [-1.0, 3.3, 0.2] as const },
      { r: 1.15, pos: [1.1, 3.5, -0.1] as const },
      { r: 1.0, pos: [0.1, 3.0, 0.9] as const },
      { r: 0.95, pos: [-0.3, 4.2, -0.7] as const },
    ];

    const baseFoliageColor = new THREE.Color('#274328');
    const topFoliageColor = new THREE.Color('#41683b');
    const tempColor = new THREE.Color();

    for (const cluster of clusters) {
      const foliage = new THREE.IcosahedronGeometry(cluster.r, 1);
      foliage.translate(cluster.pos[0], cluster.pos[1], cluster.pos[2]);

      const pos = foliage.attributes.position!;
      const colors = new Float32Array(pos.count * 3);

      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const t = THREE.MathUtils.clamp((y - 2.5) / 3.0, 0, 1);
        tempColor.lerpColors(baseFoliageColor, topFoliageColor, t);

        colors[i * 3] = tempColor.r;
        colors[i * 3 + 1] = tempColor.g;
        colors[i * 3 + 2] = tempColor.b;
      }

      foliage.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometries.push(foliage);
    }

    const merged = mergeGeometries(geometries, false);
    if (!merged) {
      throw new Error('Failed to merge tree geometries');
    }

    merged.computeVertexNormals();
    merged.computeBoundingBox();
    merged.computeBoundingSphere();

    // Clean up temporary geometries
    for (const g of geometries) {
      g.dispose();
    }

    return merged;
  }

  public update(time: number): void {
    this.uTime.value = time;
  }

  public setSunDirection(sunDir: THREE.Vector3): void {
    this.uSunDir.value.copy(sunDir);
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
