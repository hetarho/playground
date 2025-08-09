import type { 
  MetaBallOptions, 
  MetaBallEvents, 
  MetaBallCircle,
  WebGLProgramInfo 
} from "./MetaBall.type";

export class MetaBall {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private programInfo: WebGLProgramInfo | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private circles: MetaBallCircle[] = [];
  private options: Required<MetaBallOptions>;
  private events: MetaBallEvents;
  private animationId: number | null = null;
  private lastTime: number | null = null;
  private velocities: Record<string, { vx: number; vy: number } > = {};
  private lastTurnAt: number = 0;
  private centerVel = { vx: 0, vy: 0 };
  private lastCenterTurnAt: number = 0;

  // 버텍스 셰이더 - 단순히 전체 화면 사각형을 그립니다
  private vertexShaderSource = `
    attribute vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
  `;

  // 프래그먼트 셰이더 - 메타볼 효과의 핵심
  private fragmentShaderSource = `
    precision mediump float;
    
    uniform vec2 uResolution;
    uniform vec3 uCircles[20]; // x, y, radius (최대 20개 원)
    uniform vec3 uCircleColors[20]; // 각 원의 색상 (sRGB 0..1)
    uniform int uCircleCount;
    uniform float uThreshold;
    uniform float uSmooth;
    uniform float uFalloff; // 퍼짐 제어(>1일수록 좁아짐)
    uniform bool uUseGaussian; // 가우시안 커널 사용 여부
    uniform vec3 uBackgroundColor;
    
    void main() {
      vec2 position = gl_FragCoord.xy / uResolution.xy;
      position.y = 1.0 - position.y; // Y 축 뒤집기
      
      float sum = 0.0;
      vec3 accumColor = vec3(0.0);
      
      // 모든 원에 대해 메타볼 필드 계산
      for(int i = 0; i < 20; i++) {
        if(i >= uCircleCount) break;
        
        vec2 circlePos = uCircles[i].xy / uResolution.xy;
        float radius = uCircles[i].z / min(uResolution.x, uResolution.y);
        
      float dist = distance(position, circlePos);
      
      // 필드 함수 선택: 표준 메타볼(1/r^2) 또는 가우시안(exp(-r^2))
      if(dist > 0.0) {
        float field;
        if (uUseGaussian) {
          // 정규화 좌표계에서 가우시안 커널: exp(-(d^2)/(2*sigma^2))
          float sigma = max(radius, 1e-4);
          float d2 = dist * dist;
          float s2 = sigma * sigma;
          field = exp(- d2 / (2.0 * s2));
        } else {
          field = (radius * radius) / (dist * dist);
        }
        sum += field;
        accumColor += field * uCircleColors[i];
      }
      }
      
      // 형상 마스크: 임계값 기준으로 부드럽게
      float alpha = smoothstep(uThreshold - uSmooth, uThreshold + uSmooth, sum);

      // 내부 그라디언트: 퍼짐(falloff)로 제어되는 연속 강도
      float k = (uFalloff > 0.0 ? uFalloff : 1.0) / max(uThreshold, 0.0001);
      float inner = 1.0 - exp(-sum * k);
      inner = sqrt(inner);

      // 원별 색상을 필드 가중치로 평균
      vec3 metaballColor = sum > 0.0 ? (accumColor / sum) : vec3(0.0);

      // 최종 색상 = 배경색과 (색 * 내부강도) 를 alpha로 혼합
      vec3 finalColor = mix(uBackgroundColor, metaballColor * inner, alpha);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  constructor(options: MetaBallOptions, events: MetaBallEvents = {}) {
    this.canvas = options.canvas;
    this.events = events;
    
    // 기본값 설정
    this.options = {
      canvas: options.canvas,
      width: options.width,
      height: options.height,
      backgroundColor: options.backgroundColor || "#000000",
      threshold: options.threshold || 1.0,
      smooth: options.smooth || 0.1,
      falloff: options.falloff ?? 1.0,
      useGaussian: options.useGaussian ?? false,
      animate: options.animate ?? false,
      speed: options.speed ?? 60,
      movement: options.movement ?? 'bounce',
      centerX: options.centerX ?? options.width / 2,
      centerY: options.centerY ?? options.height / 2,
      roamRadius: options.roamRadius ?? Math.min(options.width, options.height) * 0.35,
      randomTurnInterval: options.randomTurnInterval ?? 1.5,
      randomTurnAngle: options.randomTurnAngle ?? (Math.PI / 3),
      centerMoveSpeed: options.centerMoveSpeed ?? 40,
      centerRandomTurnInterval: options.centerRandomTurnInterval ?? 2.0,
      centerRandomTurnAngle: options.centerRandomTurnAngle ?? (Math.PI / 3),
      centerPull: options.centerPull ?? 0.5,
      circles: options.circles || []
    };

    this.circles = [...this.options.circles];
    // 초기 속도 부여
    for (const c of this.circles) {
      const id = c.id ?? (Math.random().toString(36).slice(2, 9));
      c.id = id;
      // wander 모드 초기 속도는 중심을 향한 성분을 섞어서 부여
      const base = this.options.speed / 60; // px/frame 기준 초기화
      if (this.options.movement === 'wander') {
        const cx = this.options.centerX;
        const cy = this.options.centerY;
        const angCenter = Math.atan2(cy - c.y, cx - c.x);
        const jitter = (Math.random() * 2 - 1) * (Math.PI / 6);
        const ang = angCenter + jitter;
        this.velocities[id] = { vx: Math.cos(ang) * base, vy: Math.sin(ang) * base };
      } else {
        const angle = Math.random() * Math.PI * 2;
        this.velocities[id] = { vx: Math.cos(angle) * base, vy: Math.sin(angle) * base };
      }

      // 시작 위치를 안전 영역으로 보정해 첫 프레임에 벽을 치는 현상 방지
      // 1) 캔버스 경계 안쪽으로 패딩
      const pad = 2;
      if (c.x - c.radius < pad) c.x = c.radius + pad;
      if (c.x + c.radius > this.options.width - pad) c.x = this.options.width - c.radius - pad;
      if (c.y - c.radius < pad) c.y = c.radius + pad;
      if (c.y + c.radius > this.options.height - pad) c.y = this.options.height - c.radius - pad;

      // 2) wander 모드면 로밍 반경 안으로 투영
      if (this.options.movement === 'wander') {
        const cx = this.options.centerX;
        const cy = this.options.centerY;
        const maxR = Math.max(10, this.options.roamRadius - c.radius - 4);
        const dx = c.x - cx;
        const dy = c.y - cy;
        const d = Math.hypot(dx, dy);
        if (d > maxR) {
          const nx = dx / d;
          const ny = dy / d;
          c.x = cx + nx * maxR;
          c.y = cy + ny * maxR;
        }
      }
    }

    // WebGL 컨텍스트 생성
    const gl = this.canvas.getContext('webgl');
    if (!gl) {
      throw new Error('WebGL을 지원하지 않는 브라우저입니다.');
    }
    this.gl = gl;

    this.init();
  }

  private init() {
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    
    this.gl.viewport(0, 0, this.options.width, this.options.height);
    
    // 셰이더 프로그램 초기화
    this.initShaderProgram();
    
    // 버퍼 초기화
    this.initBuffers();
    
    // 렌더링 시작
    this.render();
  }

  private initShaderProgram() {
    const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, this.vertexShaderSource);
    const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, this.fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      throw new Error('셰이더를 로드할 수 없습니다.');
    }

    const shaderProgram = this.gl.createProgram();
    if (!shaderProgram) {
      throw new Error('셰이더 프로그램을 생성할 수 없습니다.');
    }

    this.gl.attachShader(shaderProgram, vertexShader);
    this.gl.attachShader(shaderProgram, fragmentShader);
    this.gl.linkProgram(shaderProgram);

    if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
      throw new Error('셰이더 프로그램 링크 실패: ' + this.gl.getProgramInfoLog(shaderProgram));
    }

    this.programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      },
      uniformLocations: {
        resolution: this.gl.getUniformLocation(shaderProgram, 'uResolution'),
        circles: this.gl.getUniformLocation(shaderProgram, 'uCircles'),
        circleColors: this.gl.getUniformLocation(shaderProgram, 'uCircleColors'),
        circleCount: this.gl.getUniformLocation(shaderProgram, 'uCircleCount'),
        threshold: this.gl.getUniformLocation(shaderProgram, 'uThreshold'),
        smooth: this.gl.getUniformLocation(shaderProgram, 'uSmooth'),
        falloff: this.gl.getUniformLocation(shaderProgram, 'uFalloff'),
        useGaussian: this.gl.getUniformLocation(shaderProgram, 'uUseGaussian'),
        backgroundColor: this.gl.getUniformLocation(shaderProgram, 'uBackgroundColor'),
      },
    };
  }

  private loadShader(type: number, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('셰이더 컴파일 오류: ' + this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private initBuffers() {
    // 전체 화면을 덮는 사각형의 정점들
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0,
    ];

    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
  }

  private render = () => {
    if (!this.programInfo || !this.positionBuffer) return;

    // 위치 업데이트(애니메이션)
    if (this.options.animate) {
      const now = performance.now();
      const dt = this.lastTime ? (now - this.lastTime) / 1000 : 0; // sec
      this.lastTime = now;
      const speedScale = this.options.speed; // px/sec

      // 중심점 랜덤 워크 업데이트 (wander 모드에서만 의미 있음)
      if (this.options.movement === 'wander') {
        const centerSpeed = this.options.centerMoveSpeed;
        // 방향 랜덤 턴
        const nowSec = now / 1000;
        if (nowSec - this.lastCenterTurnAt > (this.options.centerRandomTurnInterval || 2.0)) {
          this.lastCenterTurnAt = nowSec;
          const jitter = (Math.random() * 2 - 1) * (this.options.centerRandomTurnAngle || (Math.PI / 3));
          const ang = Math.atan2(this.centerVel.vy, this.centerVel.vx) + jitter;
          const sp = Math.hypot(this.centerVel.vx, this.centerVel.vy) || centerSpeed;
          this.centerVel.vx = Math.cos(ang) * sp;
          this.centerVel.vy = Math.sin(ang) * sp;
        }
        // 이동
        this.options.centerX += this.centerVel.vx * dt;
        this.options.centerY += this.centerVel.vy * dt;
        // 경계 안으로 유지
        const margin = 40;
        if (this.options.centerX < margin) { this.options.centerX = margin; this.centerVel.vx = Math.abs(this.centerVel.vx); }
        if (this.options.centerX > this.options.width - margin) { this.options.centerX = this.options.width - margin; this.centerVel.vx = -Math.abs(this.centerVel.vx); }
        if (this.options.centerY < margin) { this.options.centerY = margin; this.centerVel.vy = Math.abs(this.centerVel.vy); }
        if (this.options.centerY > this.options.height - margin) { this.options.centerY = this.options.height - margin; this.centerVel.vy = -Math.abs(this.centerVel.vy); }
      }
      for (const c of this.circles) {
        if (!c.id) continue;
        const vel = this.velocities[c.id];
        if (!vel) continue;
        const step = (dt > 0 ? speedScale * dt : 0);
        // 단위 방향
        const mag = Math.hypot(vel.vx, vel.vy) || 1;
        const dirx = vel.vx / mag;
        const diry = vel.vy / mag;
        c.x += dirx * step;
        c.y += diry * step;

        if (this.options.movement === 'bounce') {
          // 벽에 닿으면 랜덤한 각도로 재설정
          const speedMag = Math.max(mag, 0.001);
          const randBetween = (min: number, max: number) => min + Math.random() * (max - min);
          if (c.x - c.radius < 0) {
            c.x = c.radius;
            const angle = randBetween(-Math.PI / 3, Math.PI / 3);
            this.velocities[c.id] = { vx: Math.cos(angle) * speedMag, vy: Math.sin(angle) * speedMag };
          } else if (c.x + c.radius > this.options.width) {
            c.x = this.options.width - c.radius;
            const angle = randBetween((2 * Math.PI) / 3, (4 * Math.PI) / 3);
            this.velocities[c.id] = { vx: Math.cos(angle) * speedMag, vy: Math.sin(angle) * speedMag };
          }
          if (c.y - c.radius < 0) {
            c.y = c.radius;
            const angle = randBetween(Math.PI / 6, (5 * Math.PI) / 6);
            this.velocities[c.id] = { vx: Math.cos(angle) * speedMag, vy: Math.sin(angle) * speedMag };
          } else if (c.y + c.radius > this.options.height) {
            c.y = this.options.height - c.radius;
            const angle = randBetween((-5 * Math.PI) / 6, -Math.PI / 6);
            this.velocities[c.id] = { vx: Math.cos(angle) * speedMag, vy: Math.sin(angle) * speedMag };
          }
        } else {
          // wander: 중심점 주변을 배회하며, 일정 거리 이상 벗어나면 방향을 중심 쪽으로 조정
          const cx = this.options.centerX;
          const cy = this.options.centerY;
          const maxR = this.options.roamRadius;
          const dx = c.x - cx;
          const dy = c.y - cy;
          const dist = Math.hypot(dx, dy);
          let newVx = vel.vx;
          let newVy = vel.vy;

          // 랜덤 턴(일정 주기당 최대 각도만큼)
          const nowSec = (now / 1000);
          if (nowSec - this.lastTurnAt > (this.options.randomTurnInterval || 1.5)) {
            this.lastTurnAt = nowSec;
            const maxAngle = this.options.randomTurnAngle || (Math.PI / 3);
            const jitter = (Math.random() * 2 - 1) * maxAngle;
            const ang = Math.atan2(vel.vy, vel.vx) + jitter;
            const sp = Math.hypot(vel.vx, vel.vy);
            newVx = Math.cos(ang) * sp;
            newVy = Math.sin(ang) * sp;
          }

          // 바깥으로 벗어나면 중심을 향해 당김
          if (dist > maxR) {
            const pull = this.options.centerPull; // 0~1 (중심을 향한 비율)
            const toCenterAngle = Math.atan2(cy - c.y, cx - c.x);
            const sp = Math.hypot(newVx, newVy);
            const mixVx = Math.cos(toCenterAngle) * sp;
            const mixVy = Math.sin(toCenterAngle) * sp;
            newVx = newVx * (1 - pull) + mixVx * pull;
            newVy = newVy * (1 - pull) + mixVy * pull;
          }

          // 경계에 닿으면 살짝 안쪽으로 밀기
          if (c.x - c.radius < 0) { c.x = c.radius; newVx = Math.abs(newVx); }
          if (c.x + c.radius > this.options.width) { c.x = this.options.width - c.radius; newVx = -Math.abs(newVx); }
          if (c.y - c.radius < 0) { c.y = c.radius; newVy = Math.abs(newVy); }
          if (c.y + c.radius > this.options.height) { c.y = this.options.height - c.radius; newVy = -Math.abs(newVy); }

          this.velocities[c.id] = { vx: newVx, vy: newVy };
        }
      }
    }

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.useProgram(this.programInfo.program);

    // 정점 버퍼 바인딩
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.vertexPosition,
      2, // 2D 좌표
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

    // 유니폼 설정
    this.gl.uniform2f(this.programInfo.uniformLocations.resolution, this.options.width, this.options.height);
    this.gl.uniform1i(this.programInfo.uniformLocations.circleCount, this.circles.length);
    this.gl.uniform1f(this.programInfo.uniformLocations.threshold, this.options.threshold);
    this.gl.uniform1f(this.programInfo.uniformLocations.smooth, this.options.smooth);
    this.gl.uniform1f(this.programInfo.uniformLocations.falloff, this.options.falloff);
    this.gl.uniform1i(this.programInfo.uniformLocations.useGaussian, this.options.useGaussian ? 1 : 0);

    // 배경색 설정
    const bgColor = this.hexToRgb(this.options.backgroundColor);
    this.gl.uniform3f(this.programInfo.uniformLocations.backgroundColor, bgColor.r, bgColor.g, bgColor.b);

    // 원들의 데이터 설정
    const circleData = new Float32Array(20 * 3); // 최대 20개 원, 각각 x, y, radius
    const colorData = new Float32Array(20 * 3); // 각 원의 색상 RGB
    for (let i = 0; i < Math.min(this.circles.length, 20); i++) {
      const circle = this.circles[i];
      circleData[i * 3] = circle.x;
      circleData[i * 3 + 1] = circle.y;
      circleData[i * 3 + 2] = circle.radius;

      const rgb = this.hexToRgb(circle.color ?? '#33d2ff');
      colorData[i * 3] = rgb.r;
      colorData[i * 3 + 1] = rgb.g;
      colorData[i * 3 + 2] = rgb.b;
    }
    this.gl.uniform3fv(this.programInfo.uniformLocations.circles, circleData);
    this.gl.uniform3fv(this.programInfo.uniformLocations.circleColors, colorData);

    // 렌더링
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.animationId = requestAnimationFrame(this.render);
  };

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }

  // 공개 메서드들
  public addCircle(x: number, y: number, radius: number): string {
    const id = Math.random().toString(36).substr(2, 9);
    const circle: MetaBallCircle = { x, y, radius, id };
    this.circles.push(circle);
    this.events.onCircleAdd?.(circle);
    return id;
  }

  public removeCircle(id: string): boolean {
    const index = this.circles.findIndex(circle => circle.id === id);
    if (index !== -1) {
      this.circles.splice(index, 1);
      this.events.onCircleRemove?.(id);
      return true;
    }
    return false;
  }

  public moveCircle(id: string, x: number, y: number): boolean {
    const circle = this.circles.find(c => c.id === id);
    if (circle) {
      circle.x = x;
      circle.y = y;
      this.events.onCircleMove?.(circle);
      return true;
    }
    return false;
  }

  public updateOptions(newOptions: Partial<MetaBallOptions>) {
    this.options = { ...this.options, ...newOptions };
  }

  public setThreshold(threshold: number) {
    this.options.threshold = Math.max(0, Math.min(3, threshold));
  }

  public setSmooth(smooth: number) {
    this.options.smooth = Math.max(0, Math.min(1, smooth));
  }

  public getCircles(): MetaBallCircle[] {
    return [...this.circles];
  }

  public resize(width: number, height: number) {
    this.options.width = width;
    this.options.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  public destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.programInfo?.program) {
      this.gl.deleteProgram(this.programInfo.program);
    }
    
    if (this.positionBuffer) {
      this.gl.deleteBuffer(this.positionBuffer);
    }
  }
} 