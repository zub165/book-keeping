from django.db import models
from django.contrib.auth.models import User


class FamilyMember(models.Model):
    """Model for family members"""
    RELATION_CHOICES = [
        ('Self', 'Self'),
        ('Spouse', 'Spouse'),
        ('Child', 'Child'),
        ('Parent', 'Parent'),
        ('Sibling', 'Sibling'),
        ('Other', 'Other'),
    ]
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('member', 'Family Member'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='family_members')
    name = models.CharField(max_length=100)
    relation = models.CharField(max_length=20, choices=RELATION_CHOICES)
    email = models.EmailField(blank=True, null=True, help_text="Email for sending registration invites")
    is_registered = models.BooleanField(default=False, help_text="Whether this family member has registered")
    send_reports = models.BooleanField(default=False, help_text="Whether to send reports to this family member")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member', help_text="User role in the family")
    can_view_all = models.BooleanField(default=False, help_text="Can view all family members' data")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        # Allow multiple family members per user
        # unique_together = ['user']
    
    def __str__(self):
        return f"{self.name} ({self.relation})"


class Expense(models.Model):
    """Model for tracking expenses"""
    family_member = models.ForeignKey(FamilyMember, on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.description} - ${self.amount}"


class Mile(models.Model):
    """Model for tracking miles"""
    family_member = models.ForeignKey(FamilyMember, on_delete=models.CASCADE, related_name='miles')
    description = models.CharField(max_length=200)
    miles = models.DecimalField(max_digits=8, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.description} - {self.miles} miles"


class Hour(models.Model):
    """Model for tracking hours"""
    family_member = models.ForeignKey(FamilyMember, on_delete=models.CASCADE, related_name='hours')
    description = models.CharField(max_length=200)
    hours = models.DecimalField(max_digits=6, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.description} - {self.hours} hours"