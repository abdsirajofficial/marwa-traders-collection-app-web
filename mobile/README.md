# Marwa Traders — Cash Collector Mobile Application

React Native (Expo) application for field cash collectors.

---

## 1. Cash Collector Login Credentials

| Collector Name | Role | Access Code |
| :--- | :--- | :--- |
| **Ravi** | Cash Collector | **`4001`** |
| **Kumar** | Cash Collector | **`4002`** |
| *Any newly added collector* | Cash Collector | *The code assigned when created in Desktop app* |

---

## 2. Fast Testing on Your Android Phone (Expo Go)

You do **not** need to compile an APK to test. You can test live on your Android phone in 2 minutes:

### Step A: Connect Phone & PC to the Same Wi-Fi
Ensure your Android phone is connected to the same Wi-Fi router / hotspot as your PC (`192.168.31.x`).

### Step B: Install Expo Go on Android
Download and install **Expo Go** from Google Play Store on your Android phone.

### Step C: Verify API URL
Your local PC IP is configured in `.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.31.247:8080/api
```
*(If your PC Wi-Fi IP changes in the future, check `ipconfig` and update this address).*

### Step D: Start Expo
Open a terminal in the `mobile` folder and run:
```bash
cd mobile
npx expo start
```

### Step E: Scan QR Code with Phone
1. Open the **Expo Go** app on your Android phone.
2. Tap **"Scan QR code"**.
3. Point your camera at the QR code displayed in the terminal.
4. The application will load on your phone!
5. Enter code **`4001`** or **`4002`** and tap **LOGIN**.

---

## 3. Building Standalone Android APK

If you want an installable `.apk` file:

### Option 1: Cloud Build with EAS (Recommended - No Android Studio required)
```bash
cd mobile
npx eas-cli login
npx eas-cli build -p android --profile preview
```
Once the build finishes, EAS provides a direct link to download the `.apk` directly to your phone.

### Option 2: Local Android Build (Requires Android Studio & Android SDK)
```bash
cd mobile
npx expo run:android
```
