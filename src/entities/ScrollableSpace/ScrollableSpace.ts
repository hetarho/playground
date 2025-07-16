import * as THREE from "three";
import type {
  ScrollableSpaceOptions,
  ScrollableSpaceEvents,
  ScrollableSpaceState,
} from "./ScrollableSpace.type";

export class ScrollableSpace {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  private state: ScrollableSpaceState;
  private options: Required<ScrollableSpaceOptions>;
  private events: ScrollableSpaceEvents;

  private animationId: number | null = null;
  private boundScrollHandler: (event: WheelEvent) => void;

  constructor(
    options: ScrollableSpaceOptions,
    events: ScrollableSpaceEvents = {}
  ) {
    this.options = {
      backgroundColor: "#000000",
      cameraPosition: { x: 0, y: 0, z: 10 },
      scrollSensitivity: 0.1,
      minZ: -50,
      maxZ: 50,
      ...options,
    };

    this.events = events;
    this.canvas = options.canvas;

    this.state = {
      isInitialized: false,
      currentZ: this.options.cameraPosition.z,
      targetZ: this.options.cameraPosition.z,
      isAnimating: false,
    };

    this.boundScrollHandler = this.handleScroll.bind(this);

    this.init();
  }

  private init(): void {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.addSampleObjects();
    this.addEventListeners();
    this.startRenderLoop();

    this.state.isInitialized = true;
  }

  private createScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);

    // 기본 조명 추가
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);
  }

  private createCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.options.width / this.options.height,
      0.1,
      1000
    );

    this.camera.position.set(
      this.options.cameraPosition.x,
      this.options.cameraPosition.y,
      this.options.cameraPosition.z
    );
  }

  private createRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.setSize(this.options.width, this.options.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private addSampleObjects(): void {
    // 앞뒤로 배치할 샘플 객체들 생성
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7];

    for (let i = 0; i < 100; i++) {
      const geometry = new THREE.ConeGeometry(2, 3, 30);

      const material = new THREE.MeshLambertMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Z축으로 깊이감 있게 배치
      mesh.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 100
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      this.scene.add(mesh);
    }

    // 좌표계 도우미 추가
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    // 그리드 도우미 추가
    const gridHelper = new THREE.GridHelper(20, 20);
    gridHelper.position.y = -5;
    this.scene.add(gridHelper);
  }

  private addEventListeners(): void {
    this.canvas.addEventListener("wheel", this.boundScrollHandler, {
      passive: false,
    });
  }

  private handleScroll(event: WheelEvent): void {
    event.preventDefault();

    const delta = event.deltaY * this.options.scrollSensitivity;
    this.state.targetZ = THREE.MathUtils.clamp(
      this.state.targetZ + delta,
      this.options.minZ,
      this.options.maxZ
    );

    this.events.onScroll?.(this.state.targetZ);
  }

  private updateCameraPosition(): void {
    // 부드러운 카메라 이동을 위한 lerp
    const lerpFactor = 0.1;
    this.state.currentZ = THREE.MathUtils.lerp(
      this.state.currentZ,
      this.state.targetZ,
      lerpFactor
    );

    this.camera.position.z = this.state.currentZ;

    this.events.onPositionChange?.(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );

    // 애니메이션 상태 업데이트
    const threshold = 0.01;
    this.state.isAnimating =
      Math.abs(this.state.currentZ - this.state.targetZ) > threshold;
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      this.updateCameraPosition();
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  // Public methods
  public setPosition(z: number): void {
    this.state.targetZ = THREE.MathUtils.clamp(
      z,
      this.options.minZ,
      this.options.maxZ
    );
  }

  public getPosition(): { current: number; target: number } {
    return {
      current: this.state.currentZ,
      target: this.state.targetZ,
    };
  }

  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  public addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  public destroy(): void {
    // 이벤트 리스너 제거
    this.canvas.removeEventListener("wheel", this.boundScrollHandler);

    // 애니메이션 루프 중단
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Three.js 리소스 정리
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    this.state.isInitialized = false;
  }

  // Getters
  public get isInitialized(): boolean {
    return this.state.isInitialized;
  }

  public get isAnimating(): boolean {
    return this.state.isAnimating;
  }
}
