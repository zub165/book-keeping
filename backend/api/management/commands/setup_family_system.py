from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import FamilyMember

class Command(BaseCommand):
    help = 'Set up proper family system with sample data'

    def handle(self, *args, **options):
        # Get the main user
        try:
            main_user = User.objects.get(username='zm_199@hotmail.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('User zm_199@hotmail.com not found'))
            return

        # Update the main user to be admin
        main_family_member = FamilyMember.objects.get(user=main_user)
        main_family_member.role = 'admin'
        main_family_member.can_view_all = True
        main_family_member.save()
        
        self.stdout.write(f'Updated {main_family_member.name} to admin role')

        # Create sample family members for the main user
        family_members_data = [
            {'name': 'Muhammad Abdullah', 'relation': 'Child', 'email': 'abdullah@example.com'},
            {'name': 'Ayesha Zubair', 'relation': 'Child', 'email': 'ayesha@example.com'},
            {'name': 'Fatima Malik', 'relation': 'Spouse', 'email': 'fatima@example.com'},
        ]

        for member_data in family_members_data:
            # Create family member record for the main user
            family_member, created = FamilyMember.objects.get_or_create(
                user=main_user,
                name=member_data['name'],
                defaults={
                    'relation': member_data['relation'],
                    'email': member_data['email'],
                    'role': 'member',
                    'can_view_all': False,
                    'send_reports': True,
                    'is_registered': False
                }
            )
            
            if created:
                self.stdout.write(f'Created family member: {family_member.name}')
            else:
                self.stdout.write(f'Family member already exists: {family_member.name}')

        # Show current family members
        family_members = FamilyMember.objects.filter(user=main_user)
        self.stdout.write(f'\nTotal family members for {main_user.username}: {family_members.count()}')
        for fm in family_members:
            self.stdout.write(f'  - {fm.name} ({fm.relation}) - Role: {fm.role}')

        self.stdout.write(
            self.style.SUCCESS('Family system setup complete!')
        )
