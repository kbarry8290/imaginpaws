import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "ImaginPaws",
  slug: "ImaginPaws",
  scheme: "imaginpaws",
  version: "1.0.0",
  icon: "./assets/images/appicon2.png",
  extra: {
    ...config.extra, // ← Keep any existing values!
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_IMAGINPAWS_API_KEY: process.env.EXPO_PUBLIC_IMAGINPAWS_API_KEY,
    EXPO_ROUTER_APP_ROOT: "app",
    eas: {
      projectId: "0d146bd6-645b-4257-b083-e8b4ff22e10f"
    }
  },
  plugins: [
    "expo-router"
  ],
  android: {
    package: "com.imaginpaws.app",
    adaptiveIcon: {
      foregroundImage: "./assets/images/appicon2.png",
      backgroundColor: "#ffffff"
    }
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.imaginpaws.app",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  }
});
