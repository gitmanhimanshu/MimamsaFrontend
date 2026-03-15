# Mimanasa APK Build Guide - Optimized for Smaller Size

## 🎯 Optimizations Applied

### Size Reduction Features:
- ✅ **ProGuard enabled** - Code shrinking & obfuscation
- ✅ **Resource shrinking** - Removes unused resources
- ✅ **Production build** - Optimized compilation
- ✅ **Minification** - Reduces code size

### Expected APK Size:
- **Without optimization**: ~50-80 MB
- **With optimization**: ~25-40 MB (50% reduction!)

## 📋 Prerequisites

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Ensure production environment is set in `.env`:
```env
ENV=production
API_BASE_URL=https://mimamsabackend.onrender.com/api
```

## 🚀 Build APK (Optimized)

### Method 1: EAS Build (Recommended - Smallest Size)

```bash
cd punch
eas build --platform android --profile production
```

**This will:**
- Use ProGuard to shrink code
- Remove unused resources
- Optimize for production
- Generate smallest possible APK

### Method 2: Preview Build (For Testing)

```bash
cd punch
eas build --platform android --profile preview
```

### Method 3: Local Build (If you have Android Studio)

```bash
cd punch
eas build --platform android --profile production --local
```

## 📊 Build Process

1. **Start Build**:
   ```bash
   cd punch
   eas build --platform android --profile production
   ```

2. **Monitor Progress**:
   - Build runs on EAS servers
   - Takes 10-20 minutes
   - You'll get a monitoring link

3. **Download APK**:
   - Download link provided after completion
   - Or visit: https://expo.dev/accounts/[your-account]/projects/mimanasa/builds

## ⚙️ Configuration Files

### eas.json (Optimized)
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease",
        "enableProguardInReleaseBuilds": true,
        "enableShrinkResourcesInReleaseBuilds": true,
        "env": {
          "API_BASE_URL": "https://mimamsabackend.onrender.com/api",
          "ENV": "production"
        }
      }
    }
  }
}
```

### app.json (Optimized)
```json
{
  "android": {
    "enableProguardInReleaseBuilds": true,
    "enableShrinkResourcesInReleaseBuilds": true
  }
}
```

## 🔧 Additional Size Optimization Tips

### 1. Remove Unused Assets
```bash
# Check assets folder
cd punch/assets
# Remove any unused images or files
```

### 2. Compress Images
- Use tools like TinyPNG or ImageOptim
- Reduce image dimensions if too large
- Convert PNG to WebP where possible

### 3. Remove Unused Dependencies
```bash
cd punch
npm prune
```

### 4. Enable Hermes (Already enabled)
- Hermes engine reduces APK size
- Faster startup time
- Lower memory usage

## 📱 Testing APK

1. **Download APK** from EAS build
2. **Transfer to Android device**
3. **Enable "Install from Unknown Sources"**
4. **Install and test**:
   - Login/Register
   - Browse books
   - View PDFs
   - Upload content (admin)
   - Test poems feature
   - Test reviews

## 🔄 Version Management

Update before each build:
```json
// In app.json
{
  "version": "1.0.0",
  "android": {
    "versionCode": 1  // Increment for each build
  }
}
```

## 🐛 Troubleshooting

### Build Failed?
1. Check EAS build logs
2. Verify all dependencies installed
3. Ensure app.json and eas.json are valid

### APK Too Large?
- ProGuard already enabled ✅
- Resource shrinking enabled ✅
- Check for large assets in `assets/` folder
- Compress images

### Installation Issues?
- Enable "Unknown Sources" on Android
- Check minimum Android version (5.0+)
- Verify APK is not corrupted

## 📈 Build Comparison

| Build Type | Size | ProGuard | Resource Shrink | Use Case |
|------------|------|----------|-----------------|----------|
| Development | ~80 MB | ❌ | ❌ | Testing only |
| Preview | ~40 MB | ✅ | ✅ | Beta testing |
| Production | ~25-35 MB | ✅ | ✅ | Release |

## 🎯 Quick Commands

```bash
# Install dependencies
cd punch
npm install

# Build optimized production APK
eas build --platform android --profile production

# Check build status
eas build:list

# View specific build
eas build:view [build-id]

# Cancel build
eas build:cancel [build-id]
```

## 📝 Environment Variables

Production build automatically uses:
- `API_BASE_URL`: https://mimamsabackend.onrender.com/api
- `ENV`: production
- `CLOUDINARY_CLOUD_NAME`: dbizsbr3w
- `CLOUDINARY_UPLOAD_PRESET`: punch_data

## 🚀 Publishing Updates (After APK Installed)

Push updates without rebuilding:
```bash
eas update --branch production --message "Bug fixes and improvements"
```

## 📦 Google Play Store (Future)

### Build AAB for Play Store:
```bash
eas build --platform android --profile production
# Select AAB instead of APK
```

### Requirements:
- Google Play Developer account ($25)
- Privacy policy URL
- App screenshots
- Content rating

## 💡 Pro Tips

1. **First build takes longer** (20-30 min)
2. **Subsequent builds faster** (10-15 min)
3. **Free tier**: 30 builds/month
4. **ProGuard warnings are normal**
5. **Test thoroughly before release**

## 📞 Support

- EAS Documentation: https://docs.expo.dev/build/introduction/
- Expo Forums: https://forums.expo.dev/
- GitHub Issues: Report bugs in your repo

---

**Ready to build?** Run:
```bash
cd punch
eas build --platform android --profile production
```

Your optimized APK will be ready in 10-20 minutes! 🎉
