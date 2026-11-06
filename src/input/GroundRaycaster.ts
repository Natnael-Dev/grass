import * as THREE from 'three';
import { terrainHeight } from '../world/terrain';

export class GroundRaycaster {
  private readonly raycaster = new THREE.Raycaster();
  private readonly scratchRay = new THREE.Ray();
  private readonly scratchNdc = new THREE.Vector2();
  private readonly scratchVec = new THREE.Vector3();
  private readonly hitResult = new THREE.Vector3();

  // Single-frame cache to prevent redundant evaluations
  private lastFrameId = -1;
  private lastNdcX = Number.NaN;
  private lastNdcY = Number.NaN;
  private lastResult: THREE.Vector3 | null = null;

  /**
   * Cast a ray from camera through pointer NDC coordinates (-1 to 1).
   * Steps 0.5m along ray up to 120m until ray.y <= terrainHeight, then executes
   * 6 binary refinement iterations for millimeter accuracy.
   * Returns null if pointing at the sky.
   */
  public intersect(
    camera: THREE.Camera,
    ndcX: number,
    ndcY: number,
    frameId?: number,
  ): THREE.Vector3 | null {
    if (
      frameId !== undefined &&
      frameId === this.lastFrameId &&
      ndcX === this.lastNdcX &&
      ndcY === this.lastNdcY
    ) {
      return this.lastResult;
    }

    this.scratchNdc.set(ndcX, ndcY);
    this.raycaster.setFromCamera(this.scratchNdc, camera);
    const result = this.intersectRay(this.raycaster.ray);

    if (frameId !== undefined) {
      this.lastFrameId = frameId;
      this.lastNdcX = ndcX;
      this.lastNdcY = ndcY;
      this.lastResult = result;
    }

    return result;
  }

  /**
   * Directly intersect a 3D ray with the analytic terrain height field.
   */
  public intersectRay(ray: THREE.Ray): THREE.Vector3 | null {
    this.scratchRay.copy(ray);

    const step = 0.5;
    const maxDist = 120.0;
    let tPrev = 0.1;
    let tCurr = 0.1;
    let hasCrossing = false;

    // 1. Ray march along ray until ray.y <= terrainHeight
    while (tCurr <= maxDist) {
      this.scratchRay.at(tCurr, this.scratchVec);
      const h = terrainHeight(this.scratchVec.x, this.scratchVec.z);

      if (this.scratchVec.y <= h) {
        hasCrossing = true;
        break;
      }

      tPrev = tCurr;
      tCurr += step;
    }

    if (!hasCrossing) {
      return null;
    }

    // 2. 6 iterations of binary refinement
    let low = tPrev;
    let high = tCurr;

    for (let i = 0; i < 6; i++) {
      const mid = (low + high) * 0.5;
      this.scratchRay.at(mid, this.scratchVec);
      const h = terrainHeight(this.scratchVec.x, this.scratchVec.z);

      if (this.scratchVec.y <= h) {
        high = mid;
      } else {
        low = mid;
      }
    }

    const hitT = (low + high) * 0.5;
    this.scratchRay.at(hitT, this.hitResult);
    // Exact snap to analytic surface height
    this.hitResult.y = terrainHeight(this.hitResult.x, this.hitResult.z);

    return this.hitResult;
  }
}
