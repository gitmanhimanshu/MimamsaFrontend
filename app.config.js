export default {
  expo: {
    name: "Mimanasa",
    slug: "mimanasa",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mimanasa",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mimanasa.app"
    },
    android: {
      package: "com.mimanasa.app",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#1a1a2e",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
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
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#1a1a2e",
          "dark": {
            "backgroundColor": "#1a1a2e"
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
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      eas: {
        projectId: '5414e30a-2a56-4dea-b3ad-434172cdbcbc'
      },
      router: {}
      
    }
  }
};
