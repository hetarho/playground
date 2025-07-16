import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ScrollableSpace } from "../../entities/ScrollableSpace";
import type { ScrollableSpaceOptions } from "../../entities/ScrollableSpace";

export const Route = createFileRoute("/three")({
  component: ThreePage,
});

function ThreePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollableSpaceRef = useRef<ScrollableSpace | null>(null);
  const [position, setPosition] = useState({ current: 10, target: 10 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const options: ScrollableSpaceOptions = {
      canvas,
      width: rect.width,
      height: rect.height,
      backgroundColor: "#1a1a2e",
      cameraPosition: { x: 0, y: 0, z: 10 },
      scrollSensitivity: 0.15,
      minZ: -30,
      maxZ: 50,
    };

    const events = {
      onScroll: (targetZ: number) => {
        setPosition((prev) => ({ ...prev, target: targetZ }));
      },
      onPositionChange: (x: number, y: number, z: number) => {
        setPosition((prev) => ({ ...prev, current: z }));
      },
    };

    scrollableSpaceRef.current = new ScrollableSpace(options, events);
    setIsLoading(false);

    // 윈도우 리사이즈 처리
    const handleResize = () => {
      if (!canvasRef.current || !scrollableSpaceRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      scrollableSpaceRef.current.resize(rect.width, rect.height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      scrollableSpaceRef.current?.destroy();
    };
  }, []);

  const handleResetPosition = () => {
    scrollableSpaceRef.current?.setPosition(10);
  };

  const handleSetPosition = (z: number) => {
    scrollableSpaceRef.current?.setPosition(z);
  };

  return (
    <div className="w-full h-full bg-black relative">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-xl">3D 공간 로딩 중...</div>
        </div>
      )}

      {/* UI Controls */}
      <div className="absolute top-4 left-4 text-white space-y-2">
        <div className="bg-black bg-opacity-50 p-3 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">3D 스크롤 공간</h3>
          <div className="text-xs space-y-1">
            <div>현재 위치: {position.current.toFixed(1)}</div>
            <div>목표 위치: {position.target.toFixed(1)}</div>
            <div className="text-gray-300 mt-2">마우스 휠로 앞뒤 이동</div>
          </div>
        </div>

        <div className="bg-black bg-opacity-50 p-3 rounded-lg space-y-2">
          <button
            onClick={handleResetPosition}
            className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          >
            원점으로 복귀
          </button>

          <div className="flex gap-1">
            <button
              onClick={() => handleSetPosition(-20)}
              className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
            >
              뒤로
            </button>
            <button
              onClick={() => handleSetPosition(30)}
              className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
            >
              앞으로
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black bg-opacity-50 p-3 rounded-lg">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span>뒤</span>
            <span>앞</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((position.current + 30) / 80) * 100}%`,
              }}
            />
          </div>
          <div className="text-xs text-center text-gray-400 mt-1">
            스크롤 위치: {position.current.toFixed(1)} / 80
          </div>
        </div>
      </div>
    </div>
  );
}
