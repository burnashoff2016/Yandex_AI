import asyncio
import sys
import os
from app.core.database import AsyncSessionLocal
from app.models.models import User, UserRole
from app.services.auth import get_password_hash, get_user_by_email


async def create_admin(email: str, password: str):
    async with AsyncSessionLocal() as db:
        existing = await get_user_by_email(db, email)
        if existing:
            print(f"User {email} already exists!")
            return False
        
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role=UserRole.ADMIN
        )
        db.add(user)
        await db.commit()
        print(f"Admin user {email} created successfully!")
        return True


if __name__ == "__main__":
    if len(sys.argv) > 1:
        email = sys.argv[1]
    else:
        email = input("Email: ")
    
    if len(sys.argv) > 2:
        password = sys.argv[2]
    else:
        password = os.environ.get("ADMIN_PASSWORD")
        if not password:
            from getpass import getpass
            password = getpass("Password: ")
    
    asyncio.run(create_admin(email, password))
