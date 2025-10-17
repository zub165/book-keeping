# Flutter Family Bookkeeping App - Context & Data Architecture

## 📊 **Data Storage Architecture**

### **Hybrid Storage Strategy (Local + Cloud)**

#### **1. Local Storage (Primary)**
```dart
// SQLite Database (Offline-First)
class DatabaseHelper {
  static Database? _database;
  
  // Tables
  - users
  - family_groups
  - family_members
  - expenses
  - miles
  - hours
  - categories
  - receipts
  - budgets
  - settings
}
```

**Local Storage Benefits:**
- ✅ **Offline functionality** - Works without internet
- ✅ **Fast performance** - No network latency
- ✅ **Data privacy** - Data stays on device
- ✅ **Battery efficient** - No constant cloud sync
- ✅ **Reliable** - No dependency on internet connection

#### **2. Cloud Storage (Sync)**
```dart
// Firebase Firestore (Cloud Sync)
class CloudSyncService {
  // Real-time synchronization
  - Family data sync
  - Expense updates
  - Member invitations
  - Subscription status
  - Backup & restore
}
```

**Cloud Storage Benefits:**
- ✅ **Cross-device sync** - Access from multiple devices
- ✅ **Real-time updates** - Family members see changes instantly
- ✅ **Backup & restore** - Data recovery if device is lost
- ✅ **Collaboration** - Multiple family members can work together
- ✅ **Scalability** - Handles large families and data volumes

---

## 👨‍👩‍👧‍👦 **Family Management & Admin Features**

### **Family Structure**
```dart
class FamilyGroup {
  String id;
  String name;
  String ownerId;           // Admin/Owner
  List<FamilyMember> members;
  SubscriptionPlan plan;
  Map<String, FamilyRole> permissions;
  DateTime createdAt;
  bool isActive;
}

enum FamilyRole {
  owner,    // Full control, billing, member management
  admin,    // Full data access, can invite members
  member,   // Can add/edit own data, view family reports
  viewer,   // Can only view family reports
  child,    // Limited access, parental controls
}
```

### **Admin Capabilities**

#### **1. Family Member Management**
```dart
class FamilyAdminService {
  // Add new family member
  Future<bool> addFamilyMember({
    required String email,
    required String name,
    required FamilyRole role,
    String? phoneNumber,
    DateTime? birthDate,
  });
  
  // Remove family member
  Future<bool> removeFamilyMember(String memberId);
  
  // Update member role
  Future<bool> updateMemberRole(String memberId, FamilyRole newRole);
  
  // Invite member via email
  Future<bool> inviteMember(String email, FamilyRole role);
  
  // View all family members
  Future<List<FamilyMember>> getAllFamilyMembers();
}
```

#### **2. Data Management & Oversight**
```dart
class AdminDataService {
  // View all family data
  Future<FamilyDataOverview> getFamilyDataOverview();
  
  // View specific member's data
  Future<MemberData> getMemberData(String memberId);
  
  // Edit any family member's data
  Future<bool> editMemberData(String memberId, Map<String, dynamic> updates);
  
  // Delete any family member's data
  Future<bool> deleteMemberData(String memberId, String dataType, String dataId);
  
  // Set spending limits for members
  Future<bool> setMemberSpendingLimit(String memberId, double limit);
}
```

---

## 📱 **Data Storage Implementation**

### **Local SQLite Database Schema**

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'free',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_sync_at INTEGER,
  is_active BOOLEAN DEFAULT 1
);

-- Family groups table
CREATE TABLE family_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Family members table
CREATE TABLE family_members (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  spending_limit REAL,
  permissions TEXT, -- JSON string
  FOREIGN KEY (family_id) REFERENCES family_groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Expenses table
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  date INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  family_id TEXT,
  receipt_url TEXT,
  notes TEXT,
  is_tax_deductible BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (family_id) REFERENCES family_groups(id)
);

-- Miles table
CREATE TABLE miles (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  miles REAL NOT NULL,
  rate REAL NOT NULL,
  date INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  family_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (family_id) REFERENCES family_groups(id)
);

