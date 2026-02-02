import uuid
import os
import openpyxl
from datetime import datetime, timedelta
from app.db import SessionLocal, engine, Base
from app.models.certificates import Certificate

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def parse_date(date_value):
    """
    Parses date from Excel. Handles both datetime objects (native Excel dates)
    and the specific string format '6/3/2026;2026-06-02T22:00:00Z'.
    """
    if not date_value:
        return datetime.now()
        
    # If openpyxl already read it as a datetime object, just use it
    if isinstance(date_value, datetime):
        # Ensure naive (remove timezone) for Postgres compatibility
        if date_value.tzinfo is not None:
            date_value = date_value.replace(tzinfo=None)
        return date_value

    # If it's a string, parse it
    if isinstance(date_value, str):
        try:
            if ';' in date_value:
                # Take the ISO part (2nd part)
                iso_part = date_value.split(';')[1]
                dt = datetime.fromisoformat(iso_part.replace('Z', '+00:00'))
            else:
                # Fallback for simple date strings
                dt = datetime.strptime(date_value, "%m/%d/%Y")
                
            if dt.tzinfo is not None:
                dt = dt.astimezone().replace(tzinfo=None)
            return dt
        except Exception as e:
            print(f"Error parsing date string '{date_value}': {e}")
            
    return datetime.now()

def populate():
    db = SessionLocal()
    
    # Updated to look for the XLSX file directly
    excel_file_path = "cert watcher one time dump.xlsx"
    
    # Check relative path if script is run from backend/ folder
    if not os.path.exists(excel_file_path):
        excel_file_path = os.path.join(os.path.dirname(__file__), "cert watcher one time dump.xlsx")

    if not os.path.exists(excel_file_path):
        print(f"Error: Excel file not found. Looked for: {excel_file_path}")
        return

    print("Deleting old data...")
    try:
        db.query(Certificate).delete()
        db.commit()
    except Exception as e:
        print(f"Error clearing table: {e}")
        db.rollback()

    print(f"Reading from {excel_file_path}...")
    
    count = 0
    try:
        # Open workbook using openpyxl
        wb = openpyxl.load_workbook(excel_file_path, data_only=True)
        sheet = wb.active # Gets the first sheet
        
        # Get headers from the first row
        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            print("Excel file is empty.")
            return

        headers = rows[0]
        
        # Iterate through remaining rows
        for row_values in rows[1:]:
            # Create a dictionary mapping headers to values
            row = dict(zip(headers, row_values))
            
            title = row.get('Title')
            # Skip empty rows
            if not title: 
                continue

            exp_date_raw = row.get('Expiration')
            desc = row.get('Description')
            usage = row.get('Usage')
            jira_ref = row.get('Jira Reference')
            affected_users = row.get('Effected Users') 
            team = row.get('Jira Team')

            exp_date = parse_date(exp_date_raw)
            
            # Logic to determine status
            now = datetime.now()
            if exp_date < now:
                status = "Expired"
            elif exp_date < (now + timedelta(days=30)):
                status = "Expiring Soon"
            else:
                status = "Valid"

            cert = Certificate(
                cert_id=uuid.uuid4(),
                certificate_title=title,
                expiration_date=exp_date,
                status=status,
                description=desc,
                usage=usage,
                jira_reference=jira_ref,
                affected_users=affected_users,
                team=team
            )
            db.add(cert)
            count += 1
        
        db.commit()
        print(f"Success! Populated {count} certificates from Excel.")
            
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate()