import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "ImaginPaws",
  slug: "ImaginPaws",
  extra: {
    ...config.extra, // ← Keep any existing values!
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: "0d146bd6-645b-4257-b083-e8b4ff22e10f"
    }
  },
  plugins: [
    [
      "sentry-expo",
      {
        organization: "imaginpaws",
        project: "imaginpaws"
      }
    ],
    "expo-router"
  ],
  hooks: {
    postPublish: [
      {
        file: "sentry-expo/upload-sourcemaps",
        config: {
          organization: "imaginpaws",
          project: "imaginpaws"
        }
      }
    ]
  }
});
