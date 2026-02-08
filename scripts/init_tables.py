
import sys
import os

# Add backend directory to path so we can import app modules
# Script is in rotamate/scripts/init_tables.py
# Backend is in rotamate/backend/
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
sys.path.append(backend_path)

from app.db.base import Base
from app.db.session import engine
# Import ALL models so Base knows about them
from app.db import models

if __name__ == "__main__":
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")