-- Hours table
CREATE TABLE hours (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  hours REAL NOT NULL,
  rate REAL NOT NULL,
  date INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  family_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (family_id) REFERENCES family_groups(id)
);

-- Categories table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'expense', 'mile', 'hour'
  color TEXT,
  icon TEXT,
  family_id TEXT,
  is_default BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (family_id) REFERENCES family_groups(id)
);

-- Receipts table
CREATE TABLE receipts (
  id TEXT PRIMARY KEY,
  expense_id TEXT,
  image_url TEXT NOT NULL,
  ocr_text TEXT,
  amount REAL,
  merchant TEXT,
  date INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (expense_id) REFERENCES expenses(id)
);

-- Budgets table
CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  spent REAL DEFAULT 0,
  period TEXT NOT NULL, -- 'monthly', 'yearly'
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (family_id) REFERENCES family_groups(id)
);

-- Settings table
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **Cloud Firestore Collections**

```dart
// Firestore Collections Structure
class FirestoreCollections {
  static const String users = 'users';
  static const String families = 'families';
  static const String expenses = 'expenses';
  static const String miles = 'miles';
  static const String hours = 'hours';
  static const String categories = 'categories';
  static const String receipts = 'receipts';
  static const String budgets = 'budgets';
  static const String invitations = 'invitations';
  static const String subscriptions = 'subscriptions';
}
```

---

## 🔧 **Admin Data Management Features**

### **1. Add Family Members**

```dart
class AddFamilyMemberPage extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Add Family Member')),
      body: Column(
        children: [
          // Member Details Form
          TextFormField(
            decoration: InputDecoration(labelText: 'Full Name'),
            onChanged: (value) => setState(() => name = value),
          ),
          TextFormField(
            decoration: InputDecoration(labelText: 'Email'),
            onChanged: (value) => setState(() => email = value),
          ),
          TextFormField(
            decoration: InputDecoration(labelText: 'Phone (Optional)'),
            onChanged: (value) => setState(() => phone = value),
          ),
          
          // Role Selection
          DropdownButton<FamilyRole>(
            value: selectedRole,
            items: FamilyRole.values.map((role) {
              return DropdownMenuItem(
                value: role,
                child: Text(role.displayName),
              );
            }).toList(),
            onChanged: (value) => setState(() => selectedRole = value!),
          ),
          
          // Spending Limit (for children)
          if (selectedRole == FamilyRole.child)
            TextFormField(
              decoration: InputDecoration(labelText: 'Monthly Spending Limit'),
              keyboardType: TextInputType.number,
              onChanged: (value) => setState(() => spendingLimit = double.tryParse(value)),
            ),
          
          // Add Member Button
          ElevatedButton(
            onPressed: () => _addFamilyMember(),
            child: Text('Add Family Member'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _addFamilyMember() async {
    try {
      final member = FamilyMember(
        id: Uuid().v4(),
        name: name,
        email: email,
        phone: phone,
        role: selectedRole,
        spendingLimit: spendingLimit,
        familyId: currentFamily.id,
        joinedAt: DateTime.now(),
      );
      
      // Add to local database
      await DatabaseHelper.instance.insertFamilyMember(member);
      
      // Sync to cloud
      await CloudSyncService.instance.addFamilyMember(member);
      
      // Send invitation email
      await EmailService.instance.sendInvitation(email, currentFamily.name);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Family member added successfully!')),
      );
      
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding family member: $e')),
      );
    }
  }
}
```

### **2. View Family Data**

