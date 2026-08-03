# BlueDate — Cloudflare tunnel + TestFlight

## Hızlı akış (DemoBleApp ile aynı)

### 1) API
```bash
cd ~/RiderProjects/AD_BlueDateApp
dotnet run --project src/AD_BlueDate.API.Package/AD_BlueDate.API --urls "http://127.0.0.1:5135"
```

### 2) Tunnel (URL’yi mobil config’e yazar)
```bash
chmod +x deploy/quick-tunnel.sh
./deploy/quick-tunnel.sh
```

Çıkan `https://xxxx.trycloudflare.com` otomatik olarak şuraya yazılır:

`BlueDate_Mobile/src/config/api.ts` → `PROD_API_URL`

`USE_PRODUCTION = true` olmalı.

### 3) TestFlight hazırlık
```bash
cd ~/BleDate_Mobile/BlueDate_Mobile
chmod +x scripts/testflight-prepare.sh
./scripts/testflight-prepare.sh
```

### 4) Xcode Archive
1. `ios/BlueDate.xcworkspace` aç
2. Destination: **Any iOS Device (arm64)**
3. **Product → Archive**
4. **Distribute App → App Store Connect → Upload**

## Notlar
- Quick tunnel URL **her açılışta değişir**. TestFlight’taki build o URL’yi taşır; demo günü Mac’te **aynı tunnel + API açık** kalmalı.
- Kalıcı domain istersen (daha sonra) named Cloudflare tunnel + kendi domain gerekir.
- Simulator lokal debug: `USE_PRODUCTION = false`
