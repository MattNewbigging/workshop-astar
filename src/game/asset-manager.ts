import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export class AssetManager {
  models = new Map();
  textures = new Map();
  animations = new Map();

  private loadingManager = new THREE.LoadingManager();

  applyModelTexture(model: THREE.Object3D, textureName: string) {
    const texture = this.textures.get(textureName);
    if (!texture) {
      return;
    }

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.map = texture;
      }
    });
  }

  load(): Promise<void> {
    const fbxLoader = new FBXLoader(this.loadingManager);
    const gltfLoader = new GLTFLoader(this.loadingManager);
    const textureLoader = new THREE.TextureLoader(this.loadingManager);

    this.loadModels(fbxLoader, gltfLoader);
    this.loadTextures(textureLoader);
    this.loadAnimations(fbxLoader);

    return new Promise((resolve) => {
      this.loadingManager.onLoad = () => {
        resolve();
      };
    });
  }

  private loadModels(fbxLoader: FBXLoader, gltfLoader: GLTFLoader) {
    // dummy character

    const dummy = new URL(
      "/models/SK_Character_Dummy_Male_01.fbx",
      import.meta.url
    ).href;
    fbxLoader.load(dummy, (group) => {
      group.scale.multiplyScalar(0.01);
      this.models.set("dummy", group);
    });
  }

  private loadTextures(textureLoader: THREE.TextureLoader) {
    // dummy texture
    const dummy = new URL(
      "/textures/PolygonPrototype_Texture_01.png",
      import.meta.url
    ).href;
    textureLoader.load(dummy, (texture) => this.textures.set("dummy", texture));
  }

  private loadAnimations(fbxLoader: FBXLoader) {
    const idleUrl = new URL("/anims/Idle.fbx", import.meta.url).href;
    fbxLoader.load(idleUrl, (group) => {
      if (group.animations.length) {
        const clip = group.animations[0];
        clip.name = "idle";
        this.animations.set(clip.name, clip);
      }
    });

    const walk = new URL("/anims/Walking.fbx", import.meta.url).href;
    fbxLoader.load(walk, (group) => {
      if (group.animations.length) {
        const clip = group.animations[0];
        clip.name = "walk";
        this.animations.set(clip.name, clip);
      }
    });
  }
}
