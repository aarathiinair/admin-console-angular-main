from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, asc, and_
from app.db import get_db
from app.models.certificates import Certificate
from app.schemas.certificate_report import CertReportRequest, CertReportResponse, CertDataRow
from datetime import datetime, date
import io
import csv

router = APIRouter(prefix="/certificates", tags=["Certificate Watcher"])

def update_statuses_if_needed(db: Session):
    now = datetime.now()
    # Find Valid certs that have expired and update them
    expired_certs = db.execute(
        select(Certificate).where(
            and_(
                Certificate.expiration_date < now,
                func.lower(Certificate.status) == 'valid'
            )
        )
    ).scalars().all()

    if expired_certs:
        for cert in expired_certs:
            cert.status = "Expired"
        db.commit()

def build_query(request: CertReportRequest):
    stmt = select(Certificate)
    filter_clauses = []

    if request.search_date_start and request.search_date_end:
        filter_clauses.append(Certificate.expiration_date >= request.search_date_start)
        filter_clauses.append(Certificate.expiration_date <= request.search_date_end)
    if request.search_person:
        filter_clauses.append(Certificate.responsible_person.ilike(f"%{request.search_person}%"))
    if request.search_teams:
        filter_clauses.append(Certificate.teams_channel.ilike(f"%{request.search_teams}%"))
    if request.filter_status:
        filter_clauses.append(func.lower(Certificate.status) == request.filter_status.lower())
    if request.search_name:
        filter_clauses.append(Certificate.certificate_name.ilike(f"%{request.search_name}%"))

    if filter_clauses:
        stmt = stmt.where(and_(*filter_clauses))
    
    return stmt

@router.post("/data", response_model=CertReportResponse)
async def get_certificate_data(
    request: CertReportRequest,
    db: Session = Depends(get_db)
):
    update_statuses_if_needed(db)
    stmt = build_query(request)

    # Count Total
    total_rows = db.scalar(select(func.count()).select_from(stmt.subquery()))

    # Sort
    sort_col = getattr(Certificate, request.sort_by, Certificate.expiration_date)
    if request.sort_order == 'desc':
        stmt = stmt.order_by(desc(sort_col))
    else:
        stmt = stmt.order_by(asc(sort_col))

    # Paginate
    stmt = stmt.limit(request.page_size).offset((request.page - 1) * request.page_size)
    
    results = db.execute(stmt).scalars().all()
    data = [CertDataRow.model_validate(row) for row in results]
    total_pages = (total_rows + request.page_size - 1) // request.page_size if request.page_size else 0

    return CertReportResponse(data=data, total_rows=total_rows, page=request.page, page_size=request.page_size, total_pages=total_pages)

@router.post("/download")
async def download_certificates(
    request: CertReportRequest,
    db: Session = Depends(get_db)
):
    update_statuses_if_needed(db)
    stmt = build_query(request) # No pagination for download
    results = db.execute(stmt).scalars().all()

    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    header = ["Certificate Name", "Expiration Date", "Status", "Responsible Person", "Teams Channel", "Description", "Usage", "Jira Reference", "Affected Persons"]
    writer.writerow(header)

    for row in results:
        writer.writerow([
            row.certificate_name, row.expiration_date.strftime('%Y-%m-%d'), row.status,
            row.responsible_person, row.teams_channel, row.description, row.usage,
            row.jira_reference, row.affected_persons
        ])
    
    output.seek(0)
    filename = f"certificates_report_{date.today().strftime('%Y%m%d')}.csv"
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={filename}"})