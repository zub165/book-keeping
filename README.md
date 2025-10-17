# Family Bookkeeping Application

A comprehensive family bookkeeping system built with Django REST Framework backend and vanilla JavaScript frontend.

## Features

### 🏠 Family Management
- Add, edit, and delete family members
- Role-based access control (Admin/Member)
- Email notifications and reports
- Family member permissions

### 💰 Expense Tracking
- Track expenses by family member
- Categorize and describe expenses
- Date-based filtering
- Export to CSV/JSON

### 🚗 Mile Tracking
- Log business miles
- Set custom rates
- Calculate reimbursements
- Export mileage reports

### ⏰ Hour Tracking
- Track work hours
- Set hourly rates
- Calculate earnings
- Export time reports

### 📊 Reporting & Analytics
- Combined family reports
- Individual member reports
- Charts and visualizations
- Data export (CSV, JSON, PDF)

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based permissions
- Secure API endpoints
- Token refresh mechanism

## Technology Stack

### Backend
- **Django 4.2.7** - Web framework
- **Django REST Framework** - API framework
- **SQLite** - Database (development)
- **PostgreSQL** - Database (production)
- **JWT Authentication** - Token-based auth
- **CORS** - Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Bootstrap 5** - UI framework
- **Chart.js** - Data visualization
- **Font Awesome** - Icons

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js (for frontend development)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd book-keeping
   ```

2. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements/development.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   python manage.py runserver 0.0.0.0:3017
   ```

### Frontend Setup

1. **Start the frontend server**
   ```bash
   # From the root directory
   python -m http.server 8080
   ```

2. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3017/api

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Token refresh

### Family Members
- `GET /api/family-members/` - List family members
- `POST /api/family-members/` - Create family member
- `PUT /api/family-members/{id}/` - Update family member
- `DELETE /api/family-members/{id}/` - Delete family member

### Expenses
- `GET /api/expenses/` - List expenses
- `POST /api/expenses/` - Create expense
- `PUT /api/expenses/{id}/` - Update expense
- `DELETE /api/expenses/{id}/` - Delete expense

### Miles
- `GET /api/miles/` - List miles
- `POST /api/miles/` - Create mile entry
- `PUT /api/miles/{id}/` - Update mile entry
- `DELETE /api/miles/{id}/` - Delete mile entry

### Hours
- `GET /api/hours/` - List hours
- `POST /api/hours/` - Create hour entry
- `PUT /api/hours/{id}/` - Update hour entry
- `DELETE /api/hours/{id}/` - Delete hour entry

## Deployment

### Development
```bash
# Backend
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:3017

# Frontend
python -m http.server 8080
```

### Production
1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations
4. Collect static files
5. Deploy with Gunicorn + Nginx

## Environment Variables

Create `.env` files for different environments:

### Development (.env.development)
```
DJANGO_SETTINGS_MODULE=bookkeeping.settings.development
SECRET_KEY=your_development_secret_key
DEBUG=True
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

### Production (.env.production)
```
DJANGO_SETTINGS_MODULE=bookkeeping.settings.production
SECRET_KEY=your_production_secret_key
DEBUG=False
DJANGO_ALLOWED_HOSTS=api.yourdomain.com,www.yourdomain.com
POSTGRES_DB=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@yourdomain.com or create an issue in the repository.