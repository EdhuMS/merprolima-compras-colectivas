import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ["@supabase/supabase-js"],
          forms: ["react-hook-form", "@hookform/resolvers/zod", "zod"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-slot"],
        },
      },
    },
  },
});
