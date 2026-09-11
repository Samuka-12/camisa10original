import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    sourcemap: false,
    target: "es2020",
    cssTarget: "chrome80",
    cssCodeSplit: true,
    // Sem manualChunks manuais: agrupar react/react-dom em um chunk separado
    // dos seus consumidores gerava ordem de execucao invalida em producao
    // ("React is not defined"). O Rollup resolve as dependencias sozinho.
    chunkSizeWarningLimit: 900,
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
