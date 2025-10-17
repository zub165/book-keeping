from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import FamilyMember

class Command(BaseCommand):
    help = 'Clean up duplicate FamilyMember records'

    def handle(self, *args, **options):
        # Find users with multiple FamilyMember records
        users_with_duplicates = []
        
        for user in User.objects.all():
            family_members = FamilyMember.objects.filter(user=user)
            if family_members.count() > 1:
                users_with_duplicates.append(user)
                self.stdout.write(f'User {user.username} has {family_members.count()} family members')
        
        if not users_with_duplicates:
            self.stdout.write('No duplicate family members found.')
            return
        
        # Clean up duplicates for each user
        for user in users_with_duplicates:
            family_members = FamilyMember.objects.filter(user=user).order_by('created_at')
            
            # Keep the first one (oldest) and delete the rest
            to_keep = family_members.first()
            to_delete = family_members.exclude(id=to_keep.id)
            
            self.stdout.write(f'Keeping family member: {to_keep.name} (ID: {to_keep.id})')
            
            for member in to_delete:
                self.stdout.write(f'Deleting duplicate: {member.name} (ID: {member.id})')
                member.delete()
        
        self.stdout.write(
            self.style.SUCCESS('Successfully cleaned up duplicate family members')
        )
