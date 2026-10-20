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
if [[ -z "$URL" || "$URL" == *"trycloudflare.com"* || "$URL" == *"REPLACE"* || "$URL" == *"example.com"* ]]; then
  echo "HATA: PROD_API_URL canlı domain olmalı (örn. https://api.meerk.com.tr)."
  exit 1
fi

echo "Test: $URL/health"
HOST_ONLY=${URL#https://}
HOST_ONLY=${HOST_ONLY#http://}
HOST_ONLY=${HOST_ONLY%%/*}
# Bazı Mac DNS resolver'ları yeni A kaydını gecikmeli görür; dig + --resolve fallback
IP=$(dig +short "$HOST_ONLY" A 2>/dev/null | grep -E '^[0-9.]+$' | head -1)
HTTP="000"
if [[ -n "$IP" ]]; then
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --resolve "${HOST_ONLY}:443:${IP}" "$URL/health" || true)
fi
if [[ "$HTTP" != "200" ]]; then
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$URL/health" || true)
fi
if [[ "$HTTP" != "200" ]]; then
  echo "HATA: API health yanıt vermiyor (HTTP ${HTTP:-000}). Host=$HOST_ONLY IP=${IP:-none}"
  exit 1
fi
echo "OK API ayakta (HTTP $HTTP)"

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
