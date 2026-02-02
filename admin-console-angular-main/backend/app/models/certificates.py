from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db import Base

class Certificates(Base):
    __tablename__ = 'certificates'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    certificate_name = Column(String, unique=True, nullable=False)
    description = Column(String, unique=False, nullable=True)
    usage = Column(String, unique=False, nullable=True)
    expiration_date = Column(DateTime, nullable=False) 
    created_at = Column(DateTime(timezone=False), default=lambda: datetime.strptime(datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[0:23], '%Y-%m-%d %H:%M:%S.%f'), nullable=False)
    updated_at = Column(DateTime(timezone=False), default=lambda: datetime.strptime(datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[0:23], '%Y-%m-%d %H:%M:%S.%f'), nullable=False)
    effected_users = Column(String, unique=False, nullable=True)
    responsible_group = Column(String, nullable=False)
    teams_channel = Column(String, nullable=False)
    calculated_status = Column(String)  # 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'


class JiraState(Base):
    __tablename__ = 'jira_state'
    
    jira_ticket_id = Column(String, primary_key=True)
    certificate_name = Column(String, nullable=False)
    expiration_date = Column(DateTime, nullable=False)
    ticket_created_on = Column(DateTime, default=datetime.utcnow)