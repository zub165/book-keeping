# Email Configuration for Family Bookkeeping
# Update these settings with your actual email credentials

EMAIL_CONFIG = {
    'EMAIL_HOST': 'dedrelay.secureserver.net',
    'EMAIL_PORT': 25,
    'EMAIL_USE_TLS': False,
    'EMAIL_USE_SSL': False,
    'EMAIL_HOST_USER': 'your_email@mywaitime.com',  # Replace with your email
    'EMAIL_HOST_PASSWORD': 'your_email_password',   # Replace with your password
    'DEFAULT_FROM_EMAIL': 'noreply@mywaitime.com',
    'SERVER_EMAIL': 'noreply@mywaitime.com',
    'EMAIL_TIMEOUT': 30,
}

# Instructions:
# 1. Replace 'your_email@mywaitime.com' with your actual email address
# 2. Replace 'your_email_password' with your actual email password
# 3. Update the DEFAULT_FROM_EMAIL and SERVER_EMAIL if needed
# 4. Test the email functionality by sending a test email
