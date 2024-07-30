import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { RenderPipeline } from "./render-pipeline";
import { AssetManager } from "./asset-manager";
import { Agent } from "./agent";

interface GridCell {
  posX: number;
  posZ: number;
  obstacle: boolean;
  object: THREE.Object3D;
}

export class GameState {
  private renderPipeline: RenderPipeline;
  private clock = new THREE.Clock();

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera();
  private controls: OrbitControls;

  private mouseNdc = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();

  private floorMaterial: THREE.MeshLambertMaterial;
  private obstacleMaterial: THREE.MeshLambertMaterial;
  private gridSize = 10;
  private grid: GridCell[][] = [];
  private floorCells: GridCell[] = [];

  private agent: Agent;

  constructor(private assetManager: AssetManager) {
    // Scene
    this.setupCamera();
    this.renderPipeline = new RenderPipeline(this.scene, this.camera);

    this.setupLights();

    this.controls = new OrbitControls(this.camera, this.renderPipeline.canvas);
    this.controls.enableDamping = true;
    this.controls.target.set(this.gridSize / 2, 0, this.gridSize / 2);

    this.scene.background = new THREE.Color("#1680AF");

    // Agent
    this.agent = new Agent(this.assetManager);

    // Grid
    this.floorMaterial = new THREE.MeshLambertMaterial({
      map: this.assetManager.textures.get("floor-black"),
    });

    const obstacleTexture = this.assetManager.textures.get("obstacle-orange");
    obstacleTexture.wrapS = THREE.RepeatWrapping;
    obstacleTexture.wrapT = THREE.RepeatWrapping;
    obstacleTexture.repeat = new THREE.Vector2(1, 3);
    this.obstacleMaterial = new THREE.MeshLambertMaterial({
      map: obstacleTexture,
    });

    // Starting grid
    this.buildGrid(this.gridSize);
    this.displayGrid(this.grid);

    // Start game
    this.update();
  }

  generateGrid = () => {
    console.log("generate grid");
    this.removeAgent();
    this.disposeGrid(this.grid);
    this.buildGrid(this.gridSize);
    this.displayGrid(this.grid);
  };

  startPlacingAgent = () => {
    // Clear up previous agent

    // Add the agent model to the scene out of view
    this.agent.model.position.set(0, 200, 0);
    this.agent.playAnimation("idle");
    this.scene.add(this.agent.model);

    // Start intersecting the floor
    window.addEventListener("mousemove", this.onMouseMove);
    // Listen for clicks
    window.addEventListener("click", this.placeAgentClick);
  };

  private setupCamera() {
    this.camera.fov = 75;
    this.camera.far = 500;
    this.camera.position.set(this.gridSize + 5, 10, this.gridSize + 5);
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(undefined, Math.PI);
    this.scene.add(ambientLight);

    const directLight = new THREE.DirectionalLight(undefined, Math.PI);
    directLight.position.copy(new THREE.Vector3(0.75, 1, 0.75).normalize());
    this.scene.add(directLight);
  }

  private buildGrid(gridSize: number) {
    const grid: GridCell[][] = [];
    // We only intersect against floors when placing agents and routes,
    // So we pull out the floor cells once to avoid re-iterating the grid later
    const floorCells: GridCell[] = [];

    for (let z = 0; z < gridSize; z++) {
      // Init the array for this row
      grid[z] = [];

      for (let x = 0; x < gridSize; x++) {
        // Random chance of being an obstacle
        const obstacle = Math.random() > 0.8;

        let cell: GridCell | undefined;
        if (obstacle) {
          cell = this.createObstacleCell(x, z);
        } else {
          cell = this.createFloorCell(x, z);
          floorCells.push(cell);
        }

        grid[z][x] = cell;
      }
    }

    // Assign the new grid and floor cells
    this.grid = grid;
    this.floorCells = floorCells;
  }

  private createFloorCell(x: number, z: number): GridCell {
    const object = new THREE.Mesh(new THREE.BoxGeometry(), this.floorMaterial);

    object.position.set(x, -0.5, z); // offset y so that top of box is at 0

    return {
      posX: x,
      posZ: z,
      obstacle: false,
      object,
    };
  }

  private createObstacleCell(x: number, z: number): GridCell {
    const object = new THREE.Mesh(
      new THREE.BoxGeometry(1, 3, 1),
      this.obstacleMaterial
    );

    object.position.set(x, 0.5, z); // offset y so bottom matches floors

    return {
      posX: x,
      posZ: z,
      obstacle: true,
      object,
    };
  }

  private displayGrid(grid: GridCell[][]) {
    grid.forEach((row) => row.forEach((cell) => this.scene.add(cell.object)));
  }

  private disposeGrid(grid: GridCell[][]) {
    grid.forEach((row) =>
      row.forEach((cell) => this.scene.remove(cell.object))
    );
  }

  private removeAgent() {
    this.scene.remove(this.agent.model);
  }

  private update = () => {
    requestAnimationFrame(this.update);

    const dt = this.clock.getDelta();

    this.controls.update();

    this.agent?.update(dt);

    this.renderPipeline.render(dt);
  };

  private onMouseMove = (e: MouseEvent) => {
    this.mouseNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseNdc, this.camera);

    for (const floorCell of this.floorCells) {
      const intersections = this.raycaster.intersectObject(
        floorCell.object,
        false
      );
      if (intersections.length) {
        // Outline
        this.renderPipeline.clearOutlines();
        this.renderPipeline.outlineObject(floorCell.object);

        // Place agent at the center of this grid cell
        this.agent.model.position.set(floorCell.posX, 0, floorCell.posZ);

        break;
      }
    }
  };

  private placeAgentClick = () => {
    // Stop moving agent with mouse
    window.removeEventListener("mousemove", this.onMouseMove);
    this.renderPipeline.clearOutlines();
  };
}
