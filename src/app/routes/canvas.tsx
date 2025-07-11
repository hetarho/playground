import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

export const Route = createFileRoute("/canvas")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full h-[calc(100vh-2.5rem)] bg-black flex items-center justify-center">
      <motion.div
        className="w-1/2 h-1/2 bg-white rounded-xl"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{
          scaleX: {
            type: "spring",
            duration: 1,
            bounce: 0.3
          },
          opacity: {
            duration: 0.3,
            ease: "easeOut"
          }
        }}
      />
    </div>
  );
}
