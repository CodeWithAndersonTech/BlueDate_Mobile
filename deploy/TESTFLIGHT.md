# BlueDate / Meerk — TestFlight

## Canlı API
Mobil config: `src/config/api.ts`
- `USE_PRODUCTION = true`
- `PROD_API_URL = 'https://api.meerk.com.tr'`

## Hazırlık
```bash
cd ~/BleDate_Mobile/BlueDate_Mobile
npm run testflight:prepare
```

## Archive + Upload (CLI)
```bash
# Archive
xcodebuild -workspace ios/BlueDate.xcworkspace \
  -scheme BlueDate -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath ios/build/BlueDate.xcarchive \
  archive

# App Store Connect'e yükle
xcodebuild -exportArchive \
  -archivePath ios/build/BlueDate.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath ios/build/export
```

## Xcode (manuel)
1. `ios/BlueDate.xcworkspace` aç
2. Destination: **Any iOS Device (arm64)**
3. **Product → Archive**
4. **Distribute App → App Store Connect → Upload**

## Notlar
- Lokal debug: `USE_PRODUCTION = false`
- Her yeni TestFlight yüklemesinde `CURRENT_PROJECT_VERSION` artmalı
