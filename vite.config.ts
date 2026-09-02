import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ command }) => {
  const shared = {
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  };

  if (command === "serve") {
    return {
      ...shared,
      root: "demo",
      server: { port: 3000, open: true },
    };
  }

  return {
    ...shared,
    build: {
      lib: {
        entry: resolve(__dirname, "src/lightning-proximity-card.ts"),
        name: "LightningProximityCard",
        fileName: "lightning-proximity-card",
        formats: ["es"],
      },
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: true,
      target: "es2022",
    },
  };
});
