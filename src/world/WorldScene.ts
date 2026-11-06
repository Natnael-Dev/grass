import * as THREE from 'three';
import { Sky } from './Sky';
import { Ridges } from './Ridges';
import { TerrainMesh } from './TerrainMesh';
import { Grass } from './Grass';
import { Tree } from './Tree';
import { Seeds } from './Seeds';
import { Fireflies } from './Fireflies';
import { MoodController } from './MoodController';
import { terrainHeight } from './terrain';
import type { MoodName, QualityTier } from '../core/types';

export interface WorldSceneOptions {
  tier: QualityTier;
  seed: number;
  reducedMotion: boolean;
  initialMood: MoodName;
}

export class WorldScene {
  public readonly scene: THREE.Scene;
  public readonly sky: Sky;
  public readonly ridges: Ridges;
  public readonly terrain: TerrainMesh;
  public readonly tree: Tree;
  public readonly grass: Grass;
  public readonly seeds: Seeds;
  public readonly fireflies: Fireflies;
  public readonly moodController: MoodController;

  private totalTime = 0;

  constructor(options: WorldSceneOptions) {
    this.scene = new THREE.Scene();
    this.moodController = new MoodController(options.initialMood);
    this.moodController.setReducedMotion(options.reducedMotion);

    this.sky = new Sky();
    this.ridges = new Ridges();
    this.terrain = new TerrainMesh();
    this.tree = new Tree();
    this.grass = new Grass({
      tier: options.tier,
      seed: options.seed,
    });
    this.grass.setReducedMotion(options.reducedMotion);

    this.seeds = new Seeds({ seed: options.seed });
    this.fireflies = new Fireflies({
      seed: options.seed,
      tier: options.tier,
    });
    this.fireflies.setReducedMotion(options.reducedMotion);

    this.scene.add(this.sky.mesh);
    this.scene.add(this.ridges.group);
    this.scene.add(this.terrain.mesh);
    this.scene.add(this.grass.mesh);
    this.scene.add(this.tree.mesh);
    this.scene.add(this.seeds.mesh);
    this.scene.add(this.fireflies.mesh);

    this.applyCurrentMood();
  }

  public applyCurrentMood(): void {
    const s = this.moodController.state;
    this.sky.applyMood(s);
    this.terrain.applyMood(s);
    this.grass.applyMood(s);
    this.ridges.applyMood(s);
    this.tree.applyMood(s);
  }

  public update(
    dt: number,
    cameraPos: THREE.Vector3,
    effectiveWindStrength: number,
    dpr: number,
  ): void {
    this.totalTime += dt;
    this.moodController.update(dt);
    if (this.moodController.state.isFading) {
      this.applyCurrentMood();
    }

    this.sky.update(dt);
    this.grass.uWindStrength.value = this.moodController.state.windStrength * effectiveWindStrength;
    this.grass.update(this.totalTime, cameraPos);
    this.seeds.update(
      dt,
      this.grass.uWindDir.value,
      effectiveWindStrength,
      this.moodController.state.lightColor,
      dpr,
    );
    this.fireflies.update(this.totalTime, this.moodController.state.firefliesAmount, dpr);
  }

  public setTier(tier: QualityTier): void {
    this.grass.setTier(tier);
    this.fireflies.setTier(tier);
  }

  public setReducedMotion(reduced: boolean): void {
    this.grass.setReducedMotion(reduced);
    this.fireflies.setReducedMotion(reduced);
    this.moodController.setReducedMotion(reduced);
  }

  public setMood(mood: MoodName, immediate = false): void {
    this.moodController.setMood(mood, immediate);
    if (immediate) {
      this.applyCurrentMood();
    }
  }

  public spawnSeeds(x: number, z: number, tier: QualityTier): void {
    const y = terrainHeight(x, z);
    this.seeds.spawn(x, y, z, tier);
  }

  public getSeedsCount(): number {
    return this.seeds.getActiveCount();
  }

  public getFirefliesCount(): number {
    return this.fireflies.getTierCount();
  }

  public dispose(): void {
    this.sky.dispose();
    this.ridges.dispose();
    this.terrain.dispose();
    this.tree.dispose();
    this.grass.dispose();
    this.seeds.dispose();
    this.fireflies.dispose();
  }
}
