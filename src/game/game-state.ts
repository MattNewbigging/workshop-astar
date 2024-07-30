import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { RenderPipeline } from "./render-pipeline";
import { AnimatedCharacter } from "./animated-character";
import { AssetManager } from "./asset-manager";
import { GridBuilder } from "./grid-builder";

export class GameState {
  private renderPipeline: RenderPipeline;
  private clock = new THREE.Clock();

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera();
  private controls: OrbitControls;

  private animatedCharacter: AnimatedCharacter;

  private mouseNdc = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();

  constructor(private assetManager: AssetManager) {
    this.setupCamera();
    this.renderPipeline = new RenderPipeline(this.scene, this.camera);

    this.setupLights();

    this.controls = new OrbitControls(this.camera, this.renderPipeline.canvas);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1, 0);

    this.scene.background = new THREE.Color("#1680AF");

    this.animatedCharacter = this.setupAnimatedCharacter();
    this.animatedCharacter.playAnimation("idle");
    //this.scene.add(this.animatedCharacter.object);

    this.setupGrid();

    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mousedown", this.onMouseDown);

    // Start game
    this.update();
  }

  private setupCamera() {
    this.camera.fov = 75;
    this.camera.far = 500;
    this.camera.position.set(0, 1.5, 3);
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(undefined, Math.PI);
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
    // Materials
    const cubeMat = new THREE.MeshPhongMaterial({
      map: this.assetManager.textures.get("floor-black"),
    });

    const obstacleTexture = this.assetManager.textures.get("obstacle-orange");
    obstacleTexture.wrapS = THREE.RepeatWrapping;
    obstacleTexture.wrapT = THREE.RepeatWrapping;
    obstacleTexture.repeat = new THREE.Vector2(1, 3);
    const obstacleMat = new THREE.MeshPhongMaterial({
      map: obstacleTexture,
    });

    const builder = new GridBuilder();

    builder.grid.forEach((row) =>
      row.forEach((colCell) => {
        const { posX, posZ, obstacle } = colCell;

        const height = obstacle ? 3 : 1;

        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(1, height, 1),
          obstacle ? obstacleMat : cubeMat
        );

        const posY = obstacle ? height / 2 - 1 : -0.5;
        cube.position.set(posX, posY, posZ);

        this.scene.add(cube);
      })
    );
  }

  private update = () => {
    requestAnimationFrame(this.update);

    const dt = this.clock.getDelta();

    this.controls.update();

    this.animatedCharacter.update(dt);

    this.renderPipeline.render(dt);
  };

  private onMouseMove = (e: MouseEvent) => {
    this.mouseNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseNdc, this.camera);

    this.renderPipeline.clearOutlines();

    const intersections = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );
    if (intersections.length) {
      const object = intersections[0].object;
      this.renderPipeline.outlineObject(object);
    }
  };

  private onMouseDown = (e: MouseEvent) => {
    this.raycaster.setFromCamera(this.mouseNdc, this.camera);

    const intersections = this.raycaster.intersectObjects(
      this.scene.children,
      false
    );
    if (intersections.length) {
      const intersection = intersections[0];
      // Need to only select the grid-node for this cube
      const node = intersection.object.position.clone();
      node.y = 0;
      //
    }
  };
}
