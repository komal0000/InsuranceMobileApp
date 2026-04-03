# Insurance Mobile App Setup

This project is an Ionic 8 + Angular 20 + Capacitor 8 mobile application.

## Prerequisites

- Node.js 20 LTS or newer
- npm
- Android Studio
- JDK 17 or newer
- Android SDK installed through Android Studio

## Project Location

Open a terminal in:

```powershell
cd c:\Insurance\InsuranceMobileApp
```

## Install Dependencies

```powershell
npm install
```

## Configure API URL

The mobile app calls the backend API from these files:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Current value:

```ts
apiUrl: 'http://192.168.254.20:8000/api'
```

Update this value if your Laravel backend is running on a different IP address, host, or port.

Important:

- For Android emulator, `localhost` usually will not work for the backend.
- If the backend is running on your machine, use your local network IP or emulator-specific host mapping when needed.
- Make sure the backend is reachable from the device or emulator.

## Backend Requirement

This app depends on the Laravel API in the sibling project:

```powershell
cd c:\Insurance\InsuranceApp
php artisan serve --host=0.0.0.0 --port=8000
```

If your backend uses database, queue, mail, or Firebase features, make sure that project is configured first.

## Run In Browser

```powershell
cd c:\Insurance\InsuranceMobileApp
npm start
```

This starts the Angular development server.

## Build Web Assets

```powershell
npm run build
```

Capacitor uses the generated `www` folder as the web output.

## Android Setup

The Android project already exists in:

```text
android/
```

After changing web code or installing Capacitor plugins, sync the native project:

```powershell
npx cap sync android
```

Open the Android project in Android Studio:

```powershell
npx cap open android
```

From Android Studio you can:

- let Gradle finish syncing
- select an emulator or connected device
- run the app

## Firebase / Push Notifications

This project includes Capacitor push notifications and already contains:

```text
android/app/google-services.json
```

Notes:

- If you change the Firebase project, replace `android/app/google-services.json` with the correct file.
- The current Android package values use `io.ionic.starter` in Capacitor and Gradle config. If you change the app ID, you must keep Firebase, Android, and Capacitor settings aligned.
- Push notifications will not work unless the Firebase configuration matches the app package name.

## Useful Commands

```powershell
npm start
npm run build
npm test
npm run lint
npx cap sync android
npx cap open android
```

## Common Setup Flow

```powershell
cd c:\Insurance\InsuranceMobileApp
npm install
npm start
```

For Android:

```powershell
cd c:\Insurance\InsuranceMobileApp
npm install
npm run build
npx cap sync android
npx cap open android
```

## Troubleshooting

### App cannot reach backend API

- Check the `apiUrl` value in both environment files.
- Confirm the Laravel backend is running.
- Confirm the phone or emulator can access the backend host.
- Check firewall rules on the backend machine.

### Android build fails after dependency changes

Run:

```powershell
npm run build
npx cap sync android
```

Then reopen Android Studio and allow Gradle to sync again.

### Push notifications do not work

- Verify `android/app/google-services.json` is correct.
- Verify the Firebase project package name matches the Android application ID.
- Confirm the app has notification permission on the device.

 ionic cap run android -l --external
