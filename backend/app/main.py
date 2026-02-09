from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import logging
from app.core.config import settings
from app.api.v1.api import api_router

from app.db import base
from app.db.session import engine

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

# Create tables on startup
try:
    logger.info("Creating database tables...")
    base.Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

# Set CORS enabled origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://rotamate-lilac.vercel.app",
    "https://rotamate-lilac-git-main-rameesk.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production debugging, let's use * then tighten it
    allow_credentials=False, # Credentials can't be * with allow_origins=*
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to RotaMate API"}

@app.get("/healthz")
@app.get("/health")
def health_check():
    return {"status": "ok"}
