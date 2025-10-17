from rest_framework import serializers
from django.contrib.auth.models import User
from .models import FamilyMember, Expense, Mile, Hour


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class FamilyMemberSerializer(serializers.ModelSerializer):
    """Serializer for FamilyMember model"""
    class Meta:
        model = FamilyMember
        fields = ['id', 'name', 'relation', 'email', 'is_registered', 'send_reports', 'role', 'can_view_all', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense model"""
    family_member_name = serializers.CharField(source='family_member.name', read_only=True)
    
    class Meta:
        model = Expense
        fields = ['id', 'description', 'amount', 'family_member', 'family_member_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class MileSerializer(serializers.ModelSerializer):
    """Serializer for Mile model"""
    family_member_name = serializers.CharField(source='family_member.name', read_only=True)
    
    class Meta:
        model = Mile
        fields = ['id', 'description', 'miles', 'family_member', 'family_member_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class HourSerializer(serializers.ModelSerializer):
    """Serializer for Hour model"""
    family_member_name = serializers.CharField(source='family_member.name', read_only=True)
    
    class Meta:
        model = Hour
        fields = ['id', 'description', 'hours', 'family_member', 'family_member_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user
