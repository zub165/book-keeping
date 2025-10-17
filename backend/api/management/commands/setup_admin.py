from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import FamilyMember

class Command(BaseCommand):
    help = 'Set up the first user as admin'

    def handle(self, *args, **options):
        # Get the first user
        first_user = User.objects.first()
        if not first_user:
            self.stdout.write(self.style.ERROR('No users found. Please create a user first.'))
            return

        # Create or update family member for the first user
        family_member, created = FamilyMember.objects.get_or_create(
            user=first_user,
            defaults={
                'name': first_user.first_name or first_user.username,
                'relation': 'Self',
                'role': 'admin',
                'can_view_all': True
            }
        )

        if not created:
            # Update existing family member to be admin
            family_member.role = 'admin'
            family_member.can_view_all = True
            family_member.save()

        self.stdout.write(
            self.style.SUCCESS(f'Successfully set up {first_user.username} as admin')
        )
