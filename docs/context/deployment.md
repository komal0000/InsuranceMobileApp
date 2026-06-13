# InsuranceMobileApp Deployment Context

Last updated: 2026-06-13

Mobile deployment notes and backend reference pointers.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

## Deployment Notes
- Environment API URL is configured in:
  - `src\environments\environment.ts`
  - `src\environments\environment.prod.ts`
- Before production release, replace LAN API URLs with public HTTPS backend URL.
- Capacitor app id may still be starter value and should be aligned with Firebase/package name before production.
- Mobile release flow:
```powershell
cd C:\Insurance\InsuranceMobileApp
npm run build
npx cap sync android
npm run android:release:apk
npm run android:release:aab
```
- Release npm scripts use `scripts/android-gradle.cjs` to choose the Gradle wrapper by platform: `gradlew.bat` on Windows and `sh ./gradlew` on macOS/Linux.
- `npm run android:release:apk` runs Gradle `installRelease`, so it builds the release APK artifact and installs it on the connected Android device. Use `npm run android:gradle -- assembleRelease` when only an APK artifact is needed.
- macOS release script verified on 2026-05-13:
  - `npm run android:release:apk` succeeds, creates `android/app/build/outputs/apk/release/app-release.apk`, and installs it on connected device `CPH2569 - 15`.
  - `npm run android:install:release` remains an explicit connected-device install command for release APKs.
  - `npm run android:gradle -- bundleRelease` succeeds and creates the release AAB through the same platform-aware helper.
  - Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).
- Header/status-bar overlap fix verified on 2026-05-12:
  - `npm run build`, `npx cap sync android`, and `npm run android:release:apk` succeeded after StatusBar/native resource changes; the resulting release APK was installed on connected Android 15 device `CPH2569`.
  - Generated `android/app/src/main/assets/capacitor.config.json` includes `StatusBar.overlaysWebView=false`, `backgroundColor="#003087"`, and `style="DARK"`.
  - Android header spacing depends on Capacitor StatusBar non-overlay config plus the API 35 edge-to-edge opt-out resource; no hardcoded toolbar padding is used to avoid double spacing on devices with correct safe-area handling.
  - Final acceptance remains a visual check on the affected phone/emulator: status icons above the Dashboard title, language toggle inside the toolbar, primary toolbars spaced correctly, and bottom tabs clear of the navigation area.
- macOS local release/device install verified on 2026-05-11:
  - Android SDK path: `/opt/homebrew/share/android-commandlinetools`
  - `npm run build:prod`, `npx cap sync android`, `sh ./gradlew assembleRelease`, `apksigner verify`, and `adb install -r` succeeded.
  - Direct `./gradlew` execution may be blocked by macOS quarantine metadata on copied files; running the wrapper through `sh ./gradlew ...` works.
  - Installed package on device `ba72a8a0` was `io.ionic.starter`, `versionCode=1`, `versionName=1.0` before the package id was changed to `com.needtechnosoft.hib`.

## Backend References
- Backend root: `C:\Insurance\InsuranceApp`.
- Backend current context: `C:\Insurance\InsuranceApp\INSURANCEAPP_CONTEXT.md`.
- Backend endpoints used by enrollment:
  - `POST /api/enrollments/{enrollment}/head/nid-lookup`
  - `POST /api/enrollments/{enrollment}/household-head`
  - `POST /api/enrollments/{enrollment}/members`
  - `PUT /api/enrollments/{enrollment}/members/{member}`
  - `POST /api/enrollments/{enrollment}/submit`
  - `GET /api/enrollments/{enrollment}/pdf-url`
- Backend verification on 2026-05-03 covered the mobile draft delete/recreate path through `POST /api/enrollments`, `DELETE /api/enrollments/{id}`, and a second `POST /api/enrollments`; the second draft receives a new enrollment number instead of reusing the soft-deleted one.
- Backend language endpoints:
  - `PATCH /api/user/language`
  - `POST /language` for web/session language changes.
