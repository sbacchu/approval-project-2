import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional, Any
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column
from sqlalchemy.types import JSON as SA_JSON

class ImportStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Import(SQLModel, table=True):
    __tablename__ = "imports"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    original_filename: str
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    status: ImportStatus = Field(default=ImportStatus.PENDING)
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    row_count: int = 0
    columns: List[str] = Field(default_factory=list, sa_column=Column(SA_JSON))
    parse_warnings: Optional[List[dict]] = Field(default=None, sa_column=Column(SA_JSON))
    
    observations: List["EconObservation"] = Relationship(back_populates="import_file", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class EconObservation(SQLModel, table=True):
    __tablename__ = "econ_observations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    import_id: uuid.UUID = Field(foreign_key="imports.id", index=True)
    row_index: int
    date: str
    series: str
    value_num: Optional[float] = None
    value_text: Optional[str] = None
    frequency: Optional[str] = None
    units: Optional[str] = None
    country: Optional[str] = None
    source: Optional[str] = None
    vintage_date: Optional[str] = None
    notes: Optional[str] = None
    raw: Optional[dict] = Field(default=None, sa_column=Column(SA_JSON))

    import_file: Import = Relationship(back_populates="observations")
