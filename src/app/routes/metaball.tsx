import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { MetaBall } from "../../entities/MetaBall";
import type { MetaBallCircle, MetaBallOptions } from "../../entities/MetaBall";
import { useCanvas } from "../../shared";

export const Route = createFileRoute("/metaball")({
  component: MetaBallPage,
});

function MetaBallPage() {
  // useCanvas 훅을 사용해 캔버스 엘리먼트와 리사이즈를 관리 (WebGL은 MetaBall이 직접 초기화)
  const metaBallRef = useRef<MetaBall | null>(null);
  const { canvasRef } = useCanvas({
    mode: "3d",
    onResize: (w, h) => metaBallRef.current?.resize(w, h),
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // 고정 원 5개 (색상 포함)
    const fixedCircles: MetaBallCircle[] = [
      {
        x: rect.width * 0.5,
        y: rect.height * 0.5,
        radius: canvas.width * 0.1,
        color: "#22d3ee",
      }, // cyan-400
      {
        x: rect.width * 0.5,
        y: rect.height * 0.5,
        radius: canvas.width * 0.1,
        color: "#a78bfa",
      }, // violet-400
      {
        x: rect.width * 0.5,
        y: rect.height * 0.5,
        radius: canvas.width * 0.1,
        color: "#34d399",
      }, // emerald-400
      {
        x: rect.width * 0.5,
        y: rect.height * 0.5,
        radius: canvas.width * 0.1,
        color: "#f472b6",
      }, // pink-400
      {
        x: rect.width * 0.5,
        y: rect.height * 0.5,
        radius: canvas.width * 0.1,
        color: "#f59e0b",
      },
    ];

    const options: MetaBallOptions = {
      canvas,
      width: rect.width,
      height: rect.height,
      backgroundColor: "#0a0a0a",
      threshold: 0.8,
      smooth: 0.35,
      falloff: 1.4,
      useGaussian: true,
      animate: true,
      speed: 200,
      circles: fixedCircles,
      movement: "wander",
      centerX: rect.width * 0.5,
      centerY: rect.height * 0.5,
      roamRadius: Math.min(rect.width, rect.height) * 0.3,
      randomTurnInterval: 1.2,
      randomTurnAngle: Math.PI / 4,
      centerMoveSpeed: 100,
      centerRandomTurnInterval: 1.2,
      centerRandomTurnAngle: Math.PI / 4,
      centerPull: 0.6,
    };

    metaBallRef.current = new MetaBall(options);

    return () => {
      metaBallRef.current?.destroy();
    };
  }, [canvasRef]);

  return (
    <div className="w-full h-full bg-black">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
