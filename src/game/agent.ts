import * as THREE from "three";
import { AssetManager } from "./asset-manager";
import { GridCell } from "./game-state";

export class Agent {
  model: THREE.Object3D;
  currentCell?: GridCell;
  destinationCell?: GridCell;

  private mixer: THREE.AnimationMixer;
  private animations = new Map<string, THREE.AnimationAction>();
  private currentAction?: THREE.AnimationAction;

  constructor(private assetManager: AssetManager) {
    // Setup the model
    this.model = this.assetManager.models.get("dummy");
    this.assetManager.applyModelTexture(this.model, "dummy");

    // Setup animations
    this.mixer = new THREE.AnimationMixer(this.model);
    const idleClip = this.assetManager.animations.get("idle");
    const idleAction = this.mixer.clipAction(idleClip);
    this.animations.set(idleClip.name, idleAction);

    const walkClip = this.assetManager.animations.get("walk");
    const walkAction = this.mixer.clipAction(walkClip);
    this.animations.set(walkClip.name, walkAction);
  }

  update(dt: number) {
    this.mixer.update(dt);
  }

  playAnimation(name: string) {
    // Find the new action with the given name
    const nextAction = this.animations.get(name);
    if (!nextAction) {
      throw Error(
        "Could not find action with name " + name + "for character " + this
      );
    }

    // Reset the next action then fade to it from the current action
    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);

    this.currentAction
      ? nextAction.crossFadeFrom(this.currentAction, 0.25, false).play()
      : nextAction.play();

    // Next is now current
    this.currentAction = nextAction;
  }
}
