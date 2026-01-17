# Mimamsa APK Build Guide

## Environment Configuration

### For Local Development
Update `punch/.env`:
```env
ENV=development
API_BASE_URL=http://192.168.1.22:8000/api
CLOUDINARY_CLOUD_NAME=dbizsbr3w
CLOUDINARY_UPLOAD_PRESET=punch_data
```

### For Production (APK)
Update `punch/.env`:
```env
ENV=production
API_BASE_URL=https://mimamsabackend.onrender.com/api
CLOUDINARY_CLOUD_NAME=dbizsbr3w
CLOUDINARY_UPLOAD_PRESET=punch_data
```

## Build APK Methods

### Method 1: EAS Build (Recommended)

#### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

#### Step 2: Login to Expo
```bash
eas login
```

#### Step 3: Configure EAS
```bash
cd punch
eas build:configure
```

#### Step 4: Build APK
```bash
# For production APK
eas build --platform android --profile production

# For preview APK (faster, for testing)
eas build --platform android --profile preview
```

#### Step 5: Download APK
- Go to https://expo.dev/accounts/[your-account]/projects/mimamsa/builds
- Download the APK when build completes (10-15 minutes)
- Install on Android device

### Method 2: Local Build (Expo Go)

#### For Testing Only (Not standalone APK)
```bash
cd punch
npx expo start
```
Then scan QR code with Expo Go app.

### Method 3: Android Studio Build (Advanced)

#### Step 1: Prebuild
```bash
cd punch
npx expo prebuild --platform android
```

#### Step 2: Build with Gradle
```bash
cd android
./gradlew assembleRelease
```

#### Step 3: Find APK
APK location: `android/app/build/outputs/apk/release/app-release.apk`

## EAS Build Configuration

Create `punch/eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "env": {
          "API_BASE_URL": "https://mimamsabackend.onrender.com/api",
          "ENV": "production"
        }
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

## Testing APK

### Before Building:
1. ✅ Backend is live on Render
2. ✅ Test API endpoints: https://mimamsabackend.onrender.com/api/books/
3. ✅ Update .env with production URL
4. ✅ Test app locally with production URL

### After Building:
1. Install APK on Android device
2. Test login/register
3. Test book listing
4. Test PDF upload and viewing
5. Test image uploads

## Troubleshooting

### Build Fails
- Check `app.config.js` syntax
- Verify all assets exist (icon, splash screen)
- Check package.json dependencies

### API Connection Issues
- Verify API_BASE_URL in .env
- Check backend is running on Render
- Test API in browser first

### APK Won't Install
- Enable "Install from Unknown Sources" on Android
- Check Android version compatibility (min SDK 21)
- Verify APK is not corrupted

## Environment Switching

### Switch to Local Development:
```bash
# Update .env
ENV=development
API_BASE_URL=http://192.168.1.22:8000/api

# Restart Expo
npx expo start --clear
```

### Switch to Production:
```bash
# Update .env
ENV=production
API_BASE_URL=https://mimamsabackend.onrender.com/api

# Restart Expo
npx expo start --clear
```

## Publishing Updates (After APK is installed)

With EAS Update, you can push updates without rebuilding APK:
```bash
eas update --branch production --message "Bug fixes"
```

## App Store Deployment (Future)

### Google Play Store:
1. Build AAB instead of APK:
   ```bash
   eas build --platform android --profile production
   ```
2. Upload to Google Play Console
3. Fill app details, screenshots
4. Submit for review

### Requirements:
- Google Play Developer account ($25 one-time)
- Privacy policy URL
- App screenshots and description
- Content rating

## Quick Commands

```bash
# Install dependencies
cd punch
npm install

# Start development server
npx expo start

# Build production APK
eas build --platform android --profile production

# Check build status
eas build:list

# View logs
eas build:view [build-id]
```

## Notes

- Free Expo account: 30 builds/month
- Build time: 10-15 minutes
- APK size: ~50-80 MB
- Minimum Android version: 5.0 (API 21)
- Backend must be live before testing APK
