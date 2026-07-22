import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Fix bundling of @rialo packages
    conditions: ["browser", "module", "import"],
  },
});
