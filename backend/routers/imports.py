from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime
import io
import csv
import uuid

from ..database import get_session
from ..models import Import, EconObservation, ImportStatus, User, UserRole
from ..dependencies import get_current_user
from ..services.parser import parse_excel

router = APIRouter(prefix="/imports", tags=["imports"])

@router.post("/", response_model=Import)
async def upload_import(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role not in [UserRole.UPLOADER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to upload")
    
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Invalid file format. Must be .xlsx or .xls")

    contents = await file.read()
    
    try:
        observations_data, columns, warnings, row_count = parse_excel(contents, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Create Import
    import_obj = Import(
        original_filename=file.filename,
        uploaded_by=current_user.username,
        row_count=row_count,
        columns=columns,
        parse_warnings=warnings,
        status=ImportStatus.PENDING
    )
    session.add(import_obj)
    session.commit()
    session.refresh(import_obj)
    
    # Create Observations
    obs_objects = [
        EconObservation(**obs, import_id=import_obj.id) for obs in observations_data
    ]
    session.add_all(obs_objects)
    session.commit()
    
    return import_obj

@router.get("/", response_model=List[Import])
async def list_imports(
    status: Optional[ImportStatus] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(Import)
    
    if current_user.role == UserRole.UPLOADER:
        # Uploaders only see their uploads
        query = query.where(Import.uploaded_by == current_user.username)
    
    if status:
        query = query.where(Import.status == status)
        
    query = query.order_by(Import.uploaded_at.desc())
        
    return session.exec(query).all()

@router.get("/{import_id}", response_model=Import)
async def get_import(
    import_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    imp = session.get(Import, import_id)
    if not imp:
        raise HTTPException(status_code=404, detail="Import not found")
        
    if current_user.role == UserRole.UPLOADER and imp.uploaded_by != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return imp

@router.get("/{import_id}/rows")
async def get_import_rows(
    import_id: uuid.UUID,
    page: int = 1,
    page_size: int = 50,
    series: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Check permissions
    imp = session.get(Import, import_id)
    if not imp:
        raise HTTPException(status_code=404, detail="Import not found")
    if current_user.role == UserRole.UPLOADER and imp.uploaded_by != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = select(EconObservation).where(EconObservation.import_id == import_id)
    if series:
        query = query.where(EconObservation.series.contains(series))
    if date_from:
         query = query.where(EconObservation.date >= date_from)
    if date_to:
         query = query.where(EconObservation.date <= date_to)

    # Count
    count_query = select(func.count()).where(EconObservation.import_id == import_id)
    if series:
        count_query = count_query.where(EconObservation.series.contains(series))
    if date_from:
         count_query = count_query.where(EconObservation.date >= date_from)
    if date_to:
         count_query = count_query.where(EconObservation.date <= date_to)
    
    total = session.exec(count_query).one()

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    rows = session.exec(query).all()
    
    return {"data": rows, "total": total, "page": page, "page_size": page_size}

@router.post("/{import_id}/approve", response_model=Import)
async def approve_import(
    import_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role not in [UserRole.APPROVER, UserRole.ADMIN]:
         raise HTTPException(status_code=403, detail="Not authorized to approve")
         
    imp = session.get(Import, import_id)
    if not imp:
        raise HTTPException(status_code=404, detail="Import not found")
        
    imp.status = ImportStatus.APPROVED
    imp.approved_by = current_user.username
    imp.approved_at = datetime.utcnow()
    
    session.add(imp)
    session.commit()
    session.refresh(imp)
    return imp

@router.get("/{import_id}/download/csv")
async def download_csv(
    import_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    imp = session.get(Import, import_id)
    if not imp:
        raise HTTPException(status_code=404, detail="Import not found")

    if current_user.role == UserRole.UPLOADER and imp.uploaded_by != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Generator for CSV
    def iter_csv():
        # Header
        header = ["date", "series", "value_num", "value_text", "frequency", "units", "country", "source", "vintage_date", "notes"]
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(header)
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        # Rows
        query = select(EconObservation).where(EconObservation.import_id == import_id)
        # Iterate over results
        for row in session.exec(query):
            writer.writerow([
                row.date,
                row.series,
                row.value_num,
                row.value_text,
                row.frequency,
                row.units,
                row.country,
                row.source,
                row.vintage_date,
                row.notes
            ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    filename = f"{imp.original_filename.rsplit('.', 1)[0]}_{imp.id}.csv"
    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/stats/summary")
async def get_stats(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Total Imports
    total_imports = session.exec(select(func.count()).select_from(Import)).one()
    
    # Imports by status
    pending_imports = session.exec(select(func.count()).where(Import.status == ImportStatus.PENDING)).one()
    approved_imports = session.exec(select(func.count()).where(Import.status == ImportStatus.APPROVED)).one()
    rejected_imports = session.exec(select(func.count()).where(Import.status == ImportStatus.REJECTED)).one()
    
    # Total Data Points
    total_observations = session.exec(select(func.count()).select_from(EconObservation)).one()
    
    return {
        "imports": {
            "total": total_imports,
            "pending": pending_imports,
            "approved": approved_imports,
            "rejected": rejected_imports
        },
        "observations": {
            "total": total_observations
        }
    }
