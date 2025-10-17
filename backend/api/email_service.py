# Email Service for Family Bookkeeping
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_family_report(recipient_email, recipient_name, family_member_name, report_data, report_type):
        """
        Send a family bookkeeping report via email
        """
        try:
            subject = f"Family Bookkeeping Report - {report_type.title()}"
            
            # Create HTML email content
            html_content = EmailService._create_report_html(
                recipient_name, family_member_name, report_data, report_type
            )
            
            # Create plain text version
            text_content = EmailService._create_report_text(
                recipient_name, family_member_name, report_data, report_type
            )
            
            # Send email
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email]
            )
            msg.attach_alternative(html_content, "text/html")
            
            result = msg.send()
            logger.info(f"Email sent successfully to {recipient_email}")
            return True, "Email sent successfully"
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
            return False, str(e)
    
    @staticmethod
    def send_welcome_email(recipient_email, recipient_name):
        """
        Send welcome email to new family member
        """
        try:
            subject = "Welcome to Family Bookkeeping"
            
            html_content = f"""
            <html>
            <body>
                <h2>Welcome to Family Bookkeeping!</h2>
                <p>Dear {recipient_name},</p>
                <p>You have been added to our family bookkeeping system. You will receive regular reports about our family's financial activities.</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p>Best regards,<br>Family Bookkeeping System</p>
            </body>
            </html>
            """
            
            text_content = f"""
            Welcome to Family Bookkeeping!
            
            Dear {recipient_name},
            
            You have been added to our family bookkeeping system. You will receive regular reports about our family's financial activities.
            
            If you have any questions, please don't hesitate to contact us.
            
            Best regards,
            Family Bookkeeping System
            """
            
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email]
            )
            msg.attach_alternative(html_content, "text/html")
            
            result = msg.send()
            logger.info(f"Welcome email sent to {recipient_email}")
            return True, "Welcome email sent successfully"
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {recipient_email}: {str(e)}")
            return False, str(e)
    
    @staticmethod
    def send_monthly_summary(recipient_email, recipient_name, family_member_name, summary_data):
        """
        Send monthly summary report
        """
        try:
            subject = f"Monthly Family Bookkeeping Summary - {family_member_name}"
            
            html_content = f"""
            <html>
            <body>
                <h2>Monthly Family Bookkeeping Summary</h2>
                <p>Dear {recipient_name},</p>
                <p>Here is the monthly summary for {family_member_name}:</p>
                
                <h3>Summary</h3>
                <ul>
                    <li><strong>Total Expenses:</strong> ${summary_data.get('total_expenses', 0):.2f}</li>
                    <li><strong>Total Miles:</strong> {summary_data.get('total_miles', 0):.1f} miles</li>
                    <li><strong>Total Hours:</strong> {summary_data.get('total_hours', 0):.1f} hours</li>
                    <li><strong>Tax Deductions:</strong> ${summary_data.get('total_deductions', 0):.2f}</li>
                </ul>
                
                <p>Thank you for using our family bookkeeping system!</p>
                <p>Best regards,<br>Family Bookkeeping System</p>
            </body>
            </html>
            """
            
            text_content = f"""
            Monthly Family Bookkeeping Summary
            
            Dear {recipient_name},
            
            Here is the monthly summary for {family_member_name}:
            
            Summary:
            - Total Expenses: ${summary_data.get('total_expenses', 0):.2f}
            - Total Miles: {summary_data.get('total_miles', 0):.1f} miles
            - Total Hours: {summary_data.get('total_hours', 0):.1f} hours
            - Tax Deductions: ${summary_data.get('total_deductions', 0):.2f}
            
            Thank you for using our family bookkeeping system!
            
            Best regards,
            Family Bookkeeping System
            """
            
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email]
            )
            msg.attach_alternative(html_content, "text/html")
            
            result = msg.send()
            logger.info(f"Monthly summary sent to {recipient_email}")
            return True, "Monthly summary sent successfully"
            
        except Exception as e:
            logger.error(f"Failed to send monthly summary to {recipient_email}: {str(e)}")
            return False, str(e)
    
    @staticmethod
    def _create_report_html(recipient_name, family_member_name, report_data, report_type):
        """Create HTML content for reports"""
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #f8f9fa; padding: 20px; border-radius: 5px; }}
                .summary {{ background-color: #e9ecef; padding: 15px; margin: 20px 0; border-radius: 5px; }}
                .expense-item {{ border-bottom: 1px solid #dee2e6; padding: 10px 0; }}
                .amount {{ font-weight: bold; color: #28a745; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ border: 1px solid #dee2e6; padding: 8px; text-align: left; }}
                th {{ background-color: #f8f9fa; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Family Bookkeeping Report</h2>
                <p>Report Type: {report_type.title()}</p>
                <p>Family Member: {family_member_name}</p>
            </div>
            
            <p>Dear {recipient_name},</p>
            <p>Here is your {report_type} report:</p>
        """
        
        # Add summary if available
        if 'summary' in report_data:
            summary = report_data['summary']
            html_content += f"""
            <div class="summary">
                <h3>Summary</h3>
                <ul>
                    <li><strong>Total Expenses:</strong> ${summary.get('totalExpenses', 0):.2f}</li>
                    <li><strong>Total Miles:</strong> {summary.get('totalMiles', 0):.1f} miles</li>
                    <li><strong>Total Hours:</strong> {summary.get('totalHours', 0):.1f} hours</li>
                </ul>
            </div>
            """
        
        # Add expenses if available
        if 'expenses' in report_data and report_data['expenses']:
            html_content += """
            <h3>Recent Expenses</h3>
            <table>
                <tr>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Date</th>
                </tr>
            """
            for expense in report_data['expenses'][:10]:  # Show last 10 expenses
                html_content += f"""
                <tr>
                    <td>{expense.get('description', 'N/A')}</td>
                    <td class="amount">${float(expense.get('amount', 0)):.2f}</td>
                    <td>{expense.get('created_at', 'N/A')[:10]}</td>
                </tr>
                """
            html_content += "</table>"
        
        html_content += """
            <p>Thank you for using our family bookkeeping system!</p>
            <p>Best regards,<br>Family Bookkeeping System</p>
        </body>
        </html>
        """
        
        return html_content
    
    @staticmethod
    def _create_report_text(recipient_name, family_member_name, report_data, report_type):
        """Create plain text content for reports"""
        text_content = f"""
        Family Bookkeeping Report
        Report Type: {report_type.title()}
        Family Member: {family_member_name}
        
        Dear {recipient_name},
        
        Here is your {report_type} report:
        """
        
        # Add summary if available
        if 'summary' in report_data:
            summary = report_data['summary']
            text_content += f"""
        
        Summary:
        - Total Expenses: ${summary.get('totalExpenses', 0):.2f}
        - Total Miles: {summary.get('totalMiles', 0):.1f} miles
        - Total Hours: {summary.get('totalHours', 0):.1f} hours
        """
        
        # Add expenses if available
        if 'expenses' in report_data and report_data['expenses']:
            text_content += "\n\nRecent Expenses:\n"
            for expense in report_data['expenses'][:10]:
                text_content += f"- {expense.get('description', 'N/A')}: ${float(expense.get('amount', 0)):.2f} ({expense.get('created_at', 'N/A')[:10]})\n"
        
        text_content += """
        
        Thank you for using our family bookkeeping system!
        
        Best regards,
        Family Bookkeeping System
        """
        
        return text_content
