"use client";

import {
  type RefObject,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

// 마우스/터치 이벤트에서 사용할 좌표 정보
export interface CanvasPoint {
  x: number;
  y: number;
  canvasWidth: number;
  canvasHeight: number;
}

// 드래그 이벤트에서 사용할 정보
export interface CanvasDragInfo extends CanvasPoint {
  deltaX: number;
  deltaY: number;
  startX: number;
  startY: number;
}

// useCanvas 훅의 옵션
export interface UseCanvasOptions {
  // 크기 변경 콜백
  onResize?: (width: number, height: number) => void;

  // 마우스 이벤트 콜백
  onClick?: (point: CanvasPoint) => void;
  onMouseDown?: (point: CanvasPoint) => void;
  onMouseUp?: (point: CanvasPoint) => void;
  onMouseMove?: (point: CanvasPoint) => void;
  onMouseLeave?: () => void;

  // 드래그 이벤트 콜백
  onDragStart?: (point: CanvasPoint) => void;
  onDragMove?: (info: CanvasDragInfo) => void;
  onDragEnd?: (info: CanvasDragInfo) => void;

  // 애니메이션 프레임 콜백
  onAnimationFrame?: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameCount: number
  ) => void;

  // 초기화 옵션
  pixelRatio?: number; // 기본값: window.devicePixelRatio
  backgroundColor?: string; // 배경색
}

// useCanvas 훅의 반환 타입
export interface UseCanvasReturn {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  ctx: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  clear: () => void;
  getContext: () => CanvasRenderingContext2D | null;
}

export function useCanvas(options: UseCanvasOptions = {}): UseCanvasReturn {
  const {
    onResize,
    onClick,
    onMouseDown,
    onMouseUp,
    onMouseMove,
    onMouseLeave,
    onDragStart,
    onDragMove,
    onDragEnd,
    onAnimationFrame,
    pixelRatio = typeof window !== "undefined" ? window.devicePixelRatio : 1,
    backgroundColor,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const frameCountRef = useRef(0);
  const animationIdRef = useRef<number | undefined>(undefined);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // 캔버스 좌표 변환 함수
  const getCanvasPoint = useCallback(
    (e: MouseEvent | TouchEvent): CanvasPoint | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e && "clientY" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return null;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        canvasWidth: dimensions.width,
        canvasHeight: dimensions.height,
      };
    },
    [dimensions]
  );

  // 캔버스 클리어
  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const context = ctx;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundColor) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [ctx, backgroundColor]);

  // Context 가져오기
  const getContext = useCallback(() => ctx, [ctx]);

  // 캔버스 크기 업데이트
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // 실제 픽셀 크기 설정
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;

    // CSS 크기는 그대로 유지
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Context 스케일 조정
    const context = canvas.getContext("2d");
    if (context) {
      context.scale(pixelRatio, pixelRatio);
      setCtx(context);
    }

    setDimensions((prev) => {
      if (prev.width === width && prev.height === height) {
        return prev;
      }
      return { width, height };
    });
    onResize?.(width, height);

    // 배경색 적용
    if (backgroundColor && context) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);
    }
  }, [pixelRatio, backgroundColor, onResize]);

  // 마우스/터치 이벤트 핸들러
  const handleMouseDown = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const point = getCanvasPoint(e);
      if (!point) return;

      isDraggingRef.current = false;
      dragStartRef.current = { x: point.x, y: point.y };

      onMouseDown?.(point);
    },
    [getCanvasPoint, onMouseDown]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const point = getCanvasPoint(e);
      if (!point) return;

      onMouseMove?.(point);

      // 드래그 처리
      const isMouseDragging = "buttons" in e && e.buttons === 1;
      const isTouchDragging = "touches" in e && e.touches.length > 0;

      if (dragStartRef.current && (isMouseDragging || isTouchDragging)) {
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          onDragStart?.(point);
        } else {
          const dragInfo: CanvasDragInfo = {
            ...point,
            deltaX: point.x - dragStartRef.current.x,
            deltaY: point.y - dragStartRef.current.y,
            startX: dragStartRef.current.x,
            startY: dragStartRef.current.y,
          };
          onDragMove?.(dragInfo);
        }
      }
    },
    [getCanvasPoint, onMouseMove, onDragStart, onDragMove]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const point = getCanvasPoint(e);
      if (!point) return;

      onMouseUp?.(point);

      if (isDraggingRef.current) {
        const dragInfo: CanvasDragInfo = {
          ...point,
          deltaX: point.x - dragStartRef.current.x,
          deltaY: point.y - dragStartRef.current.y,
          startX: dragStartRef.current.x,
          startY: dragStartRef.current.y,
        };
        onDragEnd?.(dragInfo);
        isDraggingRef.current = false;
      }
    },
    [getCanvasPoint, onMouseUp, onDragEnd]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const point = getCanvasPoint(e);
      if (!point) return;

      onClick?.(point);
    },
    [getCanvasPoint, onClick]
  );

  const handleMouseLeave = useCallback(() => {
    if (isDraggingRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const dragInfo: CanvasDragInfo = {
          x: rect.width,
          y: rect.height,
          canvasWidth: dimensions.width,
          canvasHeight: dimensions.height,
          deltaX: rect.width - dragStartRef.current.x,
          deltaY: rect.height - dragStartRef.current.y,
          startX: dragStartRef.current.x,
          startY: dragStartRef.current.y,
        };
        onDragEnd?.(dragInfo);
        isDraggingRef.current = false;
      }
    }
    onMouseLeave?.();
  }, [dimensions, onDragEnd, onMouseLeave]);

  // 애니메이션 루프
  const animate = useCallback(() => {
    if (!ctx || !canvasRef.current) return;

    onAnimationFrame?.(
      ctx,
      dimensions.width,
      dimensions.height,
      frameCountRef.current++
    );

    animationIdRef.current = requestAnimationFrame(animate);
  }, [ctx, dimensions, onAnimationFrame]);

  // 초기화 및 이벤트 리스너 설정
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    updateCanvasSize();

    // ResizeObserver 설정
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(canvas);

    // 이벤트 리스너 추가
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // 터치 이벤트
    canvas.addEventListener("touchstart", handleMouseDown, { passive: false });
    canvas.addEventListener("touchmove", handleMouseMove, { passive: false });
    canvas.addEventListener("touchend", handleMouseUp, { passive: false });

    // 전역 mouseup 이벤트 (캔버스 밖에서 마우스 업)
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleMouseUp(e);
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("touchstart", handleMouseDown);
      canvas.removeEventListener("touchmove", handleMouseMove);
      canvas.removeEventListener("touchend", handleMouseUp);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    updateCanvasSize,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleMouseLeave,
  ]);

  // 애니메이션 프레임 시작/중지
  useEffect(() => {
    if (onAnimationFrame && ctx) {
      animationIdRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [animate, ctx, onAnimationFrame]);

  return {
    canvasRef,
    ctx,
    width: dimensions.width,
    height: dimensions.height,
    clear,
    getContext,
  };
}
