#!/bin/bash
set -e

export ANDROID_HOME=/opt/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

echo "=== 1. Creating SDK Directories ==="
mkdir -p /opt/android-sdk/cmdline-tools

echo "=== 2. Downloading Android Command Line Tools ==="
wget -q "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -O /tmp/cmdline-tools.zip

echo "=== 3. Extracting Command Line Tools ==="
unzip -q /tmp/cmdline-tools.zip -d /opt/android-sdk/cmdline-tools
rm /tmp/cmdline-tools.zip

# The zip extracts into /opt/android-sdk/cmdline-tools/cmdline-tools
# sdkmanager expects commandline tools to be under 'latest' or '<version>' folder
mv /opt/android-sdk/cmdline-tools/cmdline-tools /opt/android-sdk/cmdline-tools/latest

echo "=== 4. Accepting Android Licenses ==="
yes | sdkmanager --licenses || true

echo "=== 5. Installing Platform Tools, Build Tools, and Platforms ==="
sdkmanager --update
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

echo "=== Android SDK Installed Successfully ==="
