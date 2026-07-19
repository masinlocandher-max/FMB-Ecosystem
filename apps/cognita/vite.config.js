import base44 from "@base44/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const deployTarget = process.env.VITE_DEPLOY_TARGET;
  const isLegacyProjectPages = deployTarget === "github-project-pages";

  return {
    // Cognita now builds at the root path for thecognitainstitute.com.
    // The legacy GitHub project-site target remains available for emergency fallback builds.
    base: isLegacyProjectPages ? "/cognita-institute/" : "/",
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
