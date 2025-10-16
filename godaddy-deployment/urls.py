from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/refresh/', views.refresh_token, name='refresh_token'),
    path('auth/profile/', views.user_profile, name='user_profile'),
    
    # Family members endpoints
    path('family-members/', views.FamilyMemberListCreateView.as_view(), name='family_member_list'),
    path('family-members/<int:pk>/', views.FamilyMemberDetailView.as_view(), name='family_member_detail'),
    
    # Expenses endpoints
    path('expenses/', views.ExpenseListCreateView.as_view(), name='expense_list'),
    path('expenses/<int:pk>/', views.ExpenseDetailView.as_view(), name='expense_detail'),
    
    # Miles endpoints
    path('miles/', views.MileListCreateView.as_view(), name='mile_list'),
    path('miles/<int:pk>/', views.MileDetailView.as_view(), name='mile_detail'),
    
    # Hours endpoints
    path('hours/', views.HourListCreateView.as_view(), name='hour_list'),
    path('hours/<int:pk>/', views.HourDetailView.as_view(), name='hour_detail'),
    
    # Statistics endpoint
    path('statistics/', views.statistics, name='statistics'),
    
    # Export/Import endpoints
    path('export/', views.export_transactions, name='export_transactions'),
    path('import/', views.import_transactions, name='import_transactions'),
    path('tax-report/', views.tax_report, name='tax_report'),
]
