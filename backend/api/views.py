from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
try:
    import pandas as pd
    import openpyxl
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    pd = None
    openpyxl = None

from io import BytesIO
import json
from datetime import datetime, timedelta
from .models import FamilyMember, Expense, Mile, Hour
from .serializers import (
    UserSerializer, FamilyMemberSerializer, ExpenseSerializer, 
    MileSerializer, HourSerializer, UserRegistrationSerializer
)
from .email_service import EmailService


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration endpoint"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Create a family member record for the user
        FamilyMember.objects.create(
            user=user,
            name=f"{user.first_name} {user.last_name}".strip() or user.username,
            relation='Self'
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """User login endpoint"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def refresh_token(request):
    """Refresh JWT token endpoint"""
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        refresh = RefreshToken(refresh_token)
        new_access_token = str(refresh.access_token)
        return Response({'access': new_access_token})
    except Exception as e:
        return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get current user profile"""
    return Response(UserSerializer(request.user).data)


class FamilyMemberListCreateView(generics.ListCreateAPIView):
    """List and create family members"""
    serializer_class = FamilyMemberSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FamilyMember.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        try:
            # Log the data being saved
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Creating family member with data: {self.request.data}")
            
            serializer.save(user=self.request.user)
            logger.info(f"Family member created successfully")
        except Exception as e:
            # Log the error for debugging
            logger = logging.getLogger(__name__)
            logger.error(f"Error creating family member: {str(e)}")
            logger.error(f"Request data: {self.request.data}")
            raise e


class FamilyMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a family member"""
    serializer_class = FamilyMemberSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FamilyMember.objects.filter(user=self.request.user)


class ExpenseListCreateView(generics.ListCreateAPIView):
    """List and create expenses"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        family_member_id = self.request.query_params.get('family_member_id')
        if family_member_id:
            return Expense.objects.filter(
                family_member__user=self.request.user,
                family_member_id=family_member_id
            )
        return Expense.objects.filter(family_member__user=self.request.user)
    
    def perform_create(self, serializer):
        family_member_id = self.request.data.get('family_member')
        family_member = FamilyMember.objects.get(
            id=family_member_id, 
            user=self.request.user
        )
        serializer.save(family_member=family_member)


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an expense"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Expense.objects.filter(family_member__user=self.request.user)


class MileListCreateView(generics.ListCreateAPIView):
    """List and create miles"""
    serializer_class = MileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        family_member_id = self.request.query_params.get('family_member_id')
        if family_member_id:
            return Mile.objects.filter(
                family_member__user=self.request.user,
                family_member_id=family_member_id
            )
        return Mile.objects.filter(family_member__user=self.request.user)
    
    def perform_create(self, serializer):
        family_member_id = self.request.data.get('family_member')
        family_member = FamilyMember.objects.get(
            id=family_member_id, 
            user=self.request.user
        )
        serializer.save(family_member=family_member)


class MileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a mile record"""
    serializer_class = MileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Mile.objects.filter(family_member__user=self.request.user)


class HourListCreateView(generics.ListCreateAPIView):
    """List and create hours"""
    serializer_class = HourSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        family_member_id = self.request.query_params.get('family_member_id')
        if family_member_id:
            return Hour.objects.filter(
                family_member__user=self.request.user,
                family_member_id=family_member_id
            )
        return Hour.objects.filter(family_member__user=self.request.user)
    
    def perform_create(self, serializer):
        family_member_id = self.request.data.get('family_member')
        family_member = FamilyMember.objects.get(
            id=family_member_id, 
            user=self.request.user
        )
        serializer.save(family_member=family_member)


class HourDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an hour record"""
    serializer_class = HourSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Hour.objects.filter(family_member__user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def statistics(request):
    """Get statistics for a family member"""
    family_member_id = request.query_params.get('family_member_id')
    
    if not family_member_id:
        return Response({'error': 'Family member ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        family_member = FamilyMember.objects.get(
            id=family_member_id, 
            user=request.user
        )
    except FamilyMember.DoesNotExist:
        return Response({'error': 'Family member not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Calculate totals
    total_expenses = Expense.objects.filter(family_member=family_member).aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    total_miles = Mile.objects.filter(family_member=family_member).aggregate(
        total=Sum('miles')
    )['total'] or 0
    
    total_hours = Hour.objects.filter(family_member=family_member).aggregate(
        total=Sum('hours')
    )['total'] or 0
    
    return Response({
        'total_expenses': float(total_expenses),
        'total_miles': float(total_miles),
        'total_hours': float(total_hours)
    })


# AI-Powered Tax Categorization
def categorize_expense_for_tax(description, amount):
    """AI-powered tax categorization for expenses"""
    description_lower = description.lower()
    
    # Business/Work-related expenses
    business_keywords = ['office', 'supplies', 'computer', 'software', 'internet', 'phone', 'travel', 'meeting', 'client', 'business']
    if any(keyword in description_lower for keyword in business_keywords):
        return {
            'category': 'Business Expense',
            'tax_deductible': True,
            'confidence': 0.85,
            'suggested_form': 'Schedule C'
        }
    
    # Medical expenses
    medical_keywords = ['doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'health', 'dental', 'vision', 'prescription']
    if any(keyword in description_lower for keyword in medical_keywords):
        return {
            'category': 'Medical Expense',
            'tax_deductible': amount > 0.075,  # 7.5% of AGI threshold
            'confidence': 0.90,
            'suggested_form': 'Schedule A'
        }
    
    # Education expenses
    education_keywords = ['school', 'tuition', 'education', 'college', 'university', 'books', 'student', 'learning']
    if any(keyword in description_lower for keyword in education_keywords):
        return {
            'category': 'Education Expense',
            'tax_deductible': True,
            'confidence': 0.80,
            'suggested_form': 'Form 8863'
        }
    
    # Charitable contributions
    charity_keywords = ['donation', 'charity', 'church', 'nonprofit', 'foundation', 'relief', 'help']
    if any(keyword in description_lower for keyword in charity_keywords):
        return {
            'category': 'Charitable Contribution',
            'tax_deductible': True,
            'confidence': 0.85,
            'suggested_form': 'Schedule A'
        }
    
    # Home office expenses
    home_office_keywords = ['home office', 'office supplies', 'utilities', 'rent', 'mortgage']
    if any(keyword in description_lower for keyword in home_office_keywords):
        return {
            'category': 'Home Office Expense',
            'tax_deductible': True,
            'confidence': 0.75,
            'suggested_form': 'Form 8829'
        }
    
    # Default categorization
    return {
        'category': 'Personal Expense',
        'tax_deductible': False,
        'confidence': 0.50,
        'suggested_form': 'Not applicable'
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_transactions(request):
    """Export all transactions to Excel/CSV"""
    format_type = request.query_params.get('format', 'excel')  # excel or csv
    year = request.query_params.get('year', datetime.now().year)
    
    # Get all family members for the user
    family_members = FamilyMember.objects.filter(user=request.user)
    
    # Prepare data for export
    export_data = []
    
    for member in family_members:
        # Get expenses
        expenses = Expense.objects.filter(family_member=member, created_at__year=year)
        for expense in expenses:
            tax_info = categorize_expense_for_tax(expense.description, float(expense.amount))
            export_data.append({
                'Date': expense.created_at.strftime('%Y-%m-%d'),
                'Family Member': member.name,
                'Type': 'Expense',
                'Description': expense.description,
                'Amount': float(expense.amount),
                'Tax Category': tax_info['category'],
                'Tax Deductible': tax_info['tax_deductible'],
                'Confidence': tax_info['confidence'],
                'Suggested Form': tax_info['suggested_form']
            })
        
        # Get miles
        miles = Mile.objects.filter(family_member=member, created_at__year=year)
        for mile in miles:
            export_data.append({
                'Date': mile.created_at.strftime('%Y-%m-%d'),
                'Family Member': member.name,
                'Type': 'Mile',
                'Description': mile.description,
                'Amount': float(mile.miles),
                'Tax Category': 'Business Mileage',
                'Tax Deductible': True,
                'Confidence': 0.90,
                'Suggested Form': 'Schedule C'
            })
        
        # Get hours
        hours = Hour.objects.filter(family_member=member, created_at__year=year)
        for hour in hours:
            export_data.append({
                'Date': hour.created_at.strftime('%Y-%m-%d'),
                'Family Member': member.name,
                'Type': 'Hour',
                'Description': hour.description,
                'Amount': float(hour.hours),
                'Tax Category': 'Work Hours',
                'Tax Deductible': False,
                'Confidence': 0.70,
                'Suggested Form': 'Not applicable'
            })
    
    # Create DataFrame
    df = pd.DataFrame(export_data)
    
    if format_type == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="family_transactions_{year}.csv"'
        df.to_csv(response, index=False)
        return response
    else:  # Excel
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="family_transactions_{year}.xlsx"'
        
        # Create Excel file
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Transactions', index=False)
            
            # Add tax summary sheet
            tax_summary = df.groupby(['Tax Category', 'Tax Deductible']).agg({
                'Amount': 'sum',
                'Confidence': 'mean'
            }).reset_index()
            tax_summary.to_excel(writer, sheet_name='Tax Summary', index=False)
            
            # Add family member summary
            member_summary = df.groupby('Family Member').agg({
                'Amount': 'sum',
                'Type': 'count'
            }).reset_index()
            member_summary.columns = ['Family Member', 'Total Amount', 'Transaction Count']
            member_summary.to_excel(writer, sheet_name='Family Summary', index=False)
        
        output.seek(0)
        response.write(output.getvalue())
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_transactions(request):
    """Import transactions from Excel/CSV file"""
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    family_member_id = request.data.get('family_member_id')
    
    if not family_member_id:
        return Response({'error': 'Family member ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        family_member = FamilyMember.objects.get(id=family_member_id, user=request.user)
    except FamilyMember.DoesNotExist:
        return Response({'error': 'Family member not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        # Read the file
        if file.name.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        # Validate required columns
        required_columns = ['Date', 'Description', 'Amount', 'Type']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({
                'error': f'Missing required columns: {", ".join(missing_columns)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        imported_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Parse date
                if isinstance(row['Date'], str):
                    date = datetime.strptime(row['Date'], '%Y-%m-%d')
                else:
                    date = row['Date']
                
                # Create transaction based on type
                if row['Type'].lower() == 'expense':
                    Expense.objects.create(
                        family_member=family_member,
                        description=row['Description'],
                        amount=float(row['Amount']),
                        created_at=date
                    )
                    imported_count += 1
                elif row['Type'].lower() == 'mile':
                    Mile.objects.create(
                        family_member=family_member,
                        description=row['Description'],
                        miles=float(row['Amount']),
                        created_at=date
                    )
                    imported_count += 1
                elif row['Type'].lower() == 'hour':
                    Hour.objects.create(
                        family_member=family_member,
                        description=row['Description'],
                        hours=float(row['Amount']),
                        created_at=date
                    )
                    imported_count += 1
                    
            except Exception as e:
                errors.append(f'Row {index + 1}: {str(e)}')
        
        return Response({
            'message': f'Successfully imported {imported_count} transactions',
            'errors': errors[:10]  # Limit to first 10 errors
        })
        
    except Exception as e:
        return Response({'error': f'Failed to process file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tax_report(request):
    """Generate AI-powered tax report for the year"""
    year = request.query_params.get('year', datetime.now().year)
    
    # Get all transactions for the year
    family_members = FamilyMember.objects.filter(user=request.user)
    
    tax_data = {
        'year': year,
        'total_deductible': 0,
        'categories': {},
        'recommendations': [],
        'forms_needed': set()
    }
    
    for member in family_members:
        expenses = Expense.objects.filter(family_member=member, created_at__year=year)
        
        for expense in expenses:
            tax_info = categorize_expense_for_tax(expense.description, float(expense.amount))
            
            category = tax_info['category']
            if category not in tax_data['categories']:
                tax_data['categories'][category] = {
                    'total': 0,
                    'count': 0,
                    'deductible': 0,
                    'confidence': 0
                }
            
            tax_data['categories'][category]['total'] += float(expense.amount)
            tax_data['categories'][category]['count'] += 1
            tax_data['categories'][category]['confidence'] += tax_info['confidence']
            
            if tax_info['tax_deductible']:
                tax_data['categories'][category]['deductible'] += float(expense.amount)
                tax_data['total_deductible'] += float(expense.amount)
                tax_data['forms_needed'].add(tax_info['suggested_form'])
    
    # Calculate average confidence
    for category in tax_data['categories']:
        if tax_data['categories'][category]['count'] > 0:
            tax_data['categories'][category]['confidence'] /= tax_data['categories'][category]['count']
    
    # Generate AI recommendations
    if tax_data['total_deductible'] > 0:
        tax_data['recommendations'].append(f"Total potential tax deductions: ${tax_data['total_deductible']:,.2f}")
    
    if 'Medical Expense' in tax_data['categories']:
        medical_total = tax_data['categories']['Medical Expense']['deductible']
        if medical_total > 0:
            tax_data['recommendations'].append(f"Medical expenses: ${medical_total:,.2f} (may be deductible if > 7.5% of AGI)")
    
    if 'Business Expense' in tax_data['categories']:
        business_total = tax_data['categories']['Business Expense']['deductible']
        if business_total > 0:
            tax_data['recommendations'].append(f"Business expenses: ${business_total:,.2f} (Schedule C required)")
    
    tax_data['forms_needed'] = list(tax_data['forms_needed'])
    
    return Response(tax_data)


# Email Endpoints
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_family_report(request):
    """Send a report to a family member via email"""
    try:
        data = request.data
        recipient_email = data.get('recipient_email')
        recipient_name = data.get('recipient_name')
        family_member_id = data.get('family_member_id')
        report_type = data.get('report_type', 'monthly')
        
        if not all([recipient_email, recipient_name, family_member_id]):
            return Response({
                'error': 'recipient_email, recipient_name, and family_member_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get family member
        try:
            family_member = FamilyMember.objects.get(
                id=family_member_id, 
                user=request.user
            )
        except FamilyMember.DoesNotExist:
            return Response({'error': 'Family member not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get report data
        expenses = Expense.objects.filter(family_member=family_member)
        miles = Mile.objects.filter(family_member=family_member)
        hours = Hour.objects.filter(family_member=family_member)
        
        # Calculate summary
        total_expenses = expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        total_miles = miles.aggregate(Sum('miles'))['miles__sum'] or 0
        total_hours = hours.aggregate(Sum('hours'))['hours__sum'] or 0
        
        report_data = {
            'summary': {
                'totalExpenses': float(total_expenses),
                'totalMiles': float(total_miles),
                'totalHours': float(total_hours)
            },
            'expenses': [
                {
                    'description': exp.description,
                    'amount': float(exp.amount),
                    'created_at': exp.created_at.isoformat()
                } for exp in expenses[:10]
            ]
        }
        
        # Send email
        success, message = EmailService.send_family_report(
            recipient_email, recipient_name, family_member.name, report_data, report_type
        )
        
        if success:
            return Response({'message': message}, status=status.HTTP_200_OK)
        else:
            return Response({'error': message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_welcome_email(request):
    """Send welcome email to a new family member"""
    try:
        data = request.data
        recipient_email = data.get('recipient_email')
        recipient_name = data.get('recipient_name')
        
        if not all([recipient_email, recipient_name]):
            return Response({
                'error': 'recipient_email and recipient_name are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Send welcome email
        success, message = EmailService.send_welcome_email(recipient_email, recipient_name)
        
        if success:
            return Response({'message': message}, status=status.HTTP_200_OK)
        else:
            return Response({'error': message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_monthly_summary(request):
    """Send monthly summary to family members"""
    try:
        data = request.data
        family_member_id = data.get('family_member_id')
        
        if not family_member_id:
            return Response({'error': 'family_member_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get family member
        try:
            family_member = FamilyMember.objects.get(
                id=family_member_id, 
                user=request.user
            )
        except FamilyMember.DoesNotExist:
            return Response({'error': 'Family member not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get family members with email addresses
        family_members_with_email = FamilyMember.objects.filter(
            user=request.user,
            email__isnull=False
        ).exclude(email='')
        
        if not family_members_with_email.exists():
            return Response({'error': 'No family members with email addresses found'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate summary data
        expenses = Expense.objects.filter(family_member=family_member)
        miles = Mile.objects.filter(family_member=family_member)
        hours = Hour.objects.filter(family_member=family_member)
        
        summary_data = {
            'total_expenses': float(expenses.aggregate(Sum('amount'))['amount__sum'] or 0),
            'total_miles': float(miles.aggregate(Sum('miles'))['miles__sum'] or 0),
            'total_hours': float(hours.aggregate(Sum('hours'))['hours__sum'] or 0),
            'total_deductions': float(expenses.aggregate(Sum('amount'))['amount__sum'] or 0) * 0.1  # 10% deduction estimate
        }
        
        # Send emails to all family members with email addresses
        results = []
        for member in family_members_with_email:
            success, message = EmailService.send_monthly_summary(
                member.email, member.name, family_member.name, summary_data
            )
            results.append({
                'email': member.email,
                'name': member.name,
                'success': success,
                'message': message
            })
        
        return Response({
            'message': 'Monthly summary emails processed',
            'results': results
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_email(request):
    """Test email functionality"""
    try:
        data = request.data
        test_email = data.get('test_email')
        
        if not test_email:
            return Response({'error': 'test_email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Send test email
        success, message = EmailService.send_welcome_email(test_email, "Test User")
        
        if success:
            return Response({'message': f'Test email sent to {test_email}'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': f'Failed to send test email: {message}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Multi-User Family System Endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_family_member(request):
    """Get the current user's family member profile"""
    try:
        # Get the first family member for the user (or the one with 'Self' relation)
        family_members = FamilyMember.objects.filter(user=request.user)
        
        if not family_members.exists():
            return Response({'error': 'Family member profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Try to get the 'Self' relation first, otherwise get the first one
        family_member = family_members.filter(relation='Self').first()
        if not family_member:
            family_member = family_members.first()
        
        serializer = FamilyMemberSerializer(family_member)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_family_data(request):
    """Get all family data for admin users"""
    try:
        # Check if user is admin - get the first family member with admin privileges
        user_family_members = FamilyMember.objects.filter(user=request.user)
        if not user_family_members.exists():
            return Response({'error': 'Family member profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Find admin family member (preferably 'Self' relation)
        user_family_member = user_family_members.filter(relation='Self').first()
        if not user_family_member:
            user_family_member = user_family_members.first()
        
        if not user_family_member.can_view_all:
            return Response({'error': 'Access denied. Admin privileges required.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all family members
        all_family_members = FamilyMember.objects.filter(user=request.user)
        
        # Get all expenses, miles, and hours for all family members
        all_expenses = Expense.objects.filter(family_member__in=all_family_members)
        all_miles = Mile.objects.filter(family_member__in=all_family_members)
        all_hours = Hour.objects.filter(family_member__in=all_family_members)
        
        # Calculate combined statistics
        total_expenses = all_expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        total_miles = all_miles.aggregate(Sum('miles'))['miles__sum'] or 0
        total_hours = all_hours.aggregate(Sum('hours'))['hours__sum'] or 0
        
        # Get individual statistics for each family member
        individual_stats = []
        for member in all_family_members:
            member_expenses = all_expenses.filter(family_member=member)
            member_miles = all_miles.filter(family_member=member)
            member_hours = all_hours.filter(family_member=member)
            
            individual_stats.append({
                'family_member': FamilyMemberSerializer(member).data,
                'expenses': ExpenseSerializer(member_expenses, many=True).data,
                'miles': MileSerializer(member_miles, many=True).data,
                'hours': HourSerializer(member_hours, many=True).data,
                'statistics': {
                    'total_expenses': float(member_expenses.aggregate(Sum('amount'))['amount__sum'] or 0),
                    'total_miles': float(member_miles.aggregate(Sum('miles'))['miles__sum'] or 0),
                    'total_hours': float(member_hours.aggregate(Sum('hours'))['hours__sum'] or 0)
                }
            })
        
        return Response({
            'combined_statistics': {
                'total_expenses': float(total_expenses),
                'total_miles': float(total_miles),
                'total_hours': float(total_hours),
                'family_member_count': all_family_members.count()
            },
            'individual_data': individual_stats,
            'all_expenses': ExpenseSerializer(all_expenses, many=True).data,
            'all_miles': MileSerializer(all_miles, many=True).data,
            'all_hours': HourSerializer(all_hours, many=True).data
        })
        
    except FamilyMember.DoesNotExist:
        return Response({'error': 'Family member profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_family_member_data(request, member_id):
    """Get specific family member's data"""
    try:
        # Check if user can view this data
        user_family_members = FamilyMember.objects.filter(user=request.user)
        if not user_family_members.exists():
            return Response({'error': 'Family member profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get the user's main family member (preferably 'Self' relation)
        user_family_member = user_family_members.filter(relation='Self').first()
        if not user_family_member:
            user_family_member = user_family_members.first()
        
        target_member = FamilyMember.objects.get(id=member_id)
        
        # Allow if user is admin or viewing their own data
        if not user_family_member.can_view_all and user_family_member.id != target_member.id:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get data for the specific family member
        expenses = Expense.objects.filter(family_member=target_member)
        miles = Mile.objects.filter(family_member=target_member)
        hours = Hour.objects.filter(family_member=target_member)
        
        return Response({
            'family_member': FamilyMemberSerializer(target_member).data,
            'expenses': ExpenseSerializer(expenses, many=True).data,
            'miles': MileSerializer(miles, many=True).data,
            'hours': HourSerializer(hours, many=True).data,
            'statistics': {
                'total_expenses': float(expenses.aggregate(Sum('amount'))['amount__sum'] or 0),
                'total_miles': float(miles.aggregate(Sum('miles'))['miles__sum'] or 0),
                'total_hours': float(hours.aggregate(Sum('hours'))['hours__sum'] or 0)
            }
        })
        
    except FamilyMember.DoesNotExist:
        return Response({'error': 'Family member not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)