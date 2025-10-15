from django.contrib import admin
from .models import FamilyMember, Expense, Mile, Hour


@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ['name', 'relation', 'user', 'created_at']
    list_filter = ['relation', 'created_at']
    search_fields = ['name', 'user__username']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'amount', 'family_member', 'created_at']
    list_filter = ['created_at', 'family_member__relation']
    search_fields = ['description', 'family_member__name']


@admin.register(Mile)
class MileAdmin(admin.ModelAdmin):
    list_display = ['description', 'miles', 'family_member', 'created_at']
    list_filter = ['created_at', 'family_member__relation']
    search_fields = ['description', 'family_member__name']


@admin.register(Hour)
class HourAdmin(admin.ModelAdmin):
    list_display = ['description', 'hours', 'family_member', 'created_at']
    list_filter = ['created_at', 'family_member__relation']
    search_fields = ['description', 'family_member__name']