# 🚀 Quick Reference Guide

**Last Updated**: October 21, 2025

---

## 📁 Project Structure

```
family_bookkeeping_flutter/
├── lib/
│   ├── main.dart                              ← App entry point
│   │
│   ├── core/
│   │   ├── models/                            ← Data models
│   │   │   ├── expense.dart
│   │   │   ├── mile.dart
│   │   │   ├── hour.dart
│   │   │   ├── family_member.dart
│   │   │   └── user.dart
│   │   │
│   │   ├── repositories/                      ← Data access layer
│   │   │   ├── expense_repository.dart        ✅ GET/POST/PUT/DELETE + Sync
│   │   │   ├── mile_repository.dart           ✅ GET/POST/PUT/DELETE + Sync
│   │   │   ├── hour_repository.dart           ✅ GET/POST/PUT/DELETE + Sync
│   │   │   └── family_member_repository.dart  ✅ GET/POST/PUT/DELETE + Sync
│   │   │
│   │   └── services/
│   │       ├── api_service.dart               ← Django backend API
│   │       ├── local_auth_service.dart        ← Local auth (SQLite)
│   │       ├── auth_service.dart              ← Riverpod state management
│   │       ├── local_database.dart            ← SQLite operations
│   │       ├── family_report_service.dart     ← Reports & email
│   │       ├── simple_email_service.dart      ← Gmail SMTP
│   │       ├── local_export_service.dart      ← CSV/Excel export
│   │       └── local_import_service.dart      ← CSV/Excel import
│   │
│   └── features/
│       ├── auth/
│       │   └── presentation/
│       │       └── pages/
│       │           └── login_page.dart        ✅ Login & Register
│       │
│       ├── dashboard/
│       │   └── presentation/
│       │       ├── pages/
│       │       │   └── dashboard_page.dart    ✅ Main dashboard
│       │       │
│       │       └── dialogs/
│       │           ├── add_expense_dialog.dart       ✅ Add expense form
│       │           ├── add_mile_dialog.dart          ✅ Add mile form
│       │           ├── add_hour_dialog.dart          ✅ Add hour form
│       │           └── add_family_member_dialog.dart ✅ Add member form
│       │
│       └── settings/
│           └── presentation/
│               └── pages/
│                   └── settings_page.dart    ✅ Hybrid mode config
│
├── pubspec.yaml                               ← Dependencies
├── CODE_AUDIT_COMPLETE.md                     ← Full audit report
├── Context.md                                 ← Architecture guide
├── HYBRID_TABS_IMPLEMENTATION.md              ← Hybrid setup
└── README.md                                  ← Project readme
```

---

## 🔌 Key Components

### Authentication Flow
```
main.dart
  ↓
GoRouter redirect()
  ├→ LoginPage (if no user)
  └→ DashboardPage (if logged in)
       └→ AuthService (Riverpod)
           └→ LocalAuthService
               └→ SQLite auth table
```

### Data Flow
```
DashboardPage
  ├→ initState()
  │  └→ _loadData()
  │     ├→ ExpenseRepository.getExpenses()
  │     ├→ MileRepository.getMiles()
  │     ├→ HourRepository.getHours()
  │     └→ FamilyMemberRepository.getFamilyMembers()
  │
  └→ Repositories [Local-first + Hybrid]
     ├→ LocalDatabase.get*()
     ├→ if ApiService.isHybridEnabled
     │  ├→ ApiService.get*()
     │  └→ Merge & Sync
     └→ Return data
```

### Form Submission
```
Dialog Form
  ├→ Form validation
  ├→ Collect user input
  └→ Repository.create*()
     ├→ LocalDatabase.insert*()
     ├→ if Hybrid enabled
     │  ├→ ApiService.create*()
     │  └→ Mark synced=true
     └→ onAddedCallback()
```

---

## 📌 Important Files & Responsibilities

| File | Purpose | Key Methods |
|------|---------|-------------|
| `main.dart` | App entry, routing, hybrid config | `main()` |
| `auth_service.dart` | Auth state & providers | `login()`, `register()`, `logout()` |
| `local_auth_service.dart` | Local auth operations | `loginUser()`, `registerUser()` |
| `api_service.dart` | Django API calls | `configure()`, all CRUD methods |
| `dashboard_page.dart` | Main UI, data loading | `_loadData()`, dialogs |
| `*_repository.dart` | Hybrid data access | `get*()`, `create*()`, `update*()`, `delete*()` |
| `local_database.dart` | SQLite operations | `insert*()`, `get*()`, `update*()`, `delete*()` |
| `add_*_dialog.dart` | Form input dialogs | `_submitForm()`, validation |
| `settings_page.dart` | Hybrid configuration | `_toggleHybridMode()`, `_testConnection()` |

---

## 🔄 Workflow Patterns

### Pattern 1: Read Data
```dart
// Repository level
Future<List<Expense>> getExpenses() {
  1. var local = await LocalDatabase.getExpenses();
  2. if (ApiService.isHybridEnabled && online) {
     a. var remote = await ApiService.getExpenses();
     b. merge by updated_at (last-write-wins);
     c. upsert to local;
  }
  3. return merged;
}
```

