#!/bin/bash
set -e

# Env variables
export ANDROID_HOME=/opt/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

echo "=== 1. Building React Web App ==="
npm run build

echo "=== 2. Creating Release Keystore ==="
if [ ! -f "release.keystore" ]; then
  keytool -genkeypair -v \
    -keystore release.keystore \
    -alias visionx_release \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass visionx123 \
    -keypass visionx123 \
    -dname "CN=VisionX, OU=VisionX, O=VisionX, L=Karachi, S=Sindh, C=PK"
  echo "Keystore release.keystore generated successfully."
else
  echo "Keystore already exists."
fi

echo "=== 3. Adding and Syncing Capacitor Android Platform ==="
if [ ! -d "android" ]; then
  npx cap add android
else
  npx cap sync android
fi

echo "=== 4. Updating android/app/build.gradle with Signing Configs & Production Details ==="
# We will write a python script to parse and update the build.gradle file safely, or use sed.
# Let's write a python snippet to do a highly robust replace of signingConfigs and buildTypes.
python3 -c '
import os

gradle_path = "android/app/build.gradle"
if os.path.exists(gradle_path):
    with open(gradle_path, "r") as f:
        content = f.read()

    # Define the signing configuration block
    signing_block = """    signingConfigs {
        release {
            storeFile file("../../release.keystore")
            storePassword "visionx123"
            keyAlias "visionx_release"
            keyPassword "visionx123"
        }
    }"""

    # Insert signingConfigs before buildTypes
    if "signingConfigs" not in content:
        content = content.replace("buildTypes {", signing_block + "\n\n    buildTypes {")

    # Update release buildType to use our signing configuration
    if "signingConfig signingConfigs.release" not in content:
        if "buildTypes {" in content:
            parts = content.split("buildTypes {")
            parts[1] = parts[1].replace("release {", "release {\n            signingConfig signingConfigs.release", 1)
            content = "buildTypes {".join(parts)

    # Update versionCode and versionName using robust regex with escaped double quotes
    import re
    content = re.sub(r"versionCode \d+", "versionCode 100", content)
    content = re.sub(r"versionName \"[^\"]+\"", "versionName \"1.0.0\"", content)

    with open(gradle_path, "w") as f:
        f.write(content)
    print("Gradle file updated successfully with production versions and release signing configs.")
else:
    print("Gradle file not found!")
'

echo "=== 5. Setting Up Android Permissions and Intent Filters ==="
# Configure AndroidManifest.xml for required permissions and deep links
# Camera, Audio, Internet, Storage
python3 -c '
import os

manifest_path = "android/app/src/main/AndroidManifest.xml"
if os.path.exists(manifest_path):
    with open(manifest_path, "r") as f:
        content = f.read()

    # Permissions to add
    permissions = """
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
    """

    # Insert permissions right before <application
    if "android.permission.CAMERA" not in content:
        content = content.replace("<application", permissions + "\n    <application")

    # Add Deep Link Intent Filter for Android production domain
    deeplink = """            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="ais-pre-lh66pgwfqg2rxh4ag3fqz4-437927335979.asia-southeast1.run.app" />
            </intent-filter>"""
    
    if "android.intent.category.LAUNCHER" in content and "autoVerify" not in content:
        content = content.replace("</intent-filter>", "</intent-filter>\n\n" + deeplink, 1)

    # Enable cleartext traffic if needed for localhost API fallback (though we use prod HTTPS)
    content = content.replace("<application", "<application android:usesCleartextTraffic=\"true\"")

    with open(manifest_path, "w") as f:
        f.write(content)
    print("AndroidManifest.xml updated with camera, audio, internet and storage permissions.")
else:
    print("AndroidManifest.xml not found!")
'

echo "=== 6. Compiling Production Signed APK and AAB ==="
cd android

# Grant execution rights to gradlew
chmod +x gradlew

# Clean first
./gradlew clean

# Build APK
echo ">>> Building Signed Release APK..."
./gradlew assembleRelease

# Build AAB
echo ">>> Building Signed Release AAB..."
./gradlew bundleRelease

echo "=== 7. Collecting Compiled Binaries ==="
cd ..
mkdir -p android-release-binaries

cp android/app/build/outputs/apk/release/app-release.apk android-release-binaries/VisionX_AI_Release.apk
cp android/app/build/outputs/bundle/release/app-release.aab android-release-binaries/VisionX_AI_Release.aab

echo "=========================================================="
echo "SUCCESS! Production signed binaries generated successfully!"
echo "APK location: /android-release-binaries/VisionX_AI_Release.apk"
echo "AAB location: /android-release-binaries/VisionX_AI_Release.aab"
echo "=========================================================="
