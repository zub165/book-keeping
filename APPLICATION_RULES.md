# 🏗️ Application Rules & Standards

## 📋 **Core Application Rules**

### **1. Array Handling Rules**
- ✅ **ALWAYS** validate arrays before using array methods
- ✅ **ALWAYS** handle paginated responses with `response.results || response`
- ✅ **ALWAYS** check `Array.isArray()` before calling `.find()`, `.filter()`, `.map()`
- ✅ **ALWAYS** provide fallback empty arrays `[]` for failed API calls

```javascript
// ✅ CORRECT Pattern
const response = await api.getData();
const data = response.results || response;
if (Array.isArray(data)) {
    const item = data.find(x => x.id === id);
} else {
    console.error('Data is not an array:', data);
}

// ❌ WRONG Pattern
const data = await api.getData();
const item = data.find(x => x.id === id); // Will fail if data is paginated
```

### **2. Paginated Response Processing Rules**
- ✅ **ALWAYS** extract `results` array from paginated responses
- ✅ **ALWAYS** handle both paginated and non-paginated responses
- ✅ **ALWAYS** log the response structure for debugging

```javascript
// ✅ CORRECT Pattern
const response = await api.getFamilyMembers();
console.log('API Response:', response);
const data = response.results || response;
console.log('Processed Data:', data);
```

### **3. Error Handling Rules**
- ✅ **ALWAYS** wrap API calls in try-catch blocks
- ✅ **ALWAYS** provide user-friendly error messages
- ✅ **ALWAYS** log detailed error information for debugging
- ✅ **ALWAYS** show loading states during API calls
- ✅ **ALWAYS** handle network errors gracefully

```javascript
// ✅ CORRECT Pattern
async function loadData() {
    try {
        console.log('Loading data...');
        const data = await api.getData();
        console.log('Data loaded successfully:', data);
        displayData(data);
    } catch (error) {
        console.error('Error loading data:', error);
        showUserFriendlyError('Failed to load data. Please try again.');
    }
}
```

### **4. Role-Based Access Control Rules**
- ✅ **ALWAYS** check user permissions before showing UI elements
- ✅ **ALWAYS** validate user roles on both frontend and backend
- ✅ **ALWAYS** hide admin features from non-admin users
- ✅ **ALWAYS** implement proper authentication checks

```javascript
// ✅ CORRECT Pattern
async function checkUserPermissions() {
    try {
        const userProfile = await api.getUserProfile();
        if (userProfile.role === 'admin' || userProfile.can_view_all) {
            showAdminFeatures();
        } else {
            hideAdminFeatures();
        }
    } catch (error) {
        console.error('Permission check failed:', error);
    }
}
```

### **5. API Testing Rules**
- ✅ **ALWAYS** test all API endpoints before deployment
- ✅ **ALWAYS** verify response structures match expectations
- ✅ **ALWAYS** test error scenarios (network failures, invalid data)
- ✅ **ALWAYS** validate authentication flows

### **6. User Experience Rules**
- ✅ **ALWAYS** provide clear feedback for user actions
- ✅ **ALWAYS** show loading indicators for async operations
- ✅ **ALWAYS** use consistent error message styling
- ✅ **ALWAYS** provide helpful error descriptions
- ✅ **ALWAYS** implement proper form validation

## 🔧 **Implementation Checklist**

### **Frontend Rules:**
- [ ] All API calls wrapped in try-catch
- [ ] Array validation before array methods
- [ ] Paginated response handling implemented
- [ ] User-friendly error messages
- [ ] Loading states for all async operations
- [ ] Role-based UI element visibility
- [ ] Consistent error handling patterns
- [ ] Debug logging for troubleshooting

### **Backend Rules:**
- [ ] Proper authentication on all endpoints
- [ ] Role-based permissions implemented
- [ ] Consistent error response format
- [ ] Proper HTTP status codes
- [ ] Input validation on all endpoints
- [ ] Pagination support where needed
- [ ] Comprehensive logging

### **Database Rules:**
- [ ] Proper foreign key relationships
- [ ] Consistent field naming
- [ ] Appropriate constraints
- [ ] Migration scripts for all changes
- [ ] Data validation at model level

## 🚀 **Quality Assurance Standards**

### **Code Quality:**
- ✅ Consistent naming conventions
- ✅ Proper error handling
- ✅ Comprehensive logging
- ✅ User-friendly interfaces
- ✅ Role-based security
- ✅ Responsive design
- ✅ Cross-browser compatibility

### **Testing Standards:**
- ✅ API endpoint testing
- ✅ Authentication flow testing
- ✅ Error scenario testing
- ✅ User permission testing
- ✅ Data validation testing

## 📱 **Application-Specific Rules**

### **Bookkeeping Application:**
- ✅ Multi-user family system
- ✅ Individual and combined data views
- ✅ Admin vs member permissions
- ✅ Email notification system
- ✅ Data export functionality
- ✅ Mobile responsive design
- ✅ Real-time statistics updates

## 🔍 **Debugging Standards**

### **Console Logging:**
- ✅ Log all API calls
- ✅ Log response data
- ✅ Log error details
- ✅ Log user actions
- ✅ Log permission checks

### **Error Messages:**
- ✅ User-friendly error descriptions
- ✅ Technical details in console
- ✅ Actionable error messages
- ✅ Consistent error styling
- ✅ Proper error categorization

## 📊 **Performance Standards**

### **Frontend Performance:**
- ✅ Efficient API calls
- ✅ Proper data caching
- ✅ Optimized rendering
- ✅ Minimal DOM manipulation
- ✅ Responsive loading states

### **Backend Performance:**
- ✅ Efficient database queries
- ✅ Proper pagination
- ✅ Optimized serialization
- ✅ Caching where appropriate
- ✅ Minimal data transfer

## 🔒 **Security Standards**

### **Authentication:**
- ✅ JWT token validation
- ✅ Proper session management
- ✅ Secure password handling
- ✅ Role-based access control
- ✅ API endpoint protection

### **Data Security:**
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Secure data transmission

---

## 🎯 **Implementation Priority**

1. **CRITICAL**: Array handling and paginated responses
2. **HIGH**: Error handling and user feedback
3. **HIGH**: Role-based access control
4. **MEDIUM**: API testing and validation
5. **MEDIUM**: User experience improvements
6. **LOW**: Performance optimizations

---

*These rules ensure consistent, high-quality applications across all projects.*
