import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
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
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
