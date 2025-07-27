import { createFileRoute } from "@tanstack/react-router";
import { useCanvas } from "../../shared";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/gilt-bronze-incense-burner")({
  component: RouteComponent,
});

function RouteComponent() {
  const amplitude = 100;
  const frequency = 5;
  const [points, setPoints] = useState<Point[]>([]);

  const { canvasRef, width, height } = useCanvas({
    onAnimationFrame(ctx, width, height) {
      // 배경 클리어
      ctx.clearRect(0, 0, width, height);

      if (points.length > 0) {
        ctx.strokeStyle = "#DAA520";
        ctx.lineWidth = 3;
        ctx.beginPath();

        for (let i = 0; i < points.length; i++) {
          const point = points[i];
          if (i == 0) {
            ctx.moveTo(point.x, point.y);
          }
          if (i > 0) {
            ctx.bezierCurveTo(
              points[i - 1].x + (point.x - points[i - 1].x) * 0.2,
              points[i - 1].y,
              points[i - 1].x + (point.x - points[i - 1].x) * 0.8,
              point.y,
              point.x,
              point.y
            );
          }
          point.next();
        }
        ctx.stroke();
      }
    },
  });

  useEffect(() => {
    const points = Array.from(
      { length: frequency + 1 },
      (_, i) =>
        new Point(
          (i * width) / frequency,
          height / 2 + amplitude * (i % 2 === 0 ? 1 : -1),
          height / 2,
          amplitude
        )
    );
    setPoints(points);
  }, [width, height]);

  return <canvas ref={canvasRef} className="w-full h-full"></canvas>;
}

class Point {
  x: number;
  y: number;
  centerY: number;
  direction: number;
  amplitude: number;
  speed: number;

  constructor(x: number, y: number, centerY: number, amplitude: number) {
    this.x = x;
    this.y = y;
    this.centerY = centerY;
    this.direction = y > centerY ? -1 : 1;
    this.amplitude = amplitude;
    this.speed = Math.random() * 0.5 + 0.5;
  }

  next() {
    this.y = this.y + this.direction * this.speed * 2;

    if (
      this.y > this.centerY + this.amplitude ||
      this.y < this.centerY - this.amplitude
    ) {
      this.direction = this.direction * -1;
      this.speed = Math.random() * 0.5 + 0.5;
    }
  }
}
