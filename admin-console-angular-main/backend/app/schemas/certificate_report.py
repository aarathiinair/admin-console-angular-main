from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from typing import List, Optional
import uuid

# --- The Request (Filters) ---
class CertReportRequest(BaseModel):
    # 1. Date Range (Mandatory Pairs)
    search_date_start: Optional[datetime] = Field(None, description="Filter: Expires after this date")
    search_date_end: Optional[datetime] = Field(None, description="Filter: Expires before this date")
    
    # 2. Responsible Person
    search_person: Optional[str] = Field(None, description="Search by Responsible Person")

    # 3. Teams Channel
    search_teams: Optional[str] = Field(None, description="Search by Teams Channel Name")
    
    # 4. Status
    filter_status: Optional[str] = Field(None, description="Valid or Expired")
    
    # 5. Generic Name Search
    search_name: Optional[str] = Field(None, description="Search by Certificate Name")

    # Pagination & Sorting
    page: int = Field(1, ge=1)
    page_size: int = Field(10, ge=1, le=100000)
    sort_by: Optional[str] = Field("expiration_date", description="Sort by field")
    sort_order: Optional[str] = Field("asc", description="asc or desc")

    # --- VALIDATION LOGIC ---
    @model_validator(mode='after')
    def check_date_range(self):
        start = self.search_date_start
        end = self.search_date_end

        if (start and not end) or (end and not start):
            raise ValueError("Both Start Date and End Date must be provided together for a date range search.")
        
        if start and end and start > end:
            raise ValueError("Start Date cannot be after End Date.")
            
        return self

# --- The Response (Table Data) ---
class CertDataRow(BaseModel):
    cert_id: uuid.UUID
    certificate_name: str
    expiration_date: datetime
    status: str
    responsible_person: Optional[str]
    teams_channel: Optional[str]
    description: Optional[str]
    usage: Optional[str]
    jira_reference: Optional[str]
    affected_persons: Optional[str]

    class Config:
        from_attributes = True

class CertReportResponse(BaseModel):
    data: List[CertDataRow]
    total_rows: int
    page: int
    page_size: int
    total_pages: int