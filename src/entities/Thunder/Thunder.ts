import type { ThunderData } from "./Thunder.type";
import { ThunderLinePoint } from "./ThunderLinePoint";

export class Thunder {
  sinTheta: number;
  cosTheta: number;
  sinThetaPerpendicular: number;
  cosThetaPerpendicular: number;
  points: ThunderLinePoint[];
  data: ThunderData;

  constructor(data: ThunderData) {
    this.data = data;
    const { startPoint, endPoint, frequency, amplitude } = data;

    const theta = Math.atan2(
      endPoint.y - startPoint.y,
      endPoint.x - startPoint.x
    );

    // 수직선의 각도 계산
    const thetaPerpendicular = theta + Math.PI / 2;

    // 사인과 코사인 값 계산
    this.sinTheta = Math.sin(theta);
    this.cosTheta = Math.cos(theta);

    // 수직선의 사인과 코사인 값 계산
    this.sinThetaPerpendicular = Math.sin(thetaPerpendicular);
    this.cosThetaPerpendicular = Math.cos(thetaPerpendicular);

    const lineLength = Math.sqrt(
      Math.pow(endPoint.y - startPoint.y, 2) +
        Math.pow(endPoint.x - startPoint.x, 2)
    );

    this.points = Array.from(Array(frequency)).map((_, i) => {
      const direction = i % 2 === 0 ? 1 : -1;
      const pointInLine = new ThunderLinePoint(
        startPoint.x + lineLength * this.cosTheta * ((0.5 + i) / frequency),
        startPoint.y + lineLength * this.sinTheta * ((0.5 + i) / frequency)
      );

      return new ThunderLinePoint(
        pointInLine.x + amplitude * this.cosThetaPerpendicular * direction,
        pointInLine.y + amplitude * this.sinThetaPerpendicular * direction,
        this.sinThetaPerpendicular,
        this.cosThetaPerpendicular
      );
    });
    this.points.push(endPoint);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { startPoint, endPoint, color, width } = this.data;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);

    this.points.forEach((point, i) => {
      if (this.points[i + 1] === undefined) return;

      ctx.quadraticCurveTo(
        point.x,
        point.y,
        point.x / 2 + this.points[i + 1].x / 2,
        point.y / 2 + this.points[i + 1].y / 2
      );
      point.update();
    });

    ctx.lineTo(endPoint.x, endPoint.y);

    ctx.lineWidth = width;
    ctx.strokeStyle = color;

    ctx.shadowColor = "white";
    ctx.shadowBlur = width * 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.stroke();
  }
}
