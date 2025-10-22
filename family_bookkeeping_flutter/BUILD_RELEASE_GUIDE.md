# 📦 Build Release Guide - AAB & IPA Files

**Current Version**: 1.0.1+2  
**Last Updated**: October 21, 2025  
**Status**: Ready for Release Build

---

## 📍 File Locations

### Where Release Files Will Be Generated

#### Android App Bundle (AAB)
```
After build, file will be at:
📂 build/app/outputs/bundle/release/app-release.aab

Location: /Users/zubairmalik/Desktop/Applications/book-keeping/family_bookkeeping_flutter/build/app/outputs/bundle/release/app-release.aab

Size: ~50-80 MB (varies by dependencies)
Use For: Google Play Store submission
```

#### iOS Package (IPA)
```
After build, file will be at:
📂 build/ios/ipa/family_bookkeeping_flutter.ipa

Location: /Users/zubairmalik/Desktop/Applications/book-keeping/family_bookkeeping_flutter/build/ios/ipa/family_bookkeeping_flutter.ipa

Size: ~100-150 MB
Use For: Apple App Store submission
```

---

## 🔨 Build Commands

### Step 1: Increment Version (If Needed)

**Current Version**: 1.0.1+2

To increment version, edit `pubspec.yaml`:
```yaml
version: 1.0.2+3  # Major.Minor.Patch+BuildNumber
```

### Step 2: Build Android App Bundle (AAB)

**For Google Play Store submission:**

```bash
cd /Users/zubairmalik/Desktop/Applications/book-keeping/family_bookkeeping_flutter

# Build release AAB
flutter build appbundle --release

# The file will be generated at:
# build/app/outputs/bundle/release/app-release.aab
```

**Expected Output**:
```
Running Gradle task 'bundleRelease'...
✓ Built build/app/outputs/bundle/release/app-release.aab (XX.XMB).
```

**Time to Build**: 5-10 minutes  
**Requirements**: 
- Android Keystore file
- Release keystore configured in `android/app/build.gradle.kts`

---

### Step 3: Build iOS Package (IPA)

**For Apple App Store submission:**

```bash
cd /Users/zubairmalik/Desktop/Applications/book-keeping/family_bookkeeping_flutter

# Build release IPA
flutter build ios --release

# The file will be generated at:
# build/ios/ipa/family_bookkeeping_flutter.ipa
```

**Expected Output**:
```
Building for iOS...
✓ Built build/ios/ipa/family_bookkeeping_flutter.ipa
```

**Time to Build**: 10-15 minutes  
**Requirements**:
- Apple Developer account
- Provisioning profiles configured
- Certificate signing

---

## ✅ Pre-Build Checklist

Before building, verify:

### Android
- [ ] Version incremented in `pubspec.yaml`
- [ ] `android/app/build.gradle.kts` has correct `applicationId`
- [ ] `release.keystore` file exists
- [ ] Keystore password available
- [ ] NDK version matches (27.0.12077973)
- [ ] Run `flutter pub get`
- [ ] Run `flutter clean` (optional but recommended)

### iOS
- [ ] Version incremented in `pubspec.yaml`
- [ ] `ios/Runner.xcodeproj` has correct `PRODUCT_BUNDLE_IDENTIFIER`
- [ ] Apple Developer account configured in Xcode
- [ ] Provisioning profiles installed
- [ ] Signing certificate valid
- [ ] Run `flutter pub get`
- [ ] Run `flutter clean` (optional but recommended)

---

## 🔧 Current Configuration

### Android Bundle ID
**Current**: `com.innnovatorsgeneration.familyBookkeeping`

Location: `android/app/build.gradle.kts`
```kotlin
defaultConfig {
    applicationId = "com.innnovatorsgeneration.familyBookkeeping"
    minSdk = flutter.minSdkVersion
    targetSdk = flutter.targetSdkVersion
    versionCode = flutter.versionCode
    versionName = flutter.versionName
}
```

### iOS Bundle ID
**Current**: `com.innnovatorsgeneration.familyBookkeeping`

Location: `ios/Runner.xcodeproj/project.pbxproj`
```
PRODUCT_BUNDLE_IDENTIFIER = com.innnovatorsgeneration.familyBookkeeping
```

---

## 📋 Building Step-by-Step

### Complete Build Workflow

```bash
# 1. Navigate to project
cd /Users/zubairmalik/Desktop/Applications/book-keeping/family_bookkeeping_flutter

# 2. Clean previous builds (recommended)
flutter clean

# 3. Get dependencies
flutter pub get

# 4. Build Android AAB
echo "🔨 Building Android App Bundle..."
flutter build appbundle --release
echo "✅ AAB built at: build/app/outputs/bundle/release/app-release.aab"

# 5. Build iOS IPA
echo "🔨 Building iOS Package..."
flutter build ios --release
echo "✅ IPA built at: build/ios/ipa/family_bookkeeping_flutter.ipa"

# 6. List output files
echo "📦 Generated files:"
ls -lh build/app/outputs/bundle/release/app-release.aab 2>/dev/null || echo "AAB not found"
ls -lh build/ios/ipa/family_bookkeeping_flutter.ipa 2>/dev/null || echo "IPA not found"
```

