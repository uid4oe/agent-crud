import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query", "@trpc/client", "@trpc/react-query"],
          ui: ["lucide-react", "class-variance-authority", "clsx", "tailwind-merge"],
          forms: ["zod", "react-hook-form", "@hookform/resolvers"],
        },
      },
    },
  },
});
