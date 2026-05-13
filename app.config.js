export default {
  expo: {
    name: "Mimanasa",
    slug: "mimamsa",
    owner: "himanshu45",
    version: "2.1.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mimanasa",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mimanasa.app"
    },
    android: {
      package: "com.mimanasa.app",
      versionCode: 2,
      adaptiveIcon: {
        backgroundColor: "#FFF5E6",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      // Only include required permissions
      permissions: [
        "INTERNET",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "CAMERA"
      ]
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFF5E6",
          dark: {
            backgroundColor: "#FFF5E6"
          }
        }
      ],
      // Release-build size optimizations. Previously these flags were placed
      // directly under `expo.android` (which Expo silently ignores) — they must
      // live inside the expo-build-properties plugin to actually take effect.
      [
        "expo-build-properties",
        {
          android: {
            // Strip + obfuscate unused Java/Kotlin code in release builds.
            enableProguardInReleaseBuilds: true,
            // Strip unused Android resources (drawables, strings, layouts).
            enableShrinkResourcesInReleaseBuilds: true,
            // Keep SVG runtime classes the bundler emits dynamically.
            extraProguardRules: "-keep public class com.horcrux.svg.** {*;}",
            // Emit a separate APK per CPU architecture instead of one fat
            // APK that ships native libs for every arch. Cuts per-APK size
            // roughly in half. universalApk:false skips the fat APK.
            enableSeparateBuildPerCPUArchitecture: true,
            universalApk: false
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || "https://mimamsabackend.onrender.com/api",
      env: process.env.ENV || "production",
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "dbizsbr3w",
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "punch_data",
      eas: {
        projectId: process.env.EAS_PROJECT_ID || '5414e30a-2a56-4dea-b3ad-434172cdbcbc'
      },
      router: {}
    }
  }
};
