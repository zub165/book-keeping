# Family Bookkeeping Flutter App - Context & Architecture

## 📱 Application Overview

**Family Bookkeeping** is a comprehensive mobile application built with Flutter that allows families to track expenses, miles, and hours collectively. The app supports multi-user access where family members can log their own data, and administrators can view combined reports and analytics.

## 🏗️ Architecture & Technology Stack

### **Frontend (Flutter)**
- **Framework**: Flutter 3.4.4+ with Dart
- **State Management**: Riverpod for reactive state management
- **Navigation**: GoRouter for type-safe navigation
- **UI Framework**: Material 3 design system
- **Local Storage**: SQLite with sqflite package
- **HTTP Client**: Dio for API communication
- **Security**: Flutter Secure Storage for tokens
- **Charts**: FL Chart for data visualization
- **File Operations**: PDF generation, CSV export, file picker

### **Backend (Django)**
- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT tokens with refresh mechanism
- **API**: RESTful API with pagination
- **Email**: SMTP integration for reports and notifications
- **CORS**: Configured for cross-origin requests

## 📊 Data Models & Database Schema

### **Core Models**

#### **User Model**
```dart
class User {
  int? id;
  String email;
  String? firstName;
  String? lastName;
  bool isActive;
  bool isStaff;
  bool isSuperuser;
  DateTime? dateJoined;
  DateTime? lastLogin;
  String? role;
  bool canViewAll;
}
```

#### **FamilyMember Model**
```dart
class FamilyMember {
  int? id;
  String name;
  String relation;
  String? email;
  bool isRegistered;
  bool sendReports;
  String role;
  bool canViewAll;
  DateTime createdAt;
  DateTime updatedAt;
}
```

#### **Expense Model**
```dart
class Expense {
  int? id;
  String description;
  double amount;
  String category;
  DateTime date;
  String? notes;
  int? familyMemberId;
  String? familyMemberName;
  DateTime createdAt;
  DateTime updatedAt;
}
```

#### **Mile Model**
```dart
class Mile {
  int? id;
  String description;
  double miles;
  String purpose;
  DateTime date;
  String? notes;
  int? familyMemberId;
  String? familyMemberName;
  DateTime createdAt;
  DateTime updatedAt;
}
```

#### **Hour Model**
```dart
class Hour {
  int? id;
  String description;
  double hours;
  String activity;
  DateTime date;
  String? notes;
  int? familyMemberId;
  String? familyMemberName;
  DateTime createdAt;
  DateTime updatedAt;
}
```

## 🔄 Data Synchronization Strategy

### **Hybrid Storage Approach**
1. **Local SQLite Database**: Primary storage for offline access
2. **Cloud Sync**: Automatic synchronization with Django backend
3. **Conflict Resolution**: Last-write-wins with timestamp comparison
4. **Offline-First**: App works without internet connection

### **Sync Process**
1. **Upload Local Changes**: Send unsynced local data to server
2. **Download Remote Changes**: Fetch latest data from server
3. **Merge Data**: Resolve conflicts and update local database
4. **Mark Synced**: Update sync status for uploaded items

## 👥 User Roles & Permissions

### **Admin Users**
- **Full Access**: View all family member data
- **User Management**: Add/edit/delete family members
- **Reports**: Generate combined family reports
- **Settings**: Configure family settings and permissions
- **Data Export**: Export all family data in various formats

### **Family Members**
- **Personal Data**: Add/edit/delete own expenses, miles, hours
- **Limited Reports**: View personal reports only
- **Family View**: See other members' data (if granted access)
- **Notifications**: Receive monthly reports and updates

## 📱 Core Features

### **Authentication & Security**
- **JWT Authentication**: Secure token-based authentication
- **Auto-Refresh**: Automatic token refresh before expiration
- **Secure Storage**: Encrypted storage for sensitive data
- **Role-Based Access**: Different permissions for admin/member users

### **Data Management**
- **CRUD Operations**: Create, read, update, delete for all data types
- **Search & Filter**: Find specific entries by date, category, amount
- **Bulk Operations**: Import/export data in CSV/Excel formats
- **Data Validation**: Client and server-side validation

### **Reporting & Analytics**
- **Expense Reports**: Category-wise spending analysis
- **Mileage Tracking**: Business vs personal miles
- **Time Tracking**: Hours worked by activity
- **Combined Reports**: Family-wide statistics and trends
- **Charts & Graphs**: Visual representation of data

