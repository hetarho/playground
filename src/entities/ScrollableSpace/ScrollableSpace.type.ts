export interface ScrollableSpaceOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  backgroundColor?: string;
  cameraPosition?: { x: number; y: number; z: number };
  scrollSensitivity?: number;
  minZ?: number;
  maxZ?: number;
}

export interface ScrollableSpaceEvents {
  onScroll?: (position: number) => void;
  onPositionChange?: (x: number, y: number, z: number) => void;
}

export interface ScrollableSpaceState {
  isInitialized: boolean;
  currentZ: number;
  targetZ: number;
  isAnimating: boolean;
} 