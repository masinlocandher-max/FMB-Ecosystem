import base44 from "@base44/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const deployTarget = process.env.VITE_DEPLOY_TARGET;
  const isLegacyProjectPages = deployTarget === "github-project-pages";
  const isVercelDeployment = Boolean(process.env.VERCEL);

  return {
    // Production Vercel remains root-based. Local and combined static audits use
    // relative assets so the same build also renders correctly under /_sites/cognita/.
    base: isLegacyProjectPages ? "/cognita-institute/" : isVercelDeployment ? "/" : "./",
    plugins: [
      base44({
        // Support for legacy code that imports the Base44 SDK with @/integrations, @/entities, etc.
        legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === "true",
        hmrNotifier: true,
        navigationNotifier: true,
        analyticsTracker: true,
        visualEditAgent: true,
      }),
      react(),
    ],
  };
});
