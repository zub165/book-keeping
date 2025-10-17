from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import FamilyMember, Expense, Mile, Hour
from decimal import Decimal
from datetime import datetime, timedelta
import random

class Command(BaseCommand):
    help = 'Setup development data for local testing'

    def handle(self, *args, **options):
        self.stdout.write('📊 Setting up development data...')

        # Create test users
        users = []
        for i in range(3):
            user, created = User.objects.get_or_create(
                username=f'testuser{i+1}',
                defaults={
                    'email': f'testuser{i+1}@example.com',
                    'first_name': f'Test User {i+1}',
                    'last_name': 'Family',
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
                self.stdout.write(f'✅ Created user: {user.username}')
            users.append(user)

        # Create family members
        family_members = []
        for i, user in enumerate(users):
            member, created = FamilyMember.objects.get_or_create(
                user=user,
                name=f'{user.first_name} {user.last_name}',
                relation='Self' if i == 0 else 'Child',
                defaults={
                    'email': user.email,
                    'role': 'admin' if i == 0 else 'member',
                    'can_view_all': i == 0,
                }
            )
            if created:
                self.stdout.write(f'✅ Created family member: {member.name}')
            family_members.append(member)

        # Create sample expenses
        categories = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare']
        expense_count = 0
        for _ in range(50):
            expense = Expense.objects.create(
                family_member=random.choice(family_members),
                description=f'Sample expense {random.randint(1, 100)}',
                amount=Decimal(str(random.uniform(10, 500))),
                category=random.choice(categories),
                date=datetime.now() - timedelta(days=random.randint(1, 365)),
            )
            expense_count += 1

        self.stdout.write(f'✅ Created {expense_count} sample expenses')

        # Create sample miles
        mile_count = 0
        for _ in range(20):
            mile = Mile.objects.create(
                family_member=random.choice(family_members),
                description=f'Business trip {random.randint(1, 50)}',
                miles=random.uniform(10, 200),
                rate=Decimal('0.65'),
                date=datetime.now() - timedelta(days=random.randint(1, 365)),
            )
            mile_count += 1

        self.stdout.write(f'✅ Created {mile_count} sample miles')

        # Create sample hours
        hour_count = 0
        for _ in range(30):
            hour = Hour.objects.create(
                family_member=random.choice(family_members),
                description=f'Work hours {random.randint(1, 30)}',
                hours=random.uniform(1, 12),
                rate=Decimal(str(random.uniform(15, 75))),
                date=datetime.now() - timedelta(days=random.randint(1, 365)),
            )
            hour_count += 1

        self.stdout.write(f'✅ Created {hour_count} sample hours')

        self.stdout.write(
            self.style.SUCCESS('✅ Development data created successfully!')
        )
        self.stdout.write('')
        self.stdout.write('📊 Summary:')
        self.stdout.write(f'   👥 Users: {len(users)}')
        self.stdout.write(f'   👨‍👩‍👧‍👦 Family Members: {len(family_members)}')
        self.stdout.write(f'   💰 Expenses: {expense_count}')
        self.stdout.write(f'   🚗 Miles: {mile_count}')
        self.stdout.write(f'   ⏰ Hours: {hour_count}')
        self.stdout.write('')
        self.stdout.write('🔑 Test Login Credentials:')
        self.stdout.write('   Username: testuser1, testuser2, testuser3')
        self.stdout.write('   Password: testpass123')
