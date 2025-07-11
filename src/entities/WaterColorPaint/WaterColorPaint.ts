type WaterColorPaintData = {
  x: number;
  y: number;
  speed: number;
  color: string;
};

export default class WaterColorPaint {
  x: number;
  y: number;
  points: WaterColorPoint[];
  speed: number;
  color: string;

  constructor(data: WaterColorPaintData) {
    const { speed, x, y, color } = data;
    this.x = x;
    this.y = y;
    this.points = this.getCircleDivisionPoints(x, y, 0.1, 100, color);
    this.speed = speed;
    this.color = color;
  }

  getCircleDivisionPoints(
    centerX: number,
    centerY: number,
    radius: number,
    divisions: number,
    color: string,
  ): WaterColorPoint[] {
    const points: WaterColorPoint[] = [];

    for (let i = 0; i < divisions; i++) {
      const angle = (i / divisions) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(new WaterColorPoint(x, y, { color }));
    }

    return points;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;

    ctx.beginPath();
    this.points.forEach((point, index) => {
      point.increasePointDistance(
        this.x,
        this.y,
        Math.random() > 0.5 ? 0.5 : 0,
      );
      const { x, y } = point;
      if (index === 0) ctx.moveTo(x, y);
      else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();

    ctx.closePath();

    // 내부 채우기
    ctx.fillStyle = this.color;
    ctx.fill();

    // 선 그리기
  }
}

class WaterColorPoint {
  x: number;
  y: number;
  color: string;

  constructor(x: number, y: number, { color }: { color: string }) {
    this.x = x;
    this.y = y;
    this.color = color;
  }

  increasePointDistance(
    centerX: number,
    centerY: number,
    additionalDistance: number,
  ) {
    // 현재 두 점 사이의 벡터 계산
    const dx = this.x - centerX;
    const dy = this.y - centerY;

    // 현재 거리 계산
    const currentDistance = Math.sqrt(dx * dx + dy * dy);

    // 새로운 거리 계산
    const newDistance = currentDistance + additionalDistance;

    // 거리 증가 비율 계산
    const ratio = newDistance / currentDistance;

    // 새로운 점의 좌표 계산
    this.x = centerX + dx * ratio;
    this.y = centerY + dy * ratio;
  }
}
