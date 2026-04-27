import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteSingleFile } from "vite-plugin-singlefile";

// codem-phone iframe srcdoc'a tek bir self-contained HTML gönderir.
// vite-plugin-singlefile tüm JS/CSS/asset'leri index.html'e inline'lar.
// Bu config src/ içinde olduğu için outDir resource köküne göre relative: ../ui
export default defineConfig({
    plugins: [vue(), viteSingleFile()],
    build: {
        outDir: "../ui",
        emptyOutDir: false, // ui/icon.svg'yi koru
        cssCodeSplit: false,
        assetsInlineLimit: 100000000,
    },
});
