import chroma from "chroma-js";
import type { BrightCirclesData } from "./BrightCircle.type";

export default class BrightCircles {
  width: number;
  height: number;
  posX: number;
  posY: number;
  color: string;
  brightness: number;
  speed: number;
  radius: number;
  alpha: number;
  constructor(data: BrightCirclesData) {
    const { width, height, color } = data;
    this.width = width;
    this.height = height;
    this.alpha = Math.random() * 0.4 + 0.15;
    this.brightness = Math.random() * 4 - 1;
    this.color = color;
    this.posX = Math.random() * width;
    this.posY = Math.random() * height;
    this.radius =
      (Math.random() * Math.min(width, height)) / 8 +
      Math.min(width, height) / 8;
    this.speed = Math.random() * 3 + 5;
  }

  minMax(value: number, { max, min }: { min: number; max: number }) {
    return Math.max(min, Math.min(max, value));
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.posX = this.minMax(this.posX + (Math.random() - 0.5) * this.speed, {
      min: 0,
      max: this.width,
    });

    this.posY = this.minMax(this.posY + (Math.random() - 0.5) * this.speed, {
      min: 0,
      max: this.height,
    });

    this.alpha = this.minMax(this.alpha + (Math.random() - 0.5) * 0.02, {
      min: 0,
      max: 0.55,
    });

    this.brightness = this.minMax(
      this.brightness + (Math.random() - 0.5) * 0.1,
      {
        min: -1,
        max: 3,
      }
    );

    this.radius = this.minMax(
      this.radius + (Math.random() - 0.5) * this.speed * 0.02,
      {
        min: Math.min(this.width, this.height) / 16,
        max: Math.min(this.width, this.height) / 4,
      }
    );

    const color = chroma(this.color)
      .brighten(this.brightness)
      .alpha(this.alpha)
      .hex();

    const gradient = ctx.createRadialGradient(
      this.posX,
      this.posY,
      0,
      this.posX,
      this.posY,
      this.radius
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, chroma(color).alpha(0).hex());

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