```dart
class FamilyDataOverviewPage extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Family Data Overview')),
      body: Column(
        children: [
          // Family Summary Cards
          Row(
            children: [
              _buildSummaryCard('Total Expenses', '\$${totalExpenses.toStringAsFixed(2)}', Colors.red),
              _buildSummaryCard('Total Miles', '${totalMiles.toStringAsFixed(0)}', Colors.blue),
              _buildSummaryCard('Total Hours', '${totalHours.toStringAsFixed(0)}', Colors.green),
            ],
          ),
          
          // Family Members List
          Expanded(
            child: ListView.builder(
              itemCount: familyMembers.length,
              itemBuilder: (context, index) {
                final member = familyMembers[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundImage: member.avatarUrl != null 
                        ? NetworkImage(member.avatarUrl!) 
                        : null,
                    child: member.avatarUrl == null 
                        ? Text(member.name[0].toUpperCase()) 
                        : null,
                  ),
                  title: Text(member.name),
                  subtitle: Text('${member.role.displayName} • ${member.expensesCount} expenses'),
                  trailing: PopupMenuButton(
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        value: 'view',
                        child: Text('View Data'),
                      ),
                      PopupMenuItem(
                        value: 'edit',
                        child: Text('Edit Member'),
                      ),
                      PopupMenuItem(
                        value: 'remove',
                        child: Text('Remove Member'),
                      ),
                    ],
                    onSelected: (value) => _handleMemberAction(value, member),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSummaryCard(String title, String value, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            children: [
              Text(title, style: TextStyle(fontSize: 12, color: Colors.grey)),
              SizedBox(height: 8),
              Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
            ],
          ),
        ),
      ),
    );
  }
}
```

### **3. Edit Family Member Data**

```dart
class EditMemberDataPage extends StatefulWidget {
  final FamilyMember member;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Edit ${member.name} Data')),
      body: Column(
        children: [
          // Member Info
          Card(
            child: ListTile(
              leading: CircleAvatar(child: Text(member.name[0])),
              title: Text(member.name),
              subtitle: Text(member.email),
            ),
          ),
          
          // Data Tabs
          TabBar(
            tabs: [
              Tab(text: 'Expenses', icon: Icon(Icons.receipt)),
              Tab(text: 'Miles', icon: Icon(Icons.directions_car)),
              Tab(text: 'Hours', icon: Icon(Icons.access_time)),
            ],
          ),
          
          Expanded(
            child: TabBarView(
              children: [
                _buildExpensesList(),
                _buildMilesList(),
                _buildHoursList(),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildExpensesList() {
    return ListView.builder(
      itemCount: memberExpenses.length,
      itemBuilder: (context, index) {
        final expense = memberExpenses[index];
        return ListTile(
          title: Text(expense.description),
          subtitle: Text(expense.category),
          trailing: Text('\$${expense.amount.toStringAsFixed(2)}'),
          onTap: () => _editExpense(expense),
        );
      },
    );
  }
}
```

---

## 📄 **Print, Import & Export Features**

### **1. Print Reports**

```dart
class PrintService {
  static Future<void> printFamilyReport({
    required FamilyGroup family,
    required DateTime startDate,
    required DateTime endDate,
    required List<Expense> expenses,
    required List<Mile> miles,
    required List<Hour> hours,
  }) async {
    final pdf = pw.Document();
    
    // Add report content
    pdf.addPage(
      pw.Page(
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text('Family Bookkeeping Report', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 20),
              pw.Text('Family: ${family.name}'),
              pw.Text('Period: ${DateFormat('MMM dd, yyyy').format(startDate)} - ${DateFormat('MMM dd, yyyy').format(endDate)}'),
              pw.SizedBox(height: 20),
              
              // Summary
              pw.Text('Summary', style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 10),
              pw.Text('Total Expenses: \$${_calculateTotalExpenses(expenses).toStringAsFixed(2)}'),
              pw.Text('Total Miles: ${_calculateTotalMiles(miles).toStringAsFixed(0)}'),
              pw.Text('Total Hours: ${_calculateTotalHours(hours).toStringAsFixed(0)}'),
              pw.SizedBox(height: 20),
              
              // Expenses Table
              pw.Text('Expenses', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 10),
              pw.Table(
                border: pw.TableBorder.all(),
                children: [
                  pw.TableRow(
                    decoration: pw.BoxDecoration(color: PdfColors.grey300),
                    children: [
                      pw.Padding(padding: pw.EdgeInsets.all(8), child: pw.Text('Date')),
                      pw.Padding(padding: pw.EdgeInsets.all(8), child: pw.Text('Description')),
                      pw.Padding(padding: pw.EdgeInsets.all(8), child: pw.Text('Category')),
                      pw.Padding(padding: pw.EdgeInsets.all(8), child: pw.Text('Amount')),
                    ],
                  ),
                  ...expenses.map((expense) => pw.TableRow(
                    children: [
                      pw.Padding(padding: pw.EdgeInsets.all(8), child: pw.Text(DateFormat('MMM dd').format(expense.date))),
                      pw.Padding(padding: pw.EdgeInsets.all(8), child: pw.Text(expense.description)),
                      pw.Padding(padding: pw.EdgeInsets.all(8), child: pw.Text(expense.category)),
                      pw.Padding(padding: pw.EdgeInsets.all(8), child: pw.Text('\$${expense.amount.toStringAsFixed(2)}')),
                    ],
                  )),
                ],
              ),
            ],
          );
        },
      ),
    );
    
    // Print the PDF
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
    );
  }
}
```

