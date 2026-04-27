import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// codem-phone iframe srcdoc'a tek bir self-contained HTML gönderir.
// vite-plugin-singlefile JS/CSS/asset'leri index.html'e inline'lar.
// Bu config src/ içinde olduğu için outDir resource köküne göre relative: ../ui
export default defineConfig({
    plugins: [react(), viteSingleFile()],
    build: {
        outDir: "../ui",
        emptyOutDir: false,
        cssCodeSplit: false,
        assetsInlineLimit: 100000000,
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
                manualChunks: () => "everything.js",
            },
        },
    },
});
