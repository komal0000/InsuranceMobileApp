# HIB Insurance Mobile App

Ionic/Angular/Capacitor mobile client for HIB(Health Insurance Board), Nepal.

## What This App Does

- Provides the mobile beneficiary and field-staff experience.
- Consumes the Laravel API from `../InsuranceApp`.
- Supports auth, profile, enrollment, renewal, KYC, payments, notifications, policy/card views, and localization.

## Stack

- Ionic 8
- Angular 20
- Capacitor 8
- TypeScript 5.9
- Karma/Jasmine tests

## Useful Entrypoints

- Agent guide: `AGENT.md`
- Token-efficient context: `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md`
- Detailed context/history: `INSURANCEMOBILEAPP_CONTEXT.md`
- Routes: `src/app/app.routes.ts`
- API services: `src/app/services`
- Interfaces: `src/app/interfaces`
- Pages: `src/app/pages`
- Components: `src/app/components`

## Local Setup

```bash
npm install
npm start
```

Build web assets:

```bash
npm run build
```

Sync Android after web or Capacitor changes:

```bash
npx cap sync android
```

## Verification

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/path/to/file.spec.ts
```

## Agent Notes

Do not broadly read or index `.angular`, `node_modules`, `www`, Android build outputs, Gradle caches, logs, screenshots, secrets, or `package-lock.json`. See `.aiexclude`, `.cursorignore`, and `../docs/generated-and-reference-data.md`.
