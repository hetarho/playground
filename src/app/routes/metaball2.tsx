import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCanvas } from "../../shared";

export const Route = createFileRoute("/metaball2")({
  component: MetaBall2Step1,
});

export default function MetaBall2Step1() {
  const { canvasRef } = useCanvas({
    // mode: '3d' → 훅은 리사이즈 관찰/리스너만 담당하고, WebGL 컨텍스트와 렌더링은 우리가 직접 제어합니다.
    mode: "3d",
  });

  useEffect(() => {
    // 애니메이션/리소스 관리용 레퍼런스
    const glRef = { current: null as WebGL2RenderingContext | null };
    const programRef = { current: null as WebGLProgram | null };
    const uTimeRef = { current: null as WebGLUniformLocation | null };
    const rafRef = { current: 0 };
    const startTimeRef = { current: 0 };

    const canvas = canvasRef.current;
    if (!canvas) return;

    // [렌더 순서 개요]
    //  1) DPR 반영하여 내부 렌더 타깃 해상도(canvas.width/height) 설정
    //  2) WebGL2 컨텍스트 얻기 → viewport를 내부 해상도에 맞춤
    //  3) 화면 지우기(clearColor/clear)로 기본 배경 확인
    //  4) 셰이더(버텍스/프래그먼트) 컴파일/링크 → program 활성화
    //  5) 정점 버퍼를 만들고 aPosition(in) 속성에 바인딩
    //  6) 프래그먼트에 uResolution(uniform) 전달
    //  7) drawArrays(TRIANGLE_STRIP)으로 사각형을 그리면, GPU가 자동으로 두 개의 삼각형으로 래스터화합니다

    // [CSS 크기] Tailwind 클래스로 보이는 크기를 지정합니다.
    //  - 아래 JSX에서 w-[800px] h-[500px]로 지정된 값은 'CSS 픽셀' 단위입니다.
    //  - 레이아웃은 CSS 크기로 결정되고, 실제 그려지는 내부 해상도는 아래에서 별도로 설정합니다.
    const rect = canvas.getBoundingClientRect();

    // [DPR(Device Pixel Ratio)] 물리 픽셀 / CSS 픽셀 비율입니다.
    //  - 예) 레티나 디스플레이는 보통 DPR=2 → CSS 800px이라도 내부적으로 1600 물리픽셀로 그리면 더 선명합니다.
    //  - Math.max(1, ...)를 쓰는 이유: 어떤 환경에서 DPR이 1보다 작게 보고될 수 있는데,
    //    내부 해상도를 1 미만으로 설정하면 흐릿해지거나 계산이 꼬일 수 있어 최소값을 1로 고정합니다.
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    // [실제 렌더 타겟 해상도] canvas.width/height는 물리 픽셀 기준입니다.
    //  - CSS 크기(rect.width/height)에 DPR을 곱해 내부 픽셀 수를 늘려 선명도를 확보합니다.
    //  - CSS 크기 자체는 Tailwind로 유지되므로 레이아웃은 그대로입니다.
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // WebGL2 컨텍스트 획득
    //  - WebGL1과 차이: 셰이더 문법이 GLSL ES 3.00(#version 300 es), attribute/varying → in/out
    //  - 대부분의 최신 브라우저는 지원. 미지원이면 조용히 종료(필요시 webgl1 폴백 가능)
    const gl = canvas.getContext("webgl2", {
      antialias: true,
    }) as WebGL2RenderingContext | null;
    if (!gl) {
      console.error("WebGL2 not supported");
      return;
    }
    glRef.current = gl;

    // [viewport]
    //  - 정규화 장치 좌표(NDC: -1..1)를 실제 픽셀 좌표로 매핑할 사각형 영역입니다.
    //  - 여기서는 프레임버퍼 전체(왼쪽 아래(0,0) ~ width,height)로 설정해 전체 캔버스를 대상으로 렌더합니다.
    gl.viewport(0, 0, canvas.width, canvas.height);

    // [clearColor]
    //  - gl.clear로 색 버퍼를 "지울 때" 사용할 RGBA(0..1) 값을 지정합니다.
    //  - 아래는 파란 계열의 배경색(0.1, 0.2, 0.9, 1.0)을 설정했습니다.
    gl.clearColor(0.1, 0.1, 0.1, 1.0);

    // [clear]
    //  - COLOR_BUFFER_BIT를 넘기면 색 버퍼가 위의 clearColor로 채워집니다.
    //  - 이 호출만으로도 GPU가 캔버스를 해당 색으로 렌더링합니다.
    gl.clear(gl.COLOR_BUFFER_BIT); // 이 단계만으로도 배경색이 보임(이후 셰이더 드로우로 덮어씀)

    // ===== 3단계: 풀스크린 사각형을 셰이더로 직접 그리기 =====
    // 목표: 버텍스/프래그먼트 셰이더 파이프라인을 최소 구성으로 이해
    /*
      [GLSL ES 3.00 키워드 요약]
      - in:   이 셰이더 단계로 "들어오는 입력"을 의미.
              VS(버텍스 셰이더)에서는 정점 속성(버퍼에서 공급),
              FS(프래그먼트 셰이더)에서는 VS의 out이 래스터화/보간되어 들어옵니다.

      - out:  이 셰이더 단계에서 "다음 단계로 내보내는 출력"을 의미.
              VS의 out → (보간) → FS의 in,
              FS의 out(vec4) → 최종 색상 등 렌더 타깃으로 출력.

      - uniform: 드로우 호출 동안 모든 셰이더에서 같은 값(상수처럼)으로 쓰는 입력.
                  예: uColor, uResolution, uTime 등.
    */

    /*
      [용어 정리]
      - Vertex(정점): 도형을 이루는 꼭짓점 데이터(위치 등). 버텍스 셰이더가 각 정점을 받아
        클립공간(-1..1) 좌표로 변환하고, 그 결과로 화면에 투영될 위치가 결정됩니다.

      - Fragment(프래그먼트): 화면의 "잠재적 픽셀" 단위. 래스터화 후 픽셀마다 프래그먼트가 생성되고,
        프래그먼트 셰이더가 각 프래그먼트의 최종 색을 계산합니다. (gl_FragColor)

      - Shader(셰이더): GPU에서 실행되는 작은 프로그램(GLSL). 종류는 버텍스 셰이더/프래그먼트 셰이더가 기본이며,
        우리가 작성한 GLSL 문자열을 컴파일하여 GPU가 실행할 수 있는 형태로 만듭니다.

      - Program(프로그램): 1개 이상의 셰이더(최소: 버텍스+프래그먼트)를 링크해서 묶은 실행 단위.
        드로우 호출 시 gl.useProgram(program)으로 활성화하여 파이프라인에 적용합니다.
    */

    // 1) 셰이더 소스 준비
    // - [버텍스 셰이더]
    //   attribute vec2 aPosition은 "정점 당" 하나씩 들어오는 입력입니다.
    //   아래에서 JS로 만든 정점 버퍼(positions)를 aPosition에 바인딩하면,
    //   드로우 시 각 정점마다 버퍼에서 다음 vec2(x,y)를 읽어 aPosition에 넣어줍니다.
    //   즉, "우리가 gl.vertexAttribPointer로 지정한 레이아웃대로" GPU가 자동 공급합니다.
    const vertexSrc = `#version 300 es
      // in: 버텍스 셰이더로 들어오는 정점별 입력. JS에서 gl.vertexAttribPointer로 버퍼와 연결됩니다.
      in vec2 aPosition; // 정점(클립공간) 좌표 (WebGL2: attribute → in)
      out vec2 vUv;      // 프래그먼트로 보간되어 전달될 UV
      void main() {
        // [-1,1] 범위의 정점 좌표를 [0,1] 범위로 변환해 전달
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // - [프래그먼트 셰이더] 래스터화된 각 프래그먼트(픽셀 후보)에 대해 최종 색을 출력합니다.
    //   여기서는 모든 픽셀을 동일한 uColor로 채웁니다.
    const fragmentSrc = `#version 300 es
      precision mediump float;
      in vec2 vUv;                    // 버텍스에서 넘어온 보간된 UV([0,1])
      uniform float uTime;            // 시간(초)
      uniform vec2 uCenter1;          // 왼쪽 원 중심(uv 좌표계 [0,1])
      uniform vec2 uCenter2;          // 오른쪽 원 중심(uv 좌표계 [0,1])
      uniform vec2 uCenter3;          // 추가 원 중심
      uniform vec2 uCenter4;          // 추가 원 중심
      uniform vec2 uMouseCenter;      // 마우스 원 중심(uv 좌표계 [0,1])
      uniform float uRadius;          // 원 반경(uv 단위)
      uniform float uEdge;            // 가장자리 부드러움 폭(uv 단위)
      uniform float uMouseRadius;     // 마우스 원 반경(uv 단위)
      uniform vec3 uColor;            // 원 색상(RGB 0..1)
      out vec4 fragColor;             // 최종 출력 색상(RGBA)

      // SDF(거리장) 기반 원 마스크 원리
      // - 거리: d = length(uv - center)
      // - 내부/외부 판별값: inner = radius - d (내부 양수, 경계 0, 외부 음수)
      // - 부드러운 경계: mask = smoothstep(0.0, uEdge, inner)
      //   * inner ≤ 0 → 0 (외부), inner ≥ uEdge → 1 (충분히 내부)
      //   * 0..uEdge 구간은 0→1로 천천히 증가하여 페더링 효과
      // - 합성: 여러 마스크를 더한 뒤 clamp로 0..1로 포화. 합집합만 원하면 max 사용
      void main() {
        // 반경을 시간에 따라 약간 맥동시키기(시각화 도움)
        float radius = uRadius * (0.3 + 0.1 * sin(uTime));

        // 각 중심과의 거리 계산
        float d1 = length(vUv - uCenter1);
        float inner1 = radius - d1;
        // 경계 부드럽게(smoothstep)
        float mask1 = smoothstep(0.0, uEdge, inner1);

        float d2 = length(vUv - uCenter2);
        float inner2 = radius - d2;
        float mask2 = smoothstep(0.0, uEdge, inner2);

        float d3 = length(vUv - uCenter3);
        float inner3 = radius - d3;
        float mask3 = smoothstep(0.0, uEdge, inner3);

        float d4 = length(vUv - uCenter4);
        float inner4 = radius - d4;
        float mask4 = smoothstep(0.0, uEdge, inner4);

        float dM = length(vUv - uMouseCenter);
        float innerM = uMouseRadius - dM;  // 마우스 원은 고정 반경 사용
        float maskM = smoothstep(0.0, uEdge, innerM);

        // 마스크 합성 후 포화
        float mask = mask1 + mask2 + mask3 + mask4 + maskM;
        mask = clamp(mask, 0.0, 1.0);
        // 색 적용: 내부는 uColor, 외부는 배경, 경계는 페더링
        fragColor = vec4(uColor * mask, 1.0);
      }
    `;

    const compileShader = (type: number, source: string): WebGLShader => {
      // compileShader: GLSL 소스 코드를 GPU가 이해하는 셰이더 객체로 컴파일합니다.
      // 1) 셰이더 객체 생성 → 2) 소스 주입 → 3) 컴파일 → 4) 상태 확인
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader) ?? "";
        gl.deleteShader(shader);
        throw new Error(`Shader compile failed: ${log}`);
      }
      return shader;
    };

    const createProgram = (
      vsSource: string,
      fsSource: string
    ): WebGLProgram => {
      // createProgram: 컴파일된 버텍스/프래그먼트 셰이더를 하나의 실행 단위(Program)로 링크합니다.
      // 1) 각 셰이더 컴파일 → 2) program 생성 및 attach → 3) link → 4) 링크 상태 확인
      //    링크가 끝나면 개별 셰이더 객체는 삭제해도 program 내부에 바이너리로 포함되어 안전합니다.
      const vs = compileShader(gl.VERTEX_SHADER, vsSource);
      const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
      const program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      // 링크 후 셰이더 객체는 더 이상 필요 없으므로 정리(프로그램에는 바이너리로 포함됨)
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program) ?? "";
        gl.deleteProgram(program);
        throw new Error(`Program link failed: ${log}`);
      }
      return program;
    };

    // 2) 프로그램 생성/사용
    const program = createProgram(vertexSrc, fragmentSrc);
    gl.useProgram(program);
    programRef.current = program;

    // 3) 풀스크린 정점 데이터 준비(NDC에서 사각형)
    // - NDC: x,y ∈ [-1, 1] 범위면 전체 화면을 덮습니다.
    // - TRIANGLE_STRIP: 4개 정점으로 2개의 삼각형을 연속 그립니다.
    //   정점 순서(인덱스 기준):
    //     v0(-1,-1), v1(1,-1), v2(-1,1), v3(1,1)
    //   생성 삼각형: (v0,v1,v2), (v2,v1,v3)
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // 4) 속성(aPosition) 바인딩: "버퍼의 메모리 레이아웃"을 aPosition(in)과 연결
    //   - getAttribLocation: 현재 program에서 aPosition의 위치(index)를 조회
    //   - enableVertexAttribArray: 해당 attribute 입력을 활성화
    //   - vertexAttribPointer:
    //       (index, size, type, normalized, stride, offset)
    //       index: aPosition의 위치
    //       size:  2 → vec2(x,y)
    //       type:  gl.FLOAT → 32비트 float
    //       normalized: false → 정규화하지 않음(정수형일 때 주로 사용)
    //       stride: 0 → 한 정점당 바이트 간격(0은 "타이트하게 연속")
    //       offset: 0 → 버퍼 시작 오프셋
    //   이렇게 설정하면 드로우 시 "각 정점마다" 버퍼에서 2개의 float를 읽어 aPosition에 공급합니다.
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(
      aPosition,
      2, // vec2
      gl.FLOAT,
      false,
      0,
      0
    );

    // 5) 유니폼(uResolution) 지정 후 그리기
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uCenter1 = gl.getUniformLocation(program, "uCenter1");
    const uCenter2 = gl.getUniformLocation(program, "uCenter2");
    const uCenter3 = gl.getUniformLocation(program, "uCenter3");
    const uCenter4 = gl.getUniformLocation(program, "uCenter4");
    const uMouseCenter = gl.getUniformLocation(program, "uMouseCenter");
    const uRadius = gl.getUniformLocation(program, "uRadius");
    const uEdge = gl.getUniformLocation(program, "uEdge");
    const uMouseRadius = gl.getUniformLocation(program, "uMouseRadius");
    const uColor = gl.getUniformLocation(program, "uColor");
    uTimeRef.current = uTime;
    // 캔버스의 렌더 타깃 해상도(픽셀). DPR 반영된 canvas.width/height 사용 (현재 FS에 없을 수 있어 가드)
    if (uResolution) {
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    }
    if (uTime) {
      gl.uniform1f(uTime, 0.0);
    }
    // 원 파라미터 기본값 설정: 좌/우 두 개의 원 중심, 공통 반경과 에지 폭
    if (uCenter1) gl.uniform2f(uCenter1, 0.25, 0.5); // 좌측
    if (uCenter2) gl.uniform2f(uCenter2, 0.75, 0.5); // 우측
    if (uCenter3) gl.uniform2f(uCenter3, 0.5, 0.25); // 좌측
    if (uCenter4) gl.uniform2f(uCenter4, 0.5, 0.75); // 우측
    if (uRadius) gl.uniform1f(uRadius, 0.5);
    if (uEdge) gl.uniform1f(uEdge, 0.2);
    if (uMouseRadius) gl.uniform1f(uMouseRadius, 0.12); // 마우스 원 고정 반경(uv)
    if (uColor) gl.uniform3f(uColor, 0.2, 0.8, 1.0); // 기본 색상: 하늘색 계열
    if (uMouseCenter) gl.uniform2f(uMouseCenter, 0.5, 0.5);

    // 마우스 이동에 따라 uMouseCenter를 UV 좌표로 갱신
    const handlePointerMove = (ev: PointerEvent) => {
      const rectNow = canvas.getBoundingClientRect();
      const x = (ev.clientX - rectNow.left) / rectNow.width;
      const y = (ev.clientY - rectNow.top) / rectNow.height;
      const uvX = Math.min(Math.max(x, 0), 1);
      const uvY = 1.0 - Math.min(Math.max(y, 0), 1); // DOM Y↓ → UV Y↑ 변환
      const ctx = glRef.current;
      if (ctx && uMouseCenter) {
        ctx.uniform2f(uMouseCenter, uvX, uvY);
      }
    };
    canvas.addEventListener('pointermove', handlePointerMove);

    // 6) 애니메이션 루프: uTime을 업데이트하며 매 프레임 그리기
    startTimeRef.current = performance.now();
    const frame = (now: number) => {
      const ctx = glRef.current;
      if (!ctx) return;
      const elapsed = (now - startTimeRef.current) / 1000.0; // 초 단위
      if (uTimeRef.current) {
        ctx.uniform1f(uTimeRef.current, elapsed);
      }
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    // 7) 리소스 정리(라우트 언마운트 시)
    //    참고: 캔버스 크기가 동적으로 변한다면, viewport와 uResolution을 다시 설정해야 합니다.
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('pointermove', handlePointerMove);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      programRef.current = null;
      glRef.current = null;
      uTimeRef.current = null;
    };
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full rounded border border-neutral-700 bg-neutral-900"
    />
  );
}
