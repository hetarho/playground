export interface MetaBallCircle {
  x: number;
  y: number;
  radius: number;
  id?: string;
  color?: string; // HEX 문자열 (예: #22d3ee). 지정하지 않으면 기본 메타볼 색 사용
}

export interface MetaBallOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  backgroundColor?: string;
  threshold?: number; // 메타볼 연결 임계값 (0.0 ~ 1.0)
  smooth?: number; // 부드러운 정도 (0.0 ~ 1.0)
  falloff?: number; // 퍼짐 정도 조절(>1.0이면 좁아짐)
  useGaussian?: boolean; // 가우시안 커널 사용 여부(부드러운 그라디언트)
  // 애니메이션 옵션
  animate?: boolean; // 원 자동 이동 활성화
  speed?: number; // 픽셀/초 기준 기본 속도
  movement?: "bounce" | "wander"; // 벽 반사 또는 중심 주변 배회
  centerX?: number;
  centerY?: number;
  roamRadius?: number; // 중심으로부터의 최대 거리(원 경계 포함 제외하려면 radius 고려)
  randomTurnInterval?: number; // 초 단위, 방향을 랜덤하게 틀어줄 간격
  randomTurnAngle?: number; // 라디안, 한 번 틀 때 최대 각도
  // 중심점 이동 옵션
  centerMoveSpeed?: number; // px/sec, 중심이 랜덤하게 움직이는 속도
  centerRandomTurnInterval?: number; // 초 단위, 중심 방향 전환 주기
  centerRandomTurnAngle?: number; // 라디안, 중심 방향 전환 최대 각도
  centerPull?: number; // 0~1, 중심으로 당기는 비율( wander 모드 제어 )
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
    circleColors: WebGLUniformLocation | null;
    circleCount: WebGLUniformLocation | null;
    threshold: WebGLUniformLocation | null;
    smooth: WebGLUniformLocation | null;
    falloff: WebGLUniformLocation | null;
    useGaussian: WebGLUniformLocation | null;
    backgroundColor: WebGLUniformLocation | null;
  };
} 