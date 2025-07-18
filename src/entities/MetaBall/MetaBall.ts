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
    uniform int uCircleCount;
    uniform float uThreshold;
    uniform float uSmooth;
    uniform vec3 uBackgroundColor;
    
    void main() {
      vec2 position = gl_FragCoord.xy / uResolution.xy;
      position.y = 1.0 - position.y; // Y 축 뒤집기
      
      float sum = 0.0;
      
      // 모든 원에 대해 메타볼 필드 계산
      for(int i = 0; i < 20; i++) {
        if(i >= uCircleCount) break;
        
        vec2 circlePos = uCircles[i].xy / uResolution.xy;
        float radius = uCircles[i].z / min(uResolution.x, uResolution.y);
        
        float dist = distance(position, circlePos);
        
        // 메타볼 함수: 1/distance^2 * radius^2
        if(dist > 0.0) {
          sum += (radius * radius) / (dist * dist);
        }
      }
      
      // 임계값을 기준으로 색상 결정
      float alpha = smoothstep(uThreshold - uSmooth, uThreshold + uSmooth, sum);
      
      // 메타볼 색상 (청록색 계열)
      vec3 metaballColor = vec3(0.2, 0.8, 1.0);
      
      // 최종 색상 = 배경색과 메타볼 색상 혼합
      vec3 finalColor = mix(uBackgroundColor, metaballColor, alpha);
      
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
      circles: options.circles || []
    };

    this.circles = [...this.options.circles];

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
        circleCount: this.gl.getUniformLocation(shaderProgram, 'uCircleCount'),
        threshold: this.gl.getUniformLocation(shaderProgram, 'uThreshold'),
        smooth: this.gl.getUniformLocation(shaderProgram, 'uSmooth'),
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

    // 배경색 설정
    const bgColor = this.hexToRgb(this.options.backgroundColor);
    this.gl.uniform3f(this.programInfo.uniformLocations.backgroundColor, bgColor.r, bgColor.g, bgColor.b);

    // 원들의 데이터 설정
    const circleData = new Float32Array(20 * 3); // 최대 20개 원, 각각 x, y, radius
    for (let i = 0; i < Math.min(this.circles.length, 20); i++) {
      const circle = this.circles[i];
      circleData[i * 3] = circle.x;
      circleData[i * 3 + 1] = circle.y;
      circleData[i * 3 + 2] = circle.radius;
    }
    this.gl.uniform3fv(this.programInfo.uniformLocations.circles, circleData);

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