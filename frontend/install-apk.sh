#!/bin/bash
export PATH=~/android-sdk/platform-tools:$PATH

echo "🔍 Checking for connected Android devices..."
adb devices

echo ""
echo "📱 Installing BeautyCita APK..."
adb install -r /var/www/beautycita.com/frontend/android/app/build/outputs/apk/debug/app-debug.apk

echo ""
echo "✅ Installation complete!"
echo "Open BeautyCita on your Android device!"
