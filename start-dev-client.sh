#!/bin/bash

echo "🚀 Checking local environment for Expo Dev Client connection..."

# 1️⃣ Stop any existing Metro Bundler processes (port 8081/8082)
echo "🧹 Killing old Metro processes..."
lsof -ti:8081,8082 | xargs kill -9 2>/dev/null || true

# 2️⃣ Verify Expo installation
if ! command -v expo &>/dev/null; then
  echo "⚠️ Expo CLI not found, installing globally..."
  npm install -g expo-cli
fi

# 3️⃣ Verify local network IP (Wi-Fi)
WIFI_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo "Unknown")
echo "📡 Local Wi-Fi IP: ${WIFI_IP}"

if [[ "$WIFI_IP" == "Unknown" ]]; then
  echo "❌ Wi-Fi IP not found. Make sure you're connected to Wi-Fi."
  exit 1
fi

# 4️⃣ Clear Expo and Metro cache
echo "🧽 Clearing Expo cache..."
rm -rf .expo .expo-shared node_modules/.cache
rm -rf ios/build android/build
rm -rf ios/Pods android/.gradle

# 5️⃣ Check ngrok / tunnel mode connectivity
echo "🌐 Testing tunnel connectivity..."
NGROK_STATUS=$(curl -Is https://api.ngrok.com 2>/dev/null | head -n 1 | grep "200" || echo "")

if [[ -z "$NGROK_STATUS" ]]; then
  echo "⚠️ ngrok seems blocked or unstable, will use LAN mode instead."
  TUNNEL_MODE="LAN"
else
  TUNNEL_MODE="TUNNEL"
fi

# 6️⃣ Display connection info
echo "✅ Expo Dev Server will start!"
echo "---------------------------------------------"
echo "📱 On iPhone, open Expo Dev Client → Enter URL manually:"
echo ""

if [[ "$TUNNEL_MODE" == "LAN" ]]; then
  echo "👉 exp://${WIFI_IP}:8081"
else
  echo "👉 Tunnel URL will be shown after Expo starts"
fi

echo ""
echo "💡 Make sure iPhone and Mac are on the same Wi-Fi network!"
echo "---------------------------------------------"
echo ""

# 7️⃣ Start Expo Dev Client depending on mode
if [[ "$TUNNEL_MODE" == "LAN" ]]; then
  echo "🔗 Starting Expo Dev Client via LAN mode..."
  echo ""
  echo "📋 Connection URL for iPhone:"
  echo "   exp://${WIFI_IP}:8081"
  echo ""
  npx expo start --dev-client --port 8081 --lan --clear
else
  echo "🌀 Starting Expo Dev Client via Tunnel..."
  echo ""
  echo "📋 Tunnel URL will be displayed above after connection is established."
  echo ""
  npx expo start --dev-client --tunnel --clear
fi