---

## 🐛 Troubleshooting

### Issue: "Keystore file not found"

**Solution**:
```bash
# Generate new keystore
keytool -genkey -v -keystore ~/key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias release -storepass android -keypass android

# Copy to android folder
cp ~/key.jks android/app/release.keystore

# Update android/app/build.gradle.kts with keystore path
```

### Issue: "Pod install failed"

**Solution**:
```bash
cd ios
pod repo update
pod install
cd ..
flutter build ios --release
```

### Issue: "Version code must be higher"

**Solution**:
```yaml
# In pubspec.yaml, increment:
version: 1.0.2+3  # +3 is higher than +2
```

---

## 📤 Submission Guide

### Google Play Store (AAB)

**File**: `build/app/outputs/bundle/release/app-release.aab`

**Steps**:
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Upload AAB file
4. Fill in app details
5. Request review

**Size Limit**: Up to 150 MB per app variant

### Apple App Store (IPA)

**File**: `build/ios/ipa/family_bookkeeping_flutter.ipa`

**Steps**:
1. Open Xcode project
2. Archive the app
3. Use Transporter app to upload
4. Or use `flutter run` with `--verbose` for debugging
5. Submit via App Store Connect

**Size Limit**: Recommended under 150 MB

---

## 📊 Version History

| Version | Build | Date | Status |
|---------|-------|------|--------|
| 1.0.0 | +1 | Sept 2025 | Initial Release |
| 1.0.1 | +2 | Oct 2025 | Bug Fixes |
| 1.0.2 | +3 | Pending | Next Release |

---

## 🔐 Security Checklist

Before submission, verify:

- [ ] No hardcoded API keys
- [ ] No debug code in release build
- [ ] All secrets in `.env` (not committed)
- [ ] Certificate pinning configured
- [ ] HTTPS enforced
- [ ] Input validation complete
- [ ] Error messages don't expose details
- [ ] Logging doesn't expose sensitive data

---

## 📱 App Store Information

### Display Info

**App Name**: Family Bookkeeping  
**Bundle ID**: com.innnovatorsgeneration.familyBookkeeping  
**Version**: 1.0.1+2  
**Minimum iOS**: iOS 11.0  
**Minimum Android**: API 21 (Android 5.0)  

---

## 🎯 Next Steps After Build

### After AAB is built:
```bash
# 1. Verify file exists and size
ls -lh build/app/outputs/bundle/release/app-release.aab

# 2. Extract and inspect (optional)
unzip -l build/app/outputs/bundle/release/app-release.aab | head -20

# 3. Upload to Google Play Console
```

### After IPA is built:
```bash
# 1. Verify file exists and size
ls -lh build/ios/ipa/family_bookkeeping_flutter.ipa

# 2. Use Transporter to upload
open -a Transporter

# 3. Or use flutter doctor to verify iOS setup
flutter doctor -v
```

---

## 📞 Support Commands

```bash
# Check Flutter version
flutter --version

# Check build status
flutter doctor

# Verbose build (for debugging)
flutter build appbundle --release --verbose

# List devices
flutter devices

# Check config
flutter config --list
```

---

## ✨ Release Checklist

Before releasing, complete:

- [ ] Code audit passed (✅ DONE - see CODE_AUDIT_COMPLETE.md)
- [ ] All tests passing
- [ ] Version incremented
- [ ] Changelog updated
- [ ] Screenshots prepared
- [ ] Description written
- [ ] Privacy policy ready
- [ ] Terms of service ready
- [ ] Contact email configured
- [ ] Build tested on device
- [ ] AAB generated
- [ ] IPA generated
- [ ] Files verified
- [ ] Submitted to stores

---

## 🚀 Quick Command Reference

```bash
# Full release build (both AAB and IPA)
cd /Users/zubairmalik/Desktop/Applications/book-keeping/family_bookkeeping_flutter && \
flutter clean && \
flutter pub get && \
flutter build appbundle --release && \
flutter build ios --release && \
echo "✅ Both builds complete!" && \
echo "📦 AAB: build/app/outputs/bundle/release/app-release.aab" && \
echo "📦 IPA: build/ios/ipa/family_bookkeeping_flutter.ipa"
```

---

**Status**: ✅ Ready for Release Build  
**Current Version**: 1.0.1+2  
**Generated**: October 21, 2025
