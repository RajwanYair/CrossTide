import type { CapacitorConfig } from "@capacitor/cli";

/**
 * R4: Capacitor configuration for native iOS/Android builds.
 *
 * Build steps:
 *   1. npm run build          → produces dist/
 *   2. npx cap sync          → copies dist/ to native projects
 *   3. npx cap open android  → opens in Android Studio
 *   4. npx cap open ios      → opens in Xcode
 */
const config: CapacitorConfig = {
  appId: "com.crosstide.app",
  appName: "CrossTide",
  webDir: "dist",
  server: {
    // In dev: proxy to local Vite server for HMR
    ...(process.env.NODE_ENV === "development" && {
      url: "http://localhost:5173",
      cleartext: true,
    }),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0f172a",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0f172a",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  ios: {
    scheme: "CrossTide",
  },
};

export default config;
