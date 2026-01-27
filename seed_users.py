from sqlmodel import Session, select
from backend.database import engine, create_db_and_tables
from backend.models import User, UserRole

def seed_users():
    with Session(engine) as session:
        # Alice
        if not session.exec(select(User).where(User.username == "alice")).first():
            session.add(User(username="alice", role=UserRole.UPLOADER))
            print("Added alice")
            
        # Bob
        if not session.exec(select(User).where(User.username == "bob")).first():
            session.add(User(username="bob", role=UserRole.APPROVER))
            print("Added bob")

        # Admin
        if not session.exec(select(User).where(User.username == "admin")).first():
            session.add(User(username="admin", role=UserRole.ADMIN))
            print("Added admin")
            
        session.commit()

if __name__ == "__main__":
    create_db_and_tables()
    seed_users()
