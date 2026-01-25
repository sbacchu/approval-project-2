from fastapi import Header, HTTPException

async def get_current_user(x_dev_user: str = Header(..., alias="X-Dev-User")):
    if not x_dev_user:
         raise HTTPException(status_code=400, detail="X-Dev-User header missing")
    
    # Normalize
    user = x_dev_user.lower()
    valid_users = ["alice", "bob", "admin"]
    
    if user not in valid_users:
        raise HTTPException(status_code=403, detail="Invalid user")
    
    return user
