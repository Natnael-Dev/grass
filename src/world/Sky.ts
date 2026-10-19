import * as THREE from 'three';
import type { MoodState } from './MoodController';
import skyVert from './shaders/sky.vert.glsl?raw';
import skyFrag from './shaders/sky.frag.glsl?raw';

export class Sky {
  public readonly mesh: THREE.Mesh;
  public readonly material: THREE.ShaderMaterial;
  private readonly geometry: THREE.SphereGeometry;

  // Direct typed uniform references for zero lookup overhead and type safety
  public readonly uSkyTop = { value: new THREE.Color('#5b8fd0') };
  public readonly uSkyMid = { value: new THREE.Color('#f0b27a') };
  public readonly uSkyHorizon = { value: new THREE.Color('#ffd89a') };
  public readonly uDiscColor = { value: new THREE.Color('#fff3c4') };
  public readonly uSunDir = { value: new THREE.Vector3() };
  public readonly uDiscSize = { value: 0.036 };
  public readonly uHalo = { value: 0.45 };
  public readonly uCloudColor = { value: new THREE.Color('#fff0d8') };
  public readonly uCloudCover = { value: 0.4 };
  public readonly uStarsAmount = { value: 0.0 };
  public readonly uFogColor = { value: new THREE.Color('#f3cf9f') };
  public readonly uTime = { value: 0.0 };

  constructor() {
    this.geometry = new THREE.SphereGeometry(400, 32, 24);
    this.setSunDirection(14, 30);

    this.material = new THREE.ShaderMaterial({
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSkyTop: this.uSkyTop,
        uSkyMid: this.uSkyMid,
        uSkyHorizon: this.uSkyHorizon,
        uDiscColor: this.uDiscColor,
        uSunDir: this.uSunDir,
        uDiscSize: this.uDiscSize,
        uHalo: this.uHalo,
        uCloudColor: this.uCloudColor,
        uCloudCover: this.uCloudCover,
        uStarsAmount: this.uStarsAmount,
        uFogColor: this.uFogColor,
        uTime: this.uTime,
      },
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.renderOrder = -10;
    this.mesh.frustumCulled = false;
  }

  public update(time: number, cameraPos?: THREE.Vector3): void {
    this.uTime.value = time;
    if (cameraPos) {
      this.mesh.position.copy(cameraPos);
    }
  }

  public setSunDirection(elevationDeg: number, azimuthDeg: number): void {
    const elevRad = THREE.MathUtils.degToRad(elevationDeg);
    const azRad = THREE.MathUtils.degToRad(azimuthDeg);
    this.uSunDir.value
      .set(
        Math.cos(elevRad) * Math.sin(azRad),
        Math.sin(elevRad),
        -Math.cos(elevRad) * Math.cos(azRad),
      )
      .normalize();
  }

  public getSunDirection(): THREE.Vector3 {
    return this.uSunDir.value;
  }

  public applyMood(mood: MoodState): void {
    this.uSkyTop.value.copy(mood.skyTop);
    this.uSkyMid.value.copy(mood.skyMid);
    this.uSkyHorizon.value.copy(mood.skyHorizon);
    this.uDiscColor.value.copy(mood.discColor);
    this.uSunDir.value.copy(mood.discDir);
    this.uDiscSize.value = mood.discSize;
    this.uHalo.value = mood.discHalo;
    this.uCloudColor.value.copy(mood.cloudColor);
    this.uCloudCover.value = mood.cloudCover;
    this.uStarsAmount.value = mood.starsAmount;
    this.uFogColor.value.copy(mood.fogColor);
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
