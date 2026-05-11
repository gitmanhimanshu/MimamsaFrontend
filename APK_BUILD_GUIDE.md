# Mimanasa Mobile App - Build & Deployment Guide

## What's New in v2.0.0

- Light orange theme aligned with web app
- Social feed with Stories, Likes, Bookmarks
- Environment-based configuration via `.env`
- Optimized APK builds (ProGuard + resource shrinking)

---

## Environment Setup

### 1. Configure Environment Variables

Create a `.env` file in the project root (if not already present):

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# API Configuration
API_BASE_URL=https://mimamsabackend.onrender.com/api
ENV=production

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Optional: EAS Project ID
EAS_PROJECT_ID=5414e30a-2a56-4dea-b3ad-434172cdbcbc
```

> The `.env` file is **gitignored** for security. Never commit it.

### 2. Install EAS CLI (if not installed)

```bash
npm install -g eas-cli
```

### 3. Login to Expo

```bash
eas login
```

---

## Build APK (Optimized for Small Size)

### Option A: Production APK (~25-35 MB)

```bash
eas build --platform android --profile production
```

**Optimizations applied:**
- ProGuard code shrinking & obfuscation
- Resource shrinking (removes unused assets)
- Release compilation with R8
- Minified JS bundle

### Option B: Preview APK (~25-35 MB)

For internal testing before release:

```bash
eas build --platform android --profile preview
```

### Option C: Production AAB (for Google Play Store)

```bash
eas build --platform android --profile production-aab
```

AAB is ~20-30% smaller download size than APK. Google Play Store requires AAB.

### Option D: Local Build (requires Android Studio + SDK)

```bash
eas build --platform android --profile production --local
```

---

## APK Size Comparison

| Build Type | Size | ProGuard | Resource Shrink | Use Case |
|------------|------|----------|-----------------|----------|
| Development | ~60-80 MB | No | No | Local testing |
| Preview | ~25-35 MB | Yes | Yes | Beta testing |
| Production | ~25-35 MB | Yes | Yes | Release |
| Production AAB | ~15-25 MB | Yes | Yes | Play Store |

---

## Monitoring Your Build

```bash
# List all builds
eas build:list

# View specific build
eas build:view [build-id]

# Cancel a build
eas build:cancel [build-id]
```

Builds typically take **10-20 minutes** on EAS servers.

---

## After Build: Download & Install

1. Download APK from the link provided after build completion
2. Transfer to Android device
3. Enable **Install from Unknown Sources** in Settings
4. Install and test

Or visit your builds dashboard:
```
https://expo.dev/accounts/[your-account]/projects/mimanasa/builds
```

---

## Push OTA Updates (No Rebuild Needed)

After users have installed the APK, push updates without rebuilding:

```bash
eas update --branch production --message "Bug fixes and new features"
```

This updates the JS bundle instantly without requiring users to reinstall.

---

## Version Management

Before each release, bump the version in `app.config.js`:

```javascript
version: "2.0.1",      // User-visible version
android: {
  versionCode: 3,      // Must be an integer, increment by 1 each build
}
```

Or use `autoIncrement` in `eas.json` (already enabled) to auto-bump.

---

## Configuration Reference

### `app.config.js` (Single Source of Truth)

All app configuration lives here:
- App name, slug, version
- Android/iOS settings
- Splash screen colors
- Environment variables via `process.env`
- APK optimizations (ProGuard, resource shrinking)

### `eas.json` (Build Profiles)

Defines build environments:
- `production` → Optimized APK
- `production-aab` → Play Store AAB
- `preview` → Internal testing APK
- `development` → Development client

### `.env` (Local Secrets)

Never commit this file. Contains:
- API base URL
- Cloudinary credentials
- EAS project ID

---

## Troubleshooting

### Build Failed?
1. Check EAS build logs at the provided URL
2. Verify `app.config.js` is valid JavaScript
3. Ensure all dependencies installed: `npm install`

### APK Too Large?
- ProGuard and resource shrinking are already enabled
- Check `assets/` folder for oversized images
- Compress images with TinyPNG before adding to assets

### App Crashes on Launch?
- Verify `API_BASE_URL` is accessible from the device
- Check that backend CORS allows your app origin
- Review crash logs via `adb logcat` (local) or EAS dashboard

### Environment Variables Not Working?
- `.env` only works for local `expo start`
- For EAS builds, env vars must be in `eas.json` `env` section
- Both are already configured

---

## Quick Reference Commands

```bash
# Start development server
npx expo start

# Build production APK
eas build --platform android --profile production

# Build Play Store AAB
eas build --platform android --profile production-aab

# Preview build for testing
eas build --platform android --profile preview

# Push OTA update
eas update --branch production --message "Update description"

# Check build status
eas build:list
```

---

## Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [APK Size Optimization](https://developer.android.com/studio/build/shrink-code)
