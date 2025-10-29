#!/bin/bash
# Install authentication system dependencies for BeautyCita Mobile App

set -e

echo "Installing react-native-linear-gradient..."
npm install react-native-linear-gradient

echo ""
echo "Dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. For iOS: cd ios && pod install && cd .."
echo "2. Configure Google Sign-In (see AUTH_SYSTEM_README.md)"
echo "3. Add biometric permissions (see AUTH_SYSTEM_README.md)"
echo "4. Test on physical device"
echo ""
echo "Documentation: mobile-native/AUTH_SYSTEM_README.md"
