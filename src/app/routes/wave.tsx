import { createFileRoute } from "@tanstack/react-router";
import { Application, extend, useTick } from "@pixi/react";
import { BlurFilter, Container, Graphics } from "pixi.js";
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";

extend({
  Container,
  Graphics,
});

export const Route = createFileRoute("/wave")({
  component: WavePage,
});

function WavePage() {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <motion.div
        className=" bg-white rounded-xl overflow-hidden"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{
          scaleX: {
            type: "spring",
            duration: 1,
            bounce: 0.3,
          },
          opacity: {
            duration: 0.3,
            ease: "easeOut",
          },
        }}
      >
        <Application className="w-full h-full" background="0x75d877">
          <pixiContainer
            isRenderGroup
            alpha={0.5}
            filters={[
              new BlurFilter({
                strength: 20,
                quality: 1,
                clipToViewport: true,
              }),
            ]}
          >
            {Array.from({ length: 10 }).map((_, index) => (
              <Squeare key={index} />
            ))}
          </pixiContainer>
        </Application>
      </motion.div>
    </div>
  );
}

function Squeare() {
  const [rotation, setRotation] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  useEffect(() => {
    setX(Math.random() * 300);
    setY(Math.random() * 300);
  }, []);

  // 매 프레임마다 실행
  useTick((delta) => {
    if (rotation == 0) console.log(delta);
    setRotation((prev) => prev + 0.01 * delta.deltaMS);
  });

  const drawCallback = useCallback((graphics: Graphics) => {
    graphics.setFillStyle({ color: "#30bae4" });
    graphics.rect(-50, -50, 100, 100);
    graphics.fill();
  }, []);
  return <pixiGraphics draw={drawCallback} rotation={rotation} x={x} y={y} />;
}
