from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Check if sqlite, use specific args
connect_args = {}
if "sqlite" in settings.SQLALCHEMY_DATABASE_URI:
    connect_args["check_same_thread"] = False
elif "postgresql" in settings.SQLALCHEMY_DATABASE_URI:
    # Managed databases like Render/Heroku often require SSL
    connect_args["sslmode"] = "require"

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
