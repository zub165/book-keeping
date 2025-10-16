#!/usr/bin/env python3

# Script to fix Django CORS settings
import os
import sys

# Add Django project to path
sys.path.append('/home/newgen/hospitalfinder/family_bookkeeping')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookkeeping.settings')

import django
django.setup()

from django.conf import settings

# Update CORS settings
settings_file = '/home/newgen/hospitalfinder/family_bookkeeping/bookkeeping/settings.py'

# Read current settings
with open(settings_file, 'r') as f:
    content = f.read()

# Replace CORS settings
new_cors_settings = '''
# CORS settings - Fixed for GitHub Pages
CORS_ALLOWED_ORIGINS = [
    "https://zub165.github.io",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# Remove wildcard CORS
CORS_ALLOW_ALL_ORIGINS = False
'''

# Find and replace CORS section
import re
pattern = r'# CORS settings.*?CORS_ALLOW_CREDENTIALS = True'
content = re.sub(pattern, new_cors_settings.strip(), content, flags=re.DOTALL)

# Write updated settings
with open(settings_file, 'w') as f:
    f.write(content)

print("✅ Django CORS settings updated!")
print("✅ Removed wildcard CORS")
print("✅ Set specific origins only")