### **2. Import Data**

```dart
class ImportService {
  static Future<void> importFromCSV(String filePath, String dataType) async {
    final file = File(filePath);
    final contents = await file.readAsString();
    final lines = contents.split('\n');
    
    if (lines.isEmpty) return;
    
    final headers = lines[0].split(',');
    final data = lines.skip(1).where((line) => line.trim().isNotEmpty);
    
    for (final line in data) {
      final values = line.split(',');
      final record = Map<String, String>.fromIterables(headers, values);
      
      switch (dataType) {
        case 'expenses':
          await _importExpense(record);
          break;
        case 'miles':
          await _importMile(record);
          break;
        case 'hours':
          await _importHour(record);
          break;
      }
    }
  }
  
  static Future<void> importFromExcel(String filePath, String dataType) async {
    final file = File(filePath);
    final bytes = await file.readAsBytes();
    final excel = Excel.decodeBytes(bytes);
    
    for (final table in excel.tables.keys) {
      final sheet = excel.tables[table];
      if (sheet == null) continue;
      
      final headers = sheet.rows[0].map((cell) => cell?.value?.toString() ?? '').toList();
      
      for (int i = 1; i < sheet.rows.length; i++) {
        final row = sheet.rows[i];
        final record = Map<String, String>.fromIterables(
          headers,
          row.map((cell) => cell?.value?.toString() ?? ''),
        );
        
        switch (dataType) {
          case 'expenses':
            await _importExpense(record);
            break;
          case 'miles':
            await _importMile(record);
            break;
          case 'hours':
            await _importHour(record);
            break;
        }
      }
    }
  }
  
  static Future<void> _importExpense(Map<String, String> record) async {
    final expense = Expense(
      id: Uuid().v4(),
      description: record['description'] ?? '',
      amount: double.tryParse(record['amount'] ?? '0') ?? 0.0,
      category: record['category'] ?? 'Other',
      date: DateTime.tryParse(record['date'] ?? '') ?? DateTime.now(),
      userId: currentUser.id,
      familyId: currentFamily.id,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    
    await DatabaseHelper.instance.insertExpense(expense);
    await CloudSyncService.instance.syncExpense(expense);
  }
}
```

### **3. Export Data**

