# Family Bookkeeping – Context and Hybrid Guide

This document captures how the app is wired today and how to extend it. Keep it current as we iterate.

## Modes
- Local-only: reads/writes use on-device DB; fully offline.
- Hybrid: local-first with background/inline sync to Django.

Runtime config via `ApiService` (SharedPreferences keys):
- `hybrid_enabled` (bool)
- `hybrid_base_url` (string)

Startup (current):
```dart
await ApiService.initializeConfig();
await ApiService.configure(
  enabled: true,
  baseUrl: 'https://api.mywaitime.com/api',
);
```

## Network Topology
- Public: https://api.mywaitime.com/api (Nginx 443 → Django 127.0.0.1:3015)
- Android emulator (direct only): http://10.0.2.2:3015/api
- iOS simulator (direct only): http://localhost:3015/api
- Prefer the public HTTPS endpoint for all platforms.

## Auth
- Local: `LocalAuthService` (email/password, SHA-256) persists user.
- Remote (Hybrid): `ApiService` obtains JWT; tokens stored in `FlutterSecureStorage`.
- Flow: Local-first; remote optional. Failure never blocks local UX.

## Tabs and Responsibilities
- Dashboard
  - `loadSummary()`: totals for current period
  - `recentActivity()`: last N entries across entities
- Expenses
  - `listExpenses(filters)`; `createExpense` `updateExpense` `deleteExpense`
- Miles
  - `listMiles(filters)`; `createMile` `updateMile` `deleteMile`
- Hours
  - `listHours(filters)`; `createHour` `updateHour` `deleteHour`
- Family Members (admin)
  - `listMembers`; `createMember` `updateMember` `deleteMember`

Repo pattern for all tabs:
1) Read: query local; if Hybrid+online, GET remote, merge by `updated_at`, upsert to local, then return.
2) Write: write locally with `synced=0`; if Hybrid+online, push (POST/PUT/DELETE) and set `synced=1` on success.

## API Endpoints (expected)
- Auth: `/auth/login/`, `/auth/register/`, `/auth/refresh/`, `/auth/user/`
- Expenses: `/expenses/` (GET/POST), `/expenses/{id}/` (GET/PUT/DELETE)
- Miles: `/miles/`, `/miles/{id}/`
- Hours: `/hours/`, `/hours/{id}/`
- Family: `/family-members/`, `/family-members/{id}/`

## Local Database (SQLite)
Common columns across tables (`expenses`, `miles`, `hours`, `family_members`):
- `created_at`, `updated_at` (ISO8601), `synced` (0/1)
- foreign keys to `family_members` when applicable

## Sync Strategy
1) Upload local changes (`synced=0`).
2) Download remote changes (since last `updated_at`).
3) Merge: last-write-wins by `updated_at`.
4) Mark uploaded rows `synced=1` on success.

Sync triggers:
- App start (if Hybrid+online)
- Tab becomes visible / pull-to-refresh
- After local create/update/delete (inline push when online)

## Error Handling
- Network/API errors fall back to local. Retries with backoff.
- 401 → try refresh; on failure, stay local-only.
- Web requires CORS allowed from the deployed origins.

## Settings (planned UI)
- Toggle: Hybrid on/off
- Backend URL field (persisted to `hybrid_base_url`)
- “Sync now” action

## Runbook
- iOS Simulator: `flutter run -d "iPhone <model>"`
- Android Emulator: start AVD → `flutter run -d android`
- Web: `flutter run -d chrome`

## Security
- Prefer HTTPS (`api.mywaitime.com`).
- Tokens in `FlutterSecureStorage`. Avoid logging secrets.

## Extensibility
- Keep merge logic in a central `SyncService`.
- Repositories stay thin; services contain business logic.