### **Family Management**
- **Member Profiles**: Personal information and preferences
- **Email Integration**: Send reports and notifications
- **Access Control**: Grant/revoke viewing permissions
- **Role Assignment**: Admin vs member roles

## 🔧 Technical Implementation

### **State Management (Riverpod)**
```dart
// Authentication state
final authServiceProvider = StateNotifierProvider<AuthService, AuthState>((ref) {
  return AuthService();
});

// Current user
final currentUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authServiceProvider);
  return authState is AuthenticatedState ? authState.user : null;
});

// Sync status
final syncServiceProvider = StateNotifierProvider<SyncService, SyncState>((ref) {
  return SyncService();
});
```

### **API Service Architecture**
```dart
class ApiService {
  static Future<Map<String, dynamic>> login(String email, String password);
  static Future<Map<String, dynamic>> register({required String email, required String password});
  static Future<List<FamilyMember>> getFamilyMembers();
  static Future<List<Expense>> getExpenses();
  static Future<List<Mile>> getMiles();
  static Future<List<Hour>> getHours();
  // ... CRUD operations for all models
}
```

### **Local Database Schema**
```sql
-- Family Members Table
CREATE TABLE family_members (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  email TEXT,
  is_registered INTEGER NOT NULL DEFAULT 0,
  send_reports INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'member',
  can_view_all INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0
);

-- Expenses Table
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  family_member_id INTEGER,
  family_member_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (family_member_id) REFERENCES family_members (id)
);

-- Similar tables for miles and hours...
```

## 🚀 Deployment & Distribution

### **Development Setup**
1. **Flutter SDK**: Install Flutter 3.4.4+
2. **Dependencies**: Run `flutter packages get`
3. **Code Generation**: Run `dart run build_runner build`
4. **Backend**: Ensure Django backend is running on port 3017
5. **Run App**: `flutter run` for development

### **Production Build**
1. **Android**: `flutter build apk --release`
2. **iOS**: `flutter build ios --release`
3. **Web**: `flutter build web --release`

### **App Store Distribution**
- **Google Play Store**: Android APK/AAB
- **Apple App Store**: iOS IPA
- **Enterprise**: Internal distribution for organizations

## 💰 Business Model & Monetization

### **Freemium Model**
- **Free Tier**: Basic expense tracking for 1 family member
- **Premium Tier**: Full family access, advanced reports, unlimited data
- **Enterprise**: Multi-family management, custom integrations

### **Revenue Streams**
1. **Subscription**: Monthly/yearly premium subscriptions
2. **Family Packs**: One-time purchase for family access
3. **Enterprise Licenses**: Custom pricing for organizations
4. **Premium Features**: Advanced analytics, custom reports

### **Target Market**
- **Primary**: Families with multiple income sources
- **Secondary**: Small businesses tracking expenses
- **Enterprise**: Organizations with expense management needs

## 🔒 Security & Privacy

### **Data Protection**
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Authentication**: Multi-factor authentication support
- **Privacy**: GDPR compliant data handling
- **Backup**: Regular encrypted backups

### **Access Control**
- **Role-Based**: Different permissions for different user types
- **Family Isolation**: Data separation between different families
- **Audit Trail**: Track all data modifications

## 📈 Future Enhancements

### **Phase 1 (MVP)**
- ✅ Basic CRUD operations
- ✅ Authentication system
- ✅ Local storage with sync
- ✅ Basic reporting

### **Phase 2 (Enhanced)**
- 📊 Advanced analytics and charts
- 📧 Email report automation
- 📱 Mobile-optimized UI
- 🔄 Real-time synchronization

### **Phase 3 (Scale)**
- 🤖 AI-powered insights
- 📊 Custom dashboard creation
- 🔗 Third-party integrations
- 🌐 Multi-language support

## 🛠️ Development Guidelines

### **Code Standards**
- **Dart/Flutter**: Follow official Flutter style guide
- **Architecture**: Clean architecture with separation of concerns
- **Testing**: Unit tests for business logic, widget tests for UI
- **Documentation**: Comprehensive code documentation

### **Performance**
- **Lazy Loading**: Load data on demand
- **Caching**: Intelligent data caching
- **Optimization**: Minimize API calls and database queries
- **Memory Management**: Proper disposal of resources

This comprehensive context document provides the foundation for understanding, developing, and maintaining the Family Bookkeeping Flutter application.
