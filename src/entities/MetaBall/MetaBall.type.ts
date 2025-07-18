export interface MetaBallCircle {
  x: number;
  y: number;
  radius: number;
  id?: string;
}

export interface MetaBallOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  backgroundColor?: string;
  threshold?: number; // 메타볼 연결 임계값 (0.0 ~ 1.0)
  smooth?: number; // 부드러운 정도 (0.0 ~ 1.0)
  circles?: MetaBallCircle[];
}

export interface MetaBallEvents {
  onCircleAdd?: (circle: MetaBallCircle) => void;
  onCircleMove?: (circle: MetaBallCircle) => void;
  onCircleRemove?: (circleId: string) => void;
}

export interface WebGLProgramInfo {
  program: WebGLProgram;
  attribLocations: {
    vertexPosition: number;
  };
  uniformLocations: {
    resolution: WebGLUniformLocation | null;
    circles: WebGLUniformLocation | null;
    circleCount: WebGLUniformLocation | null;
    threshold: WebGLUniformLocation | null;
    smooth: WebGLUniformLocation | null;
    backgroundColor: WebGLUniformLocation | null;
  };
} 