### Pattern 2: Create Data
```dart
// Repository level
Future<Expense?> createExpense(expense) {
  1. expense.copyWith(synced: false);
  2. await LocalDatabase.insertExpense();
  3. if (ApiService.isHybridEnabled && online) {
     a. var remote = await ApiService.createExpense();
     b. update local with remote.id;
     c. mark synced: true;
  }
  4. return saved_expense;
}
```

### Pattern 3: Form Submission
```dart
// Dialog level
_submitForm() {
  1. Validate form;
  2. Create object;
  3. Repository.create*(object);
  4. Show success snackbar;
  5. Dialog close;
  6. Callback fires → Dashboard refresh;
}
```

---

## 🎨 UI Components

### AppBar Actions
```
[Refresh Button] → _loadData()          // Manual sync
[Settings Button] → SettingsPage()      // Hybrid config
[Logout Button] → AuthService.logout()  // Logout & go to login
```

### Dashboard Sections
1. **Welcome Card** - User greeting + admin badge
2. **Quick Actions Grid** - 4 cards with counts (clickable)
3. **Recent Activity** - Last entry from each type
4. **Statistics** - Totals and aggregates
5. **FAB** - "Add Expense" button

### Pull-to-Refresh
- Swipe down on body → `RefreshIndicator` → `_loadData()`

---

## 🔧 Configuration

### Hybrid Mode (in main.dart)
```dart
await ApiService.configure(
  enabled: true,  // Toggle hybrid
  baseUrl: 'https://api.mywaitime.com/api',  // Django endpoint
);
```

### Local Mode (in Settings)
- Toggle: "Enable Hybrid Sync" switch
- Input: Backend URL text field
- Button: "Test Connection" (verify endpoint)
- Button: "Sync Now" (force refresh all data)

---

## 🧪 Testing Workflows

### Test 1: Create & Sync Expense
```
1. Hybrid ENABLED + Online:
   - Add Expense
   - Check local DB
   - Check backend via API
   - Refresh & verify merged data

2. Hybrid ENABLED + Offline:
   - Add Expense
   - Mark synced=0
   - Go online
   - Refresh → Auto-sync

3. Hybrid DISABLED:
   - Add Expense (local only)
   - No API calls
   - Works offline
```

### Test 2: Auth Flow
```
1. Register user
2. Login with same credentials
3. Logout
4. Try to access dashboard → redirect to login
5. Login again
```

### Test 3: Dashboard Load
```
1. Load dashboard
2. Check all 4 repositories fire
3. Verify data displays
4. Click refresh button
5. Pull-to-refresh (swipe down)
6. Check both trigger _loadData()
```

---

## 🚀 Build & Run

### Development
```bash
# iPhone simulator
flutter run -d "iPhone 16 Pro"

# Android emulator  
flutter run -d emulator-5554

# Chrome web
flutter run -d chrome
```

### Production
```bash
# Android AAB
flutter build appbundle --release

# iOS IPA
flutter build ios --release

# Web
flutter build web --release
```

---

## 📊 Database Tables

All include `synced` field (0/1):

```sql
expenses (id, description, amount, category, date, notes, ...)
miles (id, description, miles, purpose, date, notes, ...)
hours (id, description, hours, activity, date, notes, ...)
family_members (id, name, relation, email, role, ...)
```

---

## 🔐 Key APIs

### Repositories (Static methods)
```dart
ExpenseRepository.getExpenses()
ExpenseRepository.createExpense(expense)
ExpenseRepository.updateExpense(expense)
ExpenseRepository.deleteExpense(id)
// Same for Mile, Hour, FamilyMember
```

### AuthService (Riverpod)
```dart
ref.read(authServiceProvider.notifier).login(email, pwd)
ref.read(authServiceProvider.notifier).register(...)
ref.read(authServiceProvider.notifier).logout()
ref.watch(currentUserProvider)  // Get current user
```

### ApiService (Static, Hybrid)
```dart
await ApiService.configure(enabled: true, baseUrl: 'url')
ApiService.isHybridEnabled  // Check if enabled
await ApiService.canUseRemote  // Check if online + enabled
```

---

## ✨ Key Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| **Local Auth** | ✅ | Email/password, SHA-256 |
| **Hybrid Sync** | ✅ | Last-write-wins, configurable |
| **Offline Support** | ✅ | Full app works offline |
| **Dashboard** | ✅ | Stats, recent activity, quick actions |
| **Forms** | ✅ | Expense, Miles, Hours, Family |
| **Settings** | ✅ | Hybrid toggle, URL config |
| **Pull-to-Refresh** | ✅ | Swipe down to reload |
| **Error Handling** | ✅ | Graceful failures |
| **Data Export** | ✅ | CSV, Excel, Google Sheets |
| **Email Reports** | ✅ | Gmail SMTP integration |

---

## 🎯 Next Steps

**Ready to extend?** Follow this checklist:

- [ ] Add new feature to appropriate layer (UI, Repository, Service)
- [ ] Add model fields if needed
- [ ] Update repository methods (get, create, update, delete)
- [ ] Create form dialog if needed
- [ ] Hook up in dashboard or settings
- [ ] Test offline + online modes
- [ ] Update documentation

---

**Questions?** See:
- `CODE_AUDIT_COMPLETE.md` - Full audit details
- `Context.md` - Architecture decisions
- `HYBRID_TABS_IMPLEMENTATION.md` - How hybrid works

**Generated**: October 21, 2025
