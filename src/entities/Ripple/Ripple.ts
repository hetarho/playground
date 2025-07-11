import chroma from 'chroma-js';
import type { RippleDate } from './Ripple.type';

export default class Ripple {
  x: number;
  y: number;
  rippleNum: number;
  frequency: number;
  curr: number;
  width: number;
  height: number;
  speed: number;
  isEnd: boolean = false;
  size: number;
  depth: number;
  color: string;

  constructor(data: RippleDate) {
    const { x, y, width, height, rippleNum, frequency, color, depth } = data;
    this.x = x;
    this.y = y;
    this.rippleNum = rippleNum;
    this.width = width;
    this.height = height;
    this.frequency = frequency;
    this.depth = depth;
    this.color = color;
    this.curr = 0;
    this.speed = Math.random() + 0.5;
    this.size = 2 + frequency / 100;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isEnd) {
      return;
    }
    const totalAmount = this.frequency * this.rippleNum;
    this.curr += (this.speed * totalAmount) / (totalAmount + this.curr);

    const currentRipplesNum =
      this.curr < totalAmount
        ? Math.floor(this.curr / this.frequency) + 1
        : this.rippleNum;

    const globalOpacity = Math.min(1, 255 / this.curr);

    let hightestOpacity = 0;

    for (let i = 0; i < currentRipplesNum; i++) {
      const radius =
        Math.max(
          this.curr % this.frequency,
          this.curr - totalAmount + this.frequency,
        ) +
        i * this.frequency;

      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        radius,
        this.x,
        this.y,
        radius * this.size,
      );

      const colorOpacity =
        (globalOpacity * Math.floor(255 * Math.pow(0.9, radius / 10))) / 255;

      hightestOpacity = Math.max(colorOpacity, hightestOpacity);

      gradient.addColorStop(0, chroma(this.color).alpha(0).hex());
      gradient.addColorStop(
        2 / 3,
        chroma(this.color).brighten(this.depth).alpha(colorOpacity).hex(),
      );
      gradient.addColorStop(
        1 / 3,
        chroma(this.color)
          .darken(this.depth / (this.rippleNum - i + 1))
          .alpha(colorOpacity)
          .hex(),
      );

      gradient.addColorStop(1, chroma(this.color).alpha(0).hex());

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    if (hightestOpacity < 0.05) {
      this.isEnd = true;
      return;
    }
  }
}
