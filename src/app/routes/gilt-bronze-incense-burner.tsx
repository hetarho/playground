import { createFileRoute } from "@tanstack/react-router";
import { useCanvas } from "../../shared";
import { useEffect, useState } from "react";
import chroma from "chroma-js";

export const Route = createFileRoute("/gilt-bronze-incense-burner")({
  component: RouteComponent,
});

function RouteComponent() {
  const amplitude = 100;
  const frequency = 20;
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  const { canvasRef, width, height } = useCanvas({
    onAnimationFrame(ctx, width, height) {
      // 배경 클리어
      ctx.clearRect(0, 0, width, height);

      if (strokes.length > 0) {
        strokes.forEach((stroke) => {
          ctx.beginPath();
          ctx.moveTo(0, height);
          stroke.next((point, prevPoint) => {
            const xPower = 0.5;
            const yPower = 0.05;
            if (prevPoint === null) ctx.lineTo(point.x, point.y);
            else
              ctx.bezierCurveTo(
                prevPoint.x + (point.x - prevPoint.x) * xPower,
                prevPoint.y + (point.y - prevPoint.y) * yPower,
                point.x - (point.x - prevPoint.x) * xPower,
                point.y - (point.y - prevPoint.y) * yPower,
                point.x,
                point.y
              );
          });

          ctx.fillStyle = stroke.color;
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          ctx.fill();
        });
      }
    },
  });

  useEffect(() => {
    const seedColor = chroma("#6c6613");
    const strokes = Array.from({ length: 4 }, (_, i) => {
      const points = Array.from(
        { length: frequency + 1 },
        (_, j) =>
          new Point(
            (j * width) / frequency,
            (height * 1.1 ** i) / 2 + amplitude * (j % 2 === 0 ? 1 : -1),
            (height * 1.1 ** i) / 2,
            amplitude + Math.random() * 30,
            i + 1
          )
      );

      return new Stroke(points, seedColor.brighten(i * 0.2).hex());
    });

    setStrokes(strokes);
  }, [width, height]);

  return <canvas ref={canvasRef} className="w-full h-full"></canvas>;
}

class Stroke {
  points: Point[];
  color: string;

  constructor(points: Point[], color: string) {
    this.points = points;
    this.color = color;
  }

  next(
    callback: (
      point: Point,
      prevPoint: Point | null,
      nextPoint: Point | null
    ) => void
  ) {
    this.points.forEach((point, index) => {
      point.next();
      callback(
        point,
        index > 0 ? this.points[index - 1] : null,
        index < this.points.length - 1 ? this.points[index + 1] : null
      );
    });
  }
}

class Point {
  x: number;
  y: number;
  centerY: number;
  direction: number;
  amplitude: number;
  speed: number;
  seedSpeed: number;

  constructor(
    x: number,
    y: number,
    centerY: number,
    amplitude: number,
    seedSpeed: number
  ) {
    this.x = x;
    this.y = y;
    this.centerY = centerY;
    this.direction = y > centerY ? -1 : 1;
    this.amplitude = amplitude;
    this.speed = Math.random() * 2 + 0.5 * seedSpeed;
    this.seedSpeed = seedSpeed;
  }

  next() {
    this.y = this.y + this.direction * this.speed;

    if (
      this.y > this.centerY + this.amplitude ||
      this.y < this.centerY - this.amplitude
    ) {
      if (this.y > this.centerY + this.amplitude) this.direction = -1;
      else this.direction = 1;
      this.speed = Math.random() * 2 + 0.5 * this.seedSpeed;
    }
  }
}
