import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { RenderPipeline } from "./render-pipeline";
import { AnimatedCharacter } from "./animated-character";
import { AssetManager } from "./asset-manager";

export class GameState {
  private renderPipeline: RenderPipeline;
  private clock = new THREE.Clock();

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera();
  private controls: OrbitControls;

  private animatedCharacter: AnimatedCharacter;

  private gridSize = 10;

  constructor(private assetManager: AssetManager) {
    this.setupCamera();
    this.renderPipeline = new RenderPipeline(this.scene, this.camera);

    this.setupLights();

    this.controls = new OrbitControls(this.camera, this.renderPipeline.canvas);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1, 0);

    this.scene.background = new THREE.Color("#1680AF");

    this.animatedCharacter = this.setupAnimatedCharacter();
    this.scene.add(this.animatedCharacter.object);
    this.animatedCharacter.playAnimation("idle");

    this.setupGrid();

    // Start game
    this.update();
  }

  private setupCamera() {
    this.camera.fov = 75;
    this.camera.far = 500;
    this.camera.position.set(0, 1.5, 3);
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(undefined, 2);
    this.scene.add(ambientLight);

    const directLight = new THREE.DirectionalLight(undefined, Math.PI);
    directLight.position.copy(new THREE.Vector3(0.75, 1, 0.75).normalize());
    this.scene.add(directLight);
  }

  private setupAnimatedCharacter(): AnimatedCharacter {
    const object = this.assetManager.models.get("dummy");
    this.assetManager.applyModelTexture(object, "dummy");

    const mixer = new THREE.AnimationMixer(object);
    const actions = new Map<string, THREE.AnimationAction>();
    const idleClip = this.assetManager.animations.get("idle");
    if (idleClip) {
      const idleAction = mixer.clipAction(idleClip);
      actions.set("idle", idleAction);
    }

    return new AnimatedCharacter(object, mixer, actions);
  }

  private setupGrid() {
    // Default cube material
    const cubeMat = new THREE.MeshBasicMaterial({
      map: this.assetManager.textures.get("floor-black"),
    });

    // Create a grid of cubes
    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        const cube = new THREE.Mesh(new THREE.BoxGeometry(), cubeMat);
        cube.position.set(x, -0.5, z);
        this.scene.add(cube);
      }
    }
  }

  private update = () => {
    requestAnimationFrame(this.update);

    const dt = this.clock.getDelta();

    this.controls.update();

    this.animatedCharacter.update(dt);

    this.renderPipeline.render(dt);
  };
}
