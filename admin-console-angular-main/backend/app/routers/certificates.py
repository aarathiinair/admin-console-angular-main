from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import outerjoin
from typing import Optional
import csv
import io
from datetime import datetime, timedelta
from app.db import get_db
from app.models.certificates import Certificates, JiraState
from app.schemas.certificates import (
    CertificateListResponse, 
    CertificateResponse, 
    CertificateCreate, 
    CertificateUpdate
)

router = APIRouter(
    prefix="/certificates",
    tags=["Certificates"]
)

# --- GET (List & Filter with JOIN) ---
@router.get("/", response_model=CertificateListResponse)
def get_certificates(
    page: int = 1,
    page_size: int = 10,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    responsible_group: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Build query with LEFT OUTER JOIN to jira_state
    query = db.query(
        Certificates,
        JiraState.jira_ticket_id
    ).outerjoin(
        JiraState,
        (Certificates.certificate_name == JiraState.certificate_name) & 
        (Certificates.expiration_date == JiraState.expiration_date)
    )
    
    query = apply_filters(query, status_filter, search, start_date, end_date, responsible_group)

    total_rows = query.count()
    offset = (page - 1) * page_size
    results = query.order_by(Certificates.expiration_date.asc()).offset(offset).limit(page_size).all()

    # Map results to response schema
    items = []
    for cert, jira_ticket_id in results:
        cert_dict = {
            "id": cert.id,
            "certificate_name": cert.certificate_name,
            "expiration_date": cert.expiration_date,
            "description": cert.description,
            "usage": cert.usage,
            "responsible_group": cert.responsible_group,
            "teams_channel": cert.teams_channel,
            "effected_users": cert.effected_users,
            "calculated_status": cert.calculated_status,
            "created_at": cert.created_at,
            "updated_at": cert.updated_at,
            "jira_ticket_id": jira_ticket_id
        }
        items.append(CertificateResponse(**cert_dict))

    return {
        "items": items,
        "total_rows": total_rows,
        "page": page,
        "page_size": page_size
    }

# --- NEW: Download Endpoint with JOIN ---
@router.get("/download")
def download_certificates(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    responsible_group: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        Certificates,
        JiraState.jira_ticket_id
    ).outerjoin(
        JiraState,
        (Certificates.certificate_name == JiraState.certificate_name) & 
        (Certificates.expiration_date == JiraState.expiration_date)
    )
    
    query = apply_filters(query, status_filter, search, start_date, end_date, responsible_group)
    results = query.order_by(Certificates.expiration_date.asc()).all()

    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "ID", "Certificate Name", "Expiration Date", "Status", "Responsible Group", 
        "Teams Channel", "Description", "Usage", "Effected Users", "JIRA Ticket ID"
    ])
    
    # Rows
    for cert, jira_ticket_id in results:
        writer.writerow([
            cert.id,
            cert.certificate_name,
            cert.expiration_date.strftime("%Y-%m-%d"),
            cert.calculated_status,
            cert.responsible_group,
            cert.teams_channel,
            cert.description or "",
            cert.usage or "",
            cert.effected_users or "",
            jira_ticket_id or ""
        ])
    
    output.seek(0)
    filename = f"certificates_report_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# --- Helper to reuse filter logic ---
def apply_filters(query, status_filter, search, start_date, end_date, responsible_group):
    if status_filter and status_filter != "null" and status_filter != "":
        query = query.filter(Certificates.calculated_status == status_filter)

    if start_date:
        query = query.filter(Certificates.expiration_date >= start_date)
    if end_date:
        query = query.filter(Certificates.expiration_date <= end_date)

    if responsible_group and responsible_group != "null" and responsible_group != "":
        query = query.filter(Certificates.responsible_group == responsible_group)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Certificates.certificate_name.ilike(search_fmt)) | 
            (Certificates.description.ilike(search_fmt))
        )
    return query

# --- POST (Create) ---
@router.post("/", response_model=CertificateResponse)
def create_certificate(cert: CertificateCreate, db: Session = Depends(get_db)):
    now = datetime.now()
    expiry = cert.expiration_date
    if expiry.tzinfo is not None:
        expiry = expiry.replace(tzinfo=None)
        
    # Calculate status
    days_diff = (expiry.date() - now.date()).days
    if days_diff < 0:
        status = "EXPIRED"
    elif days_diff < 14:
        status = "EXPIRING_SOON"
    else:
        status = "ACTIVE"

    new_cert = Certificates(
        certificate_name=cert.certificate_name,
        expiration_date=cert.expiration_date,
        description=cert.description,
        usage=cert.usage,
        responsible_group=cert.responsible_group,
        teams_channel=cert.teams_channel,
        effected_users=cert.effected_users,
        calculated_status=status,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db.add(new_cert)
    db.commit()
    db.refresh(new_cert)
    
    # Return with no jira_ticket_id (newly created)
    return CertificateResponse(
        **{**new_cert.__dict__, "jira_ticket_id": None}
    )

# --- PUT (Update) ---
@router.put("/{cert_id}", response_model=CertificateResponse)
def update_certificate(cert_id: int, cert_update: CertificateUpdate, db: Session = Depends(get_db)):
    existing_cert = db.query(Certificates).filter(Certificates.id == cert_id).first()
    if not existing_cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    update_data = cert_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(existing_cert, key, value)
    
    # Recalculate status if expiration_date changed
    if 'expiration_date' in update_data:
        now = datetime.now()
        expiry = existing_cert.expiration_date
        if expiry.tzinfo is not None:
            expiry = expiry.replace(tzinfo=None)
        
        days_diff = (expiry.date() - now.date()).days
        if days_diff < 0:
            existing_cert.calculated_status = "EXPIRED"
        elif days_diff < 14:
            existing_cert.calculated_status = "EXPIRING_SOON"
        else:
            existing_cert.calculated_status = "ACTIVE"
    
    existing_cert.updated_at = datetime.now()
    
    db.commit()
    db.refresh(existing_cert)
    
    # Fetch jira_ticket_id for response
    jira_entry = db.query(JiraState.jira_ticket_id).filter(
        JiraState.certificate_name == existing_cert.certificate_name,
        JiraState.expiration_date == existing_cert.expiration_date
    ).first()
    
    return CertificateResponse(
        **{**existing_cert.__dict__, "jira_ticket_id": jira_entry[0] if jira_entry else None}
    )

# --- DELETE ---
@router.delete("/{cert_id}")
def delete_certificate(cert_id: int, db: Session = Depends(get_db)):
    existing_cert = db.query(Certificates).filter(Certificates.id == cert_id).first()
    if not existing_cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    db.delete(existing_cert)
    db.commit()
    return {"detail": "Certificate deleted successfully"}