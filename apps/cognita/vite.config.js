import base44 from "@base44/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const deployTarget = process.env.VITE_DEPLOY_TARGET;
  const isLegacyProjectPages = deployTarget === "github-project-pages";
  const isLegacyEcosystem = deployTarget === "legacy-ecosystem";

  return {
    // Cognita deploys at the root on its independent production project.
    // The combined legacy ecosystem and GitHub fallback builds receive explicit bases.
    base: isLegacyProjectPages
      ? "/cognita-institute/"
      : isLegacyEcosystem
        ? "/_sites/cognita/"
        : "/",
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
