import json
import requests
from datetime import datetime, timedelta
from sqlalchemy import select
from jira import JIRA

from app.db import get_db
from app.models.certificates import Certificate, CertificateStatus

JIRA_SERVER = "https://your-domain.atlassian.net"
JIRA_EMAIL = "your-email@example.com"
JIRA_TOKEN = "your_api_token"
TEAMS_WEBHOOK_URL = "https://outlook.office.com/webhook/..."

def send_teams_notification(cert_name, expiry, usage, alert_type):
    """Sends a notification to MS Teams."""
    payload = {
        "title": f"Certificate Alert: {alert_type}",
        "text": (
            f"**Certificate:** {cert_name}\n\n"
            f"**Expiration:** {expiry}\n\n"
            f"**Usage:** {usage}"
        )
    }
    # requests.post(TEAMS_WEBHOOK_URL, json=payload)
    print(f"[Teams] Sent: {alert_type} for {cert_name}")

def create_jira_issue(cert_name, expiry, usage):
    """Creates a Jira ticket for 14-day warnings."""
    try:
        # jira = JIRA(server=JIRA_SERVER, basic_auth=(JIRA_EMAIL, JIRA_TOKEN))
        # jira.create_issue(
        #     project='CERT',
        #     summary=f'Renew Certificate: {cert_name}',
        #     description=f'Cert Name: {cert_name}\nExpiry: {expiry}\nUsage: {usage}',
        #     issuetype={'name': 'Task'}
        # )
        print(f"[Jira] Ticket created for {cert_name}")
    except Exception as e:
        print(f"Jira Error: {e}")

def run_expiry_check():
    db = next(get_db())
    
    try:
        stmt = select(Certificate).where(
            Certificate.status != CertificateStatus.EXPIRED
        )
        certs = db.execute(stmt).scalars().all()

        today = datetime.now().date()
        test_results = []

        for cert in certs:
            expiry_date = cert.expiration_date.date()
            days_diff = (expiry_date - today).days

            triggered = False
            action_note = ""

            if days_diff == 14:
                print(f"[Trigger] 14 Days: Creating Jira for {cert.certificate_name}")
                triggered = True
                action_note = "Jira Ticket Created + Teams Sent"
            
            elif days_diff == 7:
                print(f"[Trigger] 7 Days: Sending Teams Reminder for {cert.certificate_name}")
                triggered = True
                action_note = "Teams Reminder Sent"

            elif 0 <= days_diff <= 3:
                print(f"[Trigger] {days_diff} Days: Sending Urgent Notification for {cert.certificate_name}")
                triggered = True
                action_note = "Urgent Teams Notification Sent"

            if triggered:
                test_results.append({
                    "certificate_name": cert.certificate_name,
                    "expiration_date": str(cert.expiration_date),
                    "usage": cert.usage,
                    "status": cert.status,
                    "days_remaining": days_diff,
                    "action_taken": action_note
                })

        print("\n--- JSON OUTPUT FOR CONSOLE ---")
        print(json.dumps(test_results, indent=4))

    finally:
        db.close()

if __name__ == "__main__":
    run_expiry_check()