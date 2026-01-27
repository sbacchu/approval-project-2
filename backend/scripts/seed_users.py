import sys
import os

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import User, UserRole

def seed_users():
    with Session(engine) as session:
        # Define users
        users_to_add = [
            {"username": "alice", "role": UserRole.UPLOADER},
            {"username": "bob", "role": UserRole.APPROVER},
            {"username": "admin", "role": UserRole.ADMIN},
        ]
        
        for u_data in users_to_add:
            user = session.exec(select(User).where(User.username == u_data["username"])).first()
            if not user:
                print(f"Creating user {u_data['username']}...")
                user = User(username=u_data["username"], role=u_data["role"])
                session.add(user)
            else:
                print(f"User {u_data['username']} already exists.")
        
        session.commit()
    print("Seed complete.")

if __name__ == "__main__":
    seed_users()
