from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Sum
from .models import FamilyMember, Expense, Mile, Hour
from .serializers import (
    UserSerializer, FamilyMemberSerializer, ExpenseSerializer, 
    MileSerializer, HourSerializer, UserRegistrationSerializer
)


@api_view(['POST'])
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
        serializer.save(user=self.request.user)


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