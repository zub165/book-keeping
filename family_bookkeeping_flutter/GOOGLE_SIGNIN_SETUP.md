# Google Sign-In Setup Guide

## For Development (Current Setup)
The app is currently configured to work without a Google Client ID for development purposes. The Google Sign-In button will show an error, but the local authentication will work perfectly.

## For Production (Google Sign-In Integration)

### Step 1: Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API and Google Sheets API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add your domain to "Authorized JavaScript origins":
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)

### Step 2: Configure the App
1. Copy your Client ID from Google Cloud Console
2. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` in `web/index.html` with your actual Client ID:
   ```html
   <meta name="google-signin-client_id" content="123456789-abcdefg.apps.googleusercontent.com">
   ```

### Step 3: Update Google Sign-In Service (Optional)
If you want to specify the client ID in code instead of HTML meta tag:
```dart
static final GoogleSignIn _googleSignIn = GoogleSignIn(
  clientId: 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com',
  scopes: [
    'email',
    'profile',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
  ],
);
```

## Current Status
- ✅ **Local Authentication**: Works perfectly without any setup
- ❌ **Google Sign-In**: Requires Google Client ID configuration
- ✅ **App Functionality**: All features work with local authentication
- ✅ **Google Sheets Integration**: Will work once Google Sign-In is configured

## Benefits of Each Approach

### Local Authentication (Current)
- ✅ **Complete Privacy**: No data leaves your device
- ✅ **No Setup Required**: Works immediately
- ✅ **No Dependencies**: No Google account needed
- ❌ **No Google Sheets**: Manual export/import only

### Google Sign-In (Optional)
- ✅ **Google Sheets Integration**: Automatic sync
- ✅ **Gmail SMTP**: Email reports
- ✅ **Cloud Backup**: Data synced to Google
- ❌ **Google Account Required**: Must have Google account
- ❌ **Setup Required**: Need to configure Client ID

## Recommendation
For **development and testing**: Use local authentication (current setup)
For **production with Google features**: Configure Google Client ID
