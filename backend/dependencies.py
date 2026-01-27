from fastapi import Header, HTTPException, Depends
from sqlmodel import Session, select
from .database import get_session
from .models import User

async def get_current_user(
    x_dev_user: str = Header(..., alias="X-Dev-User"),
    session: Session = Depends(get_session)
) -> User:
    if not x_dev_user:
         raise HTTPException(status_code=400, detail="X-Dev-User header missing")
    
    # Normalize
    username = x_dev_user.lower()
    
    user = session.exec(select(User).where(User.username == username)).first()
    
    if not user:
        raise HTTPException(status_code=403, detail="Invalid user or user not found in database")
    
    return user
