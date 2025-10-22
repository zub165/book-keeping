# Family Bookkeeping Flutter App

A comprehensive mobile application for family expense tracking, built with Flutter and featuring both Android and iOS support.

## 📱 Features

- **Multi-Platform Support**: Android (AAB) and iOS (IPA) builds
- **Family Management**: Add and manage family members
- **Expense Tracking**: Record and categorize family expenses
- **Mileage Tracking**: Log business and personal miles
- **Hours Tracking**: Track work hours and activities
- **Gmail SMTP Integration**: Email reports using family's Gmail account
- **Local Storage**: All data stored locally on device
- **Import/Export**: CSV, Excel, and Google Sheets support
- **Email Reports**: Gmail SMTP integration for family reports
- **Offline Support**: Works without internet connection
- **Beautiful UI**: Material 3 design with custom icons
- **Privacy Compliant**: GDPR, CCPA, and COPPA compliant

## 🏗️ Architecture

### **Local-Only Architecture (No Cloud Dependencies!)**
- **Framework**: Flutter 3.4.4+ with Dart
- **State Management**: Riverpod for reactive state management
- **Navigation**: GoRouter for type-safe navigation
- **UI Framework**: Material 3 design system
- **Local Database**: SQLite with sqflite package
- **Email Service**: Gmail SMTP integration for each family
- **Authentication**: Local user management
- **Security**: SHA-256 password hashing
- **Charts**: FL Chart for data visualization
- **Export/Import**: CSV, Excel, and Google Sheets support
- **Reports**: PDF generation and email delivery

## 📦 Build Files

### Android App Bundle (AAB)
- **File**: `build/app/outputs/bundle/release/app-release.aab`
- **Size**: 42MB
- **Bundle ID**: `com.innnovatorsgeneration.familyBookkeeping`
- **Ready for**: Google Play Store submission

### iOS IPA
- **File**: `build/ios/ipa/family_bookkeeping_flutter.ipa`
- **Size**: 43MB
- **Bundle ID**: `com.innnovatorsgeneration.familyBookkeeping`
- **Ready for**: Apple App Store submission

## 🚀 Quick Start

### Prerequisites
- Flutter SDK 3.4.4+
- Dart SDK 3.8.1+
- Android Studio / Xcode
- Git

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/zub165/book-keeping.git
cd book-keeping/family_bookkeeping_flutter
```

2. **Install dependencies**:
```bash
flutter pub get
```

3. **Run code generation**:
```bash
dart run build_runner build
```

4. **Run on device/emulator**:
```bash
# Android
flutter run -d android

# iOS
flutter run -d ios
```

## 🔧 Development

### Building for Release

#### Android AAB
```bash
flutter build appbundle --release
```

#### iOS IPA
```bash
flutter build ipa --release
```

### Code Generation
```bash
# Generate model files
dart run build_runner build

# Watch for changes
dart run build_runner watch
```

### Testing
```bash
# Run tests
flutter test

# Run integration tests
flutter test integration_test/
```

## 📊 Data Models

### Core Models
- **User**: Authentication and profile information
- **FamilyMember**: Family member details and permissions
- **Expense**: Financial transactions and categories
- **Mile**: Mileage tracking for business/personal use
- **Hour**: Time tracking for activities

### Database Schema
- **Local SQLite**: Primary storage for offline access
- **Cloud Sync**: Automatic synchronization with Django backend
- **Conflict Resolution**: Last-write-wins with timestamp comparison

## 🔒 Security & Privacy

### Data Protection
- **Encryption**: AES-256 encryption for sensitive data
- **Authentication**: JWT tokens with automatic refresh
- **Privacy**: GDPR, CCPA, and COPPA compliant
- **Secure Storage**: Encrypted local storage

### Privacy Policy
- **File**: `Privacy.html`
- **Compliance**: GDPR, CCPA, COPPA
- **Coverage**: Data collection, usage, sharing, and user rights

## 📱 App Store Submission

### Google Play Store
1. Upload AAB file: `build/app/outputs/bundle/release/app-release.aab`
2. Complete store listing
3. Submit for review

### Apple App Store
1. Upload IPA file: `build/ios/ipa/family_bookkeeping_flutter.ipa`
2. Complete App Store Connect listing
3. Submit for review

## 🎨 Customization

### App Icons
- **Source**: `assets/icons/app_icon.png` (1024x1024)
- **Generated**: All required sizes for Android and iOS
- **Theme**: Family bookkeeping with book, family figures, dollar sign, and heart

### Branding
- **Bundle ID**: `com.innnovatorsgeneration.familyBookkeeping`
- **Display Name**: Family Bookkeeping Flutter
- **Version**: 1.0.1 (Build 2)

## 📚 Documentation

- **Local-Only Setup**: `LOCAL_ONLY_SETUP.md` - Complete local-only setup with Gmail SMTP and import/export
- **Local Setup Guide**: `LOCAL_SETUP_GUIDE.md` - Basic local-only setup instructions
- **Context**: `Context.md` - Application overview and architecture
- **Business Model**: `business_model.md` - Monetization and features
- **Development Roadmap**: `development_roadmap.md` - Future enhancements
- **Privacy Policy**: `Privacy.html` - Legal compliance document

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Email**: support@innovatorsgeneration.com
- **Website**: www.innovatorsgeneration.com
- **Issues**: [GitHub Issues](https://github.com/zub165/book-keeping/issues)

## 🏢 About Innovators Generation

**Innovators Generation** is committed to creating innovative solutions for family financial management. Our Family Bookkeeping app represents our dedication to helping families track expenses, manage budgets, and achieve financial goals together.

---

**Built with ❤️ by Innovators Generation**