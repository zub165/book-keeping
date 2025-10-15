# Family Bookkeeping Application

A full-stack web application for tracking family expenses, miles, and hours with Django backend and modern frontend.

## Features

- **User Authentication**: Register and login with JWT tokens
- **Family Member Management**: Add and manage family members
- **Expense Tracking**: Record and track family expenses
- **Miles Tracking**: Log miles for different activities
- **Hours Tracking**: Track hours worked or spent on activities
- **Statistics Dashboard**: View totals and summaries
- **Responsive Design**: Modern Bootstrap 5 UI

## Architecture

- **Backend**: Django REST Framework with JWT authentication
- **Frontend**: Vanilla JavaScript with Bootstrap 5
- **Database**: PostgreSQL (production) / SQLite (development)
- **Deployment**: Docker containers with GitHub Actions

## Quick Start

### Option 1: Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd book-keeping
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

### Option 2: Local Development

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create superuser:
```bash
python manage.py createsuperuser
```

6. Start the backend server:
```bash
python manage.py runserver
```

#### Frontend Setup

1. Navigate to project root:
```bash
cd ..
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the frontend server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/profile/` - Get user profile

### Family Members
- `GET /api/family-members/` - List family members
- `POST /api/family-members/` - Create family member
- `GET /api/family-members/{id}/` - Get family member details
- `PUT /api/family-members/{id}/` - Update family member
- `DELETE /api/family-members/{id}/` - Delete family member

### Expenses
- `GET /api/expenses/` - List expenses
- `POST /api/expenses/` - Create expense
- `GET /api/expenses/{id}/` - Get expense details
- `PUT /api/expenses/{id}/` - Update expense
- `DELETE /api/expenses/{id}/` - Delete expense

### Miles
- `GET /api/miles/` - List miles
- `POST /api/miles/` - Create mile record
- `GET /api/miles/{id}/` - Get mile details
- `PUT /api/miles/{id}/` - Update mile record
- `DELETE /api/miles/{id}/` - Delete mile record

### Hours
- `GET /api/hours/` - List hours
- `POST /api/hours/` - Create hour record
- `GET /api/hours/{id}/` - Get hour details
- `PUT /api/hours/{id}/` - Update hour record
- `DELETE /api/hours/{id}/` - Delete hour record

### Statistics
- `GET /api/statistics/?family_member_id={id}` - Get statistics for family member

## Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://user:password@localhost:5432/bookkeeping
```

## Deployment

### GitHub Actions

The repository includes GitHub Actions workflow for automated testing and deployment:

1. Set up secrets in your GitHub repository:
   - `SECRET_KEY`: Django secret key
   - `DATABASE_URL`: Production database URL

2. Push to main/master branch to trigger deployment

### Manual Deployment

1. Set up production server with Docker
2. Configure environment variables
3. Run `docker-compose up -d`

## Development

### Running Tests

```bash
cd backend
python manage.py test
```

### Database Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Static Files

```bash
cd backend
python manage.py collectstatic
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.
