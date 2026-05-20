import * as THREE from "three";
import {
  roundedVideoFragmentShader,
  roundedVideoVertexShader,
} from "./shaders/roundedVideo";

/** Sky blue from provided background.jpg — used if letterboxing ever appears */
const SCENE_CLEAR_COLOR = 0x00aeef;
const VIDEO_FADE_MS = 180;

export interface SceneStyle {
  padding: number;
  borderRadius: number;
}

export class SceneManager {
  private readonly canvas: HTMLCanvasElement;
  private readonly video: HTMLVideoElement;
  private readonly backgroundUrl: string;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private backgroundMesh!: THREE.Mesh;
  private videoMesh!: THREE.Mesh;
  private videoMaterial!: THREE.ShaderMaterial;
  private videoTexture!: THREE.VideoTexture;
  private backgroundTexture!: THREE.Texture;

  private width = 1;
  private height = 1;
  private padding = 32;
  private borderRadius = 32;
  private videoFadeStartedAt: number | null = null;
  private disposed = false;

  constructor(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    backgroundUrl: string
  ) {
    this.canvas = canvas;
    this.video = video;
    this.backgroundUrl = backgroundUrl;
  }

  async init(): Promise<void> {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(SCENE_CLEAR_COLOR, 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    this.camera.position.z = 1;

    this.backgroundTexture = await this.loadTexture(this.backgroundUrl);
    const bgGeometry = new THREE.PlaneGeometry(1, 1);
    const bgMaterial = new THREE.MeshBasicMaterial({
      map: this.backgroundTexture,
    });
    this.backgroundMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    this.scene.add(this.backgroundMesh);

    this.videoTexture = new THREE.VideoTexture(this.video);
    this.videoTexture.colorSpace = THREE.SRGBColorSpace;
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;

    this.videoMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.videoTexture },
        uRadius: { value: 0 },
        uOpacity: { value: 0 },
        uSize: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: roundedVideoVertexShader,
      fragmentShader: roundedVideoFragmentShader,
      transparent: true,
      depthWrite: false,
    });

    const videoGeometry = new THREE.PlaneGeometry(1, 1);
    this.videoMesh = new THREE.Mesh(videoGeometry, this.videoMaterial);
    this.videoMesh.visible =
      this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    this.scene.add(this.videoMesh);

    this.video.addEventListener("loadedmetadata", this.handleVideoMetadata);
    this.video.addEventListener("loadeddata", this.handleVideoData);
    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  private handleVideoMetadata = (): void => {
    this.updateLayout();
  };

  private handleVideoData = (): void => {
    this.revealVideo();
  };

  updateStyle(style: SceneStyle): void {
    this.padding = style.padding;
    this.borderRadius = style.borderRadius;
    this.updateLayout();
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;

    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);

    const aspect = width / height;
    this.camera.left = -aspect / 2;
    this.camera.right = aspect / 2;
    this.camera.top = 0.5;
    this.camera.bottom = -0.5;
    this.camera.updateProjectionMatrix();

    this.updateLayout();
  }

  render(): void {
    if (this.disposed) return;
    if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.revealVideo();
      this.updateVideoOpacity();
      this.videoTexture.needsUpdate = true;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.disposed = true;
    this.video.removeEventListener("loadedmetadata", this.handleVideoMetadata);
    this.video.removeEventListener("loadeddata", this.handleVideoData);
    this.videoTexture?.dispose();
    this.backgroundTexture?.dispose();
    this.videoMaterial?.dispose();
    this.backgroundMesh?.geometry.dispose();
    (this.backgroundMesh?.material as THREE.Material)?.dispose();
    this.videoMesh?.geometry.dispose();
    this.renderer?.dispose();
  }

  private getViewSize(): { width: number; height: number } {
    return {
      width: this.camera.right - this.camera.left,
      height: this.camera.top - this.camera.bottom,
    };
  }

  /** object-fit: cover — background fills canvas with no black bars */
  private updateBackgroundLayout(): void {
    const { width: viewW, height: viewH } = this.getViewSize();
    const image = this.backgroundTexture.image as
      | HTMLImageElement
      | undefined;
    const imgW = image?.width ?? 16;
    const imgH = image?.height ?? 9;
    const imgAspect = imgW / imgH;
    const viewAspect = viewW / viewH;

    let scaleW: number;
    let scaleH: number;

    if (viewAspect > imgAspect) {
      scaleW = viewW;
      scaleH = viewW / imgAspect;
    } else {
      scaleH = viewH;
      scaleW = viewH * imgAspect;
    }

    this.backgroundMesh.scale.set(scaleW, scaleH, 1);
    this.backgroundMesh.position.set(0, 0, 0);
  }

  private updateLayout(): void {
    if (!this.backgroundMesh || !this.videoMesh) return;

    this.updateBackgroundLayout();

    const { width: viewW, height: viewH } = this.getViewSize();

    const videoW = this.video.videoWidth || 16;
    const videoH = this.video.videoHeight || 9;
    const videoAspect = videoW / videoH;

    const paddingX = (this.padding / this.width) * viewW;
    const paddingY = (this.padding / this.height) * viewH;

    // Use one continuous sizing path for every padding value. The video first
    // fits the scene without cropping, then padding shrinks that fitted rect.
    // This avoids the visual jump between 0px and 1px padding.
    const baseRect = this.fitContain(viewW, viewH, videoAspect);
    const paddedRect = {
      width: Math.max(baseRect.planeW - paddingX * 2, 0.01),
      height: Math.max(baseRect.planeH - paddingY * 2, 0.01),
    };
    const { planeW, planeH } = this.fitContain(
      paddedRect.width,
      paddedRect.height,
      videoAspect
    );

    this.videoMesh.scale.set(planeW, planeH, 1);
    this.videoMesh.position.set(0, 0, 0.01);

    const minPlanePx = Math.min(planeW * this.width, planeH * this.height);
    const radiusPx = Math.min(this.borderRadius, minPlanePx * 0.5);
    const radiusNorm = radiusPx / minPlanePx;

    this.videoMaterial.uniforms.uRadius.value = Math.max(0, radiusNorm);
    this.videoMaterial.uniforms.uSize.value.set(planeW, planeH);
  }

  private revealVideo(): void {
    this.videoMesh.visible = true;
    this.videoFadeStartedAt ??= performance.now();
  }

  private updateVideoOpacity(): void {
    if (this.videoFadeStartedAt === null) return;

    const elapsed = performance.now() - this.videoFadeStartedAt;
    const opacity = Math.min(elapsed / VIDEO_FADE_MS, 1);
    this.videoMaterial.uniforms.uOpacity.value = opacity;
  }

  /** Fit inside the box — full video visible, no cropping */
  private fitContain(
    boxW: number,
    boxH: number,
    aspect: number
  ): { planeW: number; planeH: number } {
    let planeW = boxW;
    let planeH = planeW / aspect;
    if (planeH > boxH) {
      planeH = boxH;
      planeW = planeH * aspect;
    }
    return { planeW, planeH };
  }

  private loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }
}
