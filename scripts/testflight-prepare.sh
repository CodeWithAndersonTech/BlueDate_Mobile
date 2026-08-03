#!/usr/bin/env bash
# TestFlight / Xcode Archive öncesi kontrol
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="${ROOT}/src/config/api.ts"

echo "=== 1) API URL ==="
grep -E "USE_PRODUCTION|PROD_API_URL" "$CONFIG" || true

if ! grep -q "USE_PRODUCTION = true" "$CONFIG"; then
  echo "HATA: USE_PRODUCTION = true olmalı (TestFlight HTTPS)."
  exit 1
fi

URL=$(grep "PROD_API_URL" "$CONFIG" | sed -n "s/.*'\(https[^']*\)'.*/\1/p" | head -1)
if [[ -z "$URL" || "$URL" == *"REPLACE-WITH-TUNNEL"* || "$URL" == *"example.com"* ]]; then
  echo "HATA: PROD_API_URL güncel değil."
  echo "  Önce: AD_BlueDateApp/deploy/quick-tunnel.sh"
  exit 1
fi

echo "Test: $URL"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 8 "$URL/swagger/index.html" || echo "000")
if [[ "$HTTP" != "200" && "$HTTP" != "301" && "$HTTP" != "302" && "$HTTP" != "404" ]]; then
  # 404 can still mean tunnel+host is up (no swagger path). Try root.
  HTTP2=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 8 "$URL/" || echo "000")
  if [[ "$HTTP2" == "000" ]]; then
    echo "UYARI: API yanıt vermiyor (HTTP $HTTP / $HTTP2). Backend + cloudflared açık mı?"
    read -r -p "Yine de devam? (y/N) " a
    [[ "${a:-}" == "y" || "${a:-}" == "Y" ]] || exit 1
  else
    echo "OK tunnel ayakta (HTTP $HTTP2)"
  fi
else
  echo "OK API ayakta (HTTP $HTTP)"
fi

echo ""
echo "=== 2) Pod install ==="
cd "${ROOT}/ios"
pod install

echo ""
echo "=== HAZIR ==="
echo "Xcode: ios/BlueDate.xcworkspace"
echo "  1) Any iOS Device (arm64)"
echo "  2) Product > Archive"
echo "  3) Distribute App > App Store Connect > Upload"
echo ""
echo "API: $URL"
echo ""
echo "ÖNEMLİ: Quick tunnel URL her restart'ta değişir."
echo "TestFlight testi sırasında Mac'te API + cloudflared açık kalsın."
