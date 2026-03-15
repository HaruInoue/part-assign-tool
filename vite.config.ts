import { reactRouter } from "@react-router/dev/vite";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/part-assign-tool/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "app"),
    },
  },
  plugins: [reactRouter(), tsconfigPaths()],
});
