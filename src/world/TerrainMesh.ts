import * as THREE from 'three';
import { terrainHeight, terrainNormal } from './terrain';
import terrainVert from './shaders/terrain.vert.glsl?raw';
import terrainFrag from './shaders/terrain.frag.glsl?raw';

export interface TerrainUniforms {
  uTerrainColor: { value: THREE.Color };
  uLightColor: { value: THREE.Color };
  uLightIntensity: { value: number };
  uAmbientColor: { value: THREE.Color };
  uAmbientIntensity: { value: number };
  uSunDir: { value: THREE.Vector3 };
  uFogColor: { value: THREE.Color };
  uFogDensity: { value: number };
}

export class TerrainMesh {
  public readonly mesh: THREE.Mesh;
  public readonly geometry: THREE.PlaneGeometry;
  public readonly material: THREE.ShaderMaterial;

  public readonly uTerrainColor = { value: new THREE.Color('#4a7a3a') };
  public readonly uLightColor = { value: new THREE.Color('#ffcf8a') };
  public readonly uLightIntensity = { value: 1.1 };
  public readonly uAmbientColor = { value: new THREE.Color('#a8a0b0') };
  public readonly uAmbientIntensity = { value: 0.6 };
  public readonly uSunDir = { value: new THREE.Vector3(0.485, 0.242, -0.84).normalize() };
  public readonly uFogColor = { value: new THREE.Color('#f3cf9f') };
  public readonly uFogDensity = { value: 0.016 };

  constructor() {
    this.geometry = new THREE.PlaneGeometry(160, 160, 128, 128);
    this.geometry.rotateX(-Math.PI / 2);
    this.geometry.translate(0, 0, -20);

    const pos = this.geometry.attributes.position;
    const nor = this.geometry.attributes.normal;

    if (!pos || !nor) {
      throw new Error('PlaneGeometry position or normal attribute is missing');
    }

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = terrainHeight(x, z);
      pos.setY(i, y);

      const normal = terrainNormal(x, z);
      nor.setXYZ(i, normal.x, normal.y, normal.z);
    }

    pos.needsUpdate = true;
    nor.needsUpdate = true;
    this.geometry.computeBoundingBox();
    this.geometry.computeBoundingSphere();

    this.material = new THREE.ShaderMaterial({
      vertexShader: terrainVert,
      fragmentShader: terrainFrag,
      uniforms: {
        uTerrainColor: this.uTerrainColor,
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
    this.mesh.receiveShadow = false;
    this.mesh.castShadow = false;
  }

  public setSunDirection(sunDir: THREE.Vector3): void {
    this.uSunDir.value.copy(sunDir);
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

// Alias for compatibility
export { TerrainMesh as Terrain };
