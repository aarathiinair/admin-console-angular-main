from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import List, Optional

class CertificateBase(BaseModel):
    certificate_name: str
    expiration_date: datetime
    description: Optional[str] = None
    usage: Optional[str] = None
    responsible_group: str
    teams_channel: str
    effected_users: Optional[str] = None

    @field_validator('expiration_date', mode='before')
    @classmethod
    def to_local_naive(cls, value):
        if isinstance(value, str):
            try:
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                dt = datetime.now() 
        else:
            dt = value
        
        if dt.tzinfo is not None:
            dt = dt.astimezone().replace(tzinfo=None, microsecond=0)
        return dt

class CertificateCreate(CertificateBase):
    pass

class CertificateUpdate(BaseModel):
    certificate_name: Optional[str] = None
    expiration_date: Optional[datetime] = None
    description: Optional[str] = None
    usage: Optional[str] = None
    responsible_group: Optional[str] = None
    teams_channel: Optional[str] = None
    effected_users: Optional[str] = None

class CertificateResponse(CertificateBase):
    id: int
    calculated_status: str
    created_at: datetime
    updated_at: datetime
    jira_ticket_id: Optional[str] = None  # From JOIN

    class Config:
        from_attributes = True

class CertificateListResponse(BaseModel):
    items: List[CertificateResponse]
    total_rows: int
    page: int
    page_size: int