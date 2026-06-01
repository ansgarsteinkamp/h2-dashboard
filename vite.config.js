import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

function configuredExportDir(env) {
   const exportDir = env.VITE_DASHBOARD_EXPORT_DIR;
   if (!exportDir) return null;
   return resolve(rootDir, exportDir);
}

export default defineConfig(({ mode }) => {
   const env = loadEnv(mode, rootDir, "");
   const exportDir = configuredExportDir(env);

   return {
      base: env.VITE_BASE_PATH || "/",
      plugins: [react(), tailwindcss()],
      resolve: {
         alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
         }
      },
      server: {
         host: "127.0.0.1",
         fs: {
            strict: true,
            allow: [rootDir, ...(exportDir ? [exportDir] : [])]
         }
      }
   };
});
