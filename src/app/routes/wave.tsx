import { createFileRoute } from "@tanstack/react-router";
import { Application, extend } from "@pixi/react";
import { Container, Graphics } from "pixi.js";
import { useCallback } from "react";

extend({
  Container,
  Graphics,
});

export const Route = createFileRoute("/wave")({
  component: WavePage,
});

function WavePage() {
  const drawCallback = useCallback((graphics: Graphics) => {
    graphics.clear();
    graphics.setFillStyle({ color: "red" });
    graphics.rect(0, 0, 100, 100);
    graphics.fill();
  }, []);

  return (
    <div className="wave-page">
      <h1>Wave Animation</h1>
      <p>PixiJS React를 사용한 파도 애니메이션</p>
      <div className="wave-container">
        <Application>
          <pixiContainer x={100} y={100}>
            <pixiGraphics draw={drawCallback} />
          </pixiContainer>
        </Application>
      </div>
    </div>
  );
}
