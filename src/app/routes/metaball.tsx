import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MetaBall } from "../../entities/MetaBall";
import type { MetaBallOptions, MetaBallCircle } from "../../entities/MetaBall";

export const Route = createFileRoute("/metaball")({
  component: MetaBallPage,
});

function MetaBallPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metaBallRef = useRef<MetaBall | null>(null);
  const [circles, setCircles] = useState<MetaBallCircle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [threshold, setThreshold] = useState(1.0);
  const [smooth, setSmooth] = useState(0.1);
  
  // 드래그 상태를 ref로 관리하여 stale closure 방지
  const isDraggingRef = useRef(false);
  const dragCircleIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 모바일 감지
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // 초기 원들 설정
    const initialCircles: MetaBallCircle[] = [
      { x: rect.width * 0.3, y: rect.height * 0.4, radius: 80, id: 'initial1' },
      { x: rect.width * 0.7, y: rect.height * 0.6, radius: 60, id: 'initial2' },
      { x: rect.width * 0.5, y: rect.height * 0.3, radius: 50, id: 'initial3' },
    ];

    const options: MetaBallOptions = {
      canvas,
      width: rect.width,
      height: rect.height,
      backgroundColor: "#0a0a0a",
      threshold: 1.0,
      smooth: 0.1,
      circles: initialCircles,
    };

    const events = {
      onCircleAdd: (circle: MetaBallCircle) => {
        setCircles(prev => [...prev, circle]);
      },
      onCircleMove: (circle: MetaBallCircle) => {
        setCircles(prev => prev.map(c => c.id === circle.id ? circle : c));
      },
      onCircleRemove: (circleId: string) => {
        setCircles(prev => prev.filter(c => c.id !== circleId));
      },
    };

    metaBallRef.current = new MetaBall(options, events);
    setCircles(initialCircles);
    setIsLoading(false);

    // 윈도우 리사이즈 처리
    const handleResize = () => {
      if (!canvasRef.current || !metaBallRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      metaBallRef.current.resize(rect.width, rect.height);
    };

    // 마우스/터치 이벤트 처리
    const getPointerPosition = (event: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if ('touches' in event) {
        clientX = event.touches[0]?.clientX || event.changedTouches[0]?.clientX;
        clientY = event.touches[0]?.clientY || event.changedTouches[0]?.clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }
      
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const findCircleAt = (x: number, y: number): string | null => {
      // MetaBall 인스턴스에서 직접 현재 원들 정보를 가져옴
      if (!metaBallRef.current) return null;
      const currentCircles = metaBallRef.current.getCircles();
      
      for (const circle of currentCircles) {
        const dx = x - circle.x;
        const dy = y - circle.y;
        if (dx * dx + dy * dy <= circle.radius * circle.radius) {
          return circle.id || null;
        }
      }
      return null;
    };

    const handlePointerStart = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      const pos = getPointerPosition(event);
      const circleId = findCircleAt(pos.x, pos.y);
      
      if (circleId) {
        isDraggingRef.current = true;
        dragCircleIdRef.current = circleId;
      } else if (metaBallRef.current) {
        // 새 원 추가
        const radius = 40 + Math.random() * 40;
        metaBallRef.current.addCircle(pos.x, pos.y, radius);
      }
    };

    const handlePointerMove = (event: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || !dragCircleIdRef.current || !metaBallRef.current) return;
      
      event.preventDefault();
      const pos = getPointerPosition(event);
      metaBallRef.current.moveCircle(dragCircleIdRef.current, pos.x, pos.y);
    };

    const handlePointerEnd = () => {
      isDraggingRef.current = false;
      dragCircleIdRef.current = null;
    };

    // 이벤트 리스너 등록
    canvas.addEventListener('mousedown', handlePointerStart);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerEnd);
    canvas.addEventListener('touchstart', handlePointerStart, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    canvas.addEventListener('touchend', handlePointerEnd);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener('resize', checkMobile);
      canvas.removeEventListener('mousedown', handlePointerStart);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('mouseup', handlePointerEnd);
      canvas.removeEventListener('touchstart', handlePointerStart);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchend', handlePointerEnd);
      metaBallRef.current?.destroy();
    };
  }, []); // 의존성 배열을 빈 배열로 변경하여 한 번만 실행

  const handleThresholdChange = (value: number) => {
    setThreshold(value);
    metaBallRef.current?.setThreshold(value);
  };

  const handleSmoothChange = (value: number) => {
    setSmooth(value);
    metaBallRef.current?.setSmooth(value);
  };

  const handleClearAll = () => {
    if (!metaBallRef.current) return;
    
    // 모든 원 제거
    const currentCircles = metaBallRef.current.getCircles();
    for (const circle of currentCircles) {
      if (circle.id) {
        metaBallRef.current.removeCircle(circle.id);
      }
    }
  };

  const handleAddRandomCircle = () => {
    if (!canvasRef.current || !metaBallRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;
    const radius = 30 + Math.random() * 50;
    
    metaBallRef.current.addCircle(x, y, radius);
  };

  return (
    <div className="w-full h-full bg-black relative">
      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        style={{ touchAction: "none" }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-xl">메타볼 로딩 중...</div>
        </div>
      )}

      {/* UI Controls */}
      <div className="absolute top-4 left-4 text-white space-y-3">
        <div className="bg-black bg-opacity-70 p-4 rounded-lg max-w-xs">
          <h3 className="text-lg font-semibold mb-3">메타볼 WebGL 데모</h3>
          <div className="text-sm space-y-2">
            <div>원의 개수: {circles.length}</div>
            <div className="text-gray-300">
              {isMobile ? "터치해서 원 추가/이동" : "클릭해서 원 추가, 드래그로 이동"}
            </div>
          </div>
        </div>

        {/* 컨트롤 패널 */}
        <div className="bg-black bg-opacity-70 p-4 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              연결 강도 (Threshold): {threshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={threshold}
              onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              부드러움 (Smooth): {smooth.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={smooth}
              onChange={(e) => handleSmoothChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddRandomCircle}
              className={`flex-1 px-3 rounded transition-colors ${
                isMobile 
                  ? "py-3 bg-green-600 active:bg-green-800" 
                  : "py-2 bg-green-600 hover:bg-green-700"
              }`}
            >
              랜덤 원 추가
            </button>
            <button
              onClick={handleClearAll}
              className={`flex-1 px-3 rounded transition-colors ${
                isMobile 
                  ? "py-3 bg-red-600 active:bg-red-800" 
                  : "py-2 bg-red-600 hover:bg-red-700"
              }`}
            >
              모두 지우기
            </button>
          </div>
        </div>
      </div>

      {/* 설명 패널 */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black bg-opacity-70 p-4 rounded-lg">
          <div className="text-sm text-gray-300">
            <h4 className="text-white font-medium mb-2">메타볼 효과란?</h4>
            <p className="mb-2">
              여러 원들이 서로 영향을 주어 부드럽게 연결되는 2D 효과입니다. 
              WebGL 셰이더를 사용해 실시간으로 계산됩니다.
            </p>
            <div className="text-xs space-y-1">
              <div>• 연결 강도: 원들이 얼마나 쉽게 연결되는지 조절</div>
              <div>• 부드러움: 경계의 부드러운 정도 조절</div>
              <div>• 최대 20개의 원까지 지원</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 