```dart
class ExportService {
  static Future<String> exportToCSV({
    required String dataType,
    required DateTime startDate,
    required DateTime endDate,
    String? memberId,
  }) async {
    List<Map<String, dynamic>> data;
    
    switch (dataType) {
      case 'expenses':
        data = await DatabaseHelper.instance.getExpensesForExport(startDate, endDate, memberId);
        break;
      case 'miles':
        data = await DatabaseHelper.instance.getMilesForExport(startDate, endDate, memberId);
        break;
      case 'hours':
        data = await DatabaseHelper.instance.getHoursForExport(startDate, endDate, memberId);
        break;
      default:
        throw Exception('Invalid data type');
    }
    
    if (data.isEmpty) return '';
    
    final headers = data.first.keys.toList();
    final csv = StringBuffer();
    
    // Add headers
    csv.writeln(headers.join(','));
    
    // Add data rows
    for (final record in data) {
      final values = headers.map((header) => record[header]?.toString() ?? '').toList();
      csv.writeln(values.join(','));
    }
    
    return csv.toString();
  }
  
  static Future<void> exportToExcel({
    required String dataType,
    required DateTime startDate,
    required DateTime endDate,
    String? memberId,
  }) async {
    final excel = Excel.createExcel();
    final sheet = excel['Data'];
    
    List<Map<String, dynamic>> data;
    
    switch (dataType) {
      case 'expenses':
        data = await DatabaseHelper.instance.getExpensesForExport(startDate, endDate, memberId);
        break;
      case 'miles':
        data = await DatabaseHelper.instance.getMilesForExport(startDate, endDate, memberId);
        break;
      case 'hours':
        data = await DatabaseHelper.instance.getHoursForExport(startDate, endDate, memberId);
        break;
      default:
        throw Exception('Invalid data type');
    }
    
    if (data.isEmpty) return;
    
    final headers = data.first.keys.toList();
    
    // Add headers
    for (int i = 0; i < headers.length; i++) {
      sheet!.cell(CellIndex.indexByColumnRow(columnIndex: i, rowIndex: 0)).value = TextCellValue(headers[i]);
    }
    
    // Add data
    for (int row = 0; row < data.length; row++) {
      for (int col = 0; col < headers.length; col++) {
        final value = data[row][headers[col]]?.toString() ?? '';
        sheet!.cell(CellIndex.indexByColumnRow(columnIndex: col, rowIndex: row + 1)).value = TextCellValue(value);
      }
    }
    
    // Save file
    final fileBytes = excel.save();
    final directory = await getApplicationDocumentsDirectory();
    final file = File('${directory.path}/export_${dataType}_${DateTime.now().millisecondsSinceEpoch}.xlsx');
    await file.writeAsBytes(fileBytes!);
    
    // Share file
    await Share.shareXFiles([XFile(file.path)]);
  }
}
```

---

## 🔄 **Data Synchronization**

### **Sync Strategy**
```dart
class SyncService {
  static Future<void> syncAllData() async {
    // 1. Sync local changes to cloud
    await _syncLocalToCloud();
    
    // 2. Sync cloud changes to local
    await _syncCloudToLocal();
    
    // 3. Resolve conflicts
    await _resolveConflicts();
  }
  
  static Future<void> _syncLocalToCloud() async {
    // Get all pending changes
    final pendingExpenses = await DatabaseHelper.instance.getPendingExpenses();
    final pendingMiles = await DatabaseHelper.instance.getPendingMiles();
    final pendingHours = await DatabaseHelper.instance.getPendingHours();
    
    // Sync to cloud
    for (final expense in pendingExpenses) {
      await CloudSyncService.instance.syncExpense(expense);
    }
    
    for (final mile in pendingMiles) {
      await CloudSyncService.instance.syncMile(mile);
    }
    
    for (final hour in pendingHours) {
      await CloudSyncService.instance.syncHour(hour);
    }
  }
}
```

---

## 📱 **Admin Dashboard Features**

### **Admin Dashboard Overview**
```dart
class AdminDashboardPage extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Family Admin Dashboard'),
        actions: [
          IconButton(
            icon: Icon(Icons.add),
            onPressed: () => _showAddMemberDialog(),
          ),
          IconButton(
            icon: Icon(Icons.settings),
            onPressed: () => _showSettingsDialog(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Family Overview Cards
          _buildOverviewCards(),
          
          // Family Members Management
          Expanded(
            child: _buildFamilyMembersList(),
          ),
          
          // Quick Actions
          _buildQuickActions(),
        ],
      ),
    );
  }
  
  Widget _buildOverviewCards() {
    return Container(
      height: 120,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _buildCard('Total Members', familyMembers.length.toString(), Icons.people),
          _buildCard('This Month', '\$${monthlyTotal.toStringAsFixed(2)}', Icons.attach_money),
          _buildCard('Active Users', activeUsers.toString(), Icons.person),
          _buildCard('Pending Invites', pendingInvites.toString(), Icons.mail),
        ],
      ),
    );
  }
}
```

This comprehensive Context.md file covers all aspects of data storage, admin capabilities, and data management features for the Flutter Family Bookkeeping application. The architecture ensures both offline functionality and real-time collaboration while providing powerful admin tools for family management.
