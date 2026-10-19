import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import type { IncomingMessage } from "http";
import { defineConfig } from "vite";

function proxyReportsProjetoHtmlOnly(req: IncomingMessage) {
    const pathname = (req.url ?? "").split("?")[0];
    if (pathname === "/reports-projeto" || pathname === "/reports-projeto/") {
        return false;
    }
}

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:5001",
                changeOrigin: true,
            },
            "/reports-projeto": {
                target: "http://127.0.0.1:5001",
                changeOrigin: true,
                bypass: proxyReportsProjetoHtmlOnly,
            },
        },
    },
    preview: {
        port: 4173,
        strictPort: true,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:5001",
                changeOrigin: true,
            },
            "/reports-projeto": {
                target: "http://127.0.0.1:5001",
                changeOrigin: true,
                bypass: proxyReportsProjetoHtmlOnly,
            },
        },
    },
});
