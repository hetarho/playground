import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import glsl from "vite-plugin-glsl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/app/routes",
      generatedRouteTree: "src/app/routes/_routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    glsl({
      include: ["**/*.glsl", "**/*.vert", "**/*.frag"],
    }),
  ],
});
