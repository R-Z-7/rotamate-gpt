from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import logging
from app.core.config import settings
from app.api.v1.api import api_router

from app.db import base
from app.db.session import engine, SessionLocal
from app.db.init_db import init_db

from contextlib import asynccontextmanager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import asyncio
import anyio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed data in background to avoid blocking startup
    async def init_db_task():
        try:
            logger.info("Initializing database in background...")
            # Run sync DB operations in a thread pool
            await anyio.to_thread.run_sync(lambda: base.Base.metadata.create_all(bind=engine))
            
            def seed():
                db = SessionLocal()
                try:
                    init_db(db)
                finally:
                    db.close()
            
            await anyio.to_thread.run_sync(seed)
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing database: {e}")

    # Use a background task so we can yield (and start serving requests) fast
    # but the init will still run
    asyncio.create_task(init_db_task())
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Set CORS enabled origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "https://rotamate-lilac.vercel.app",
    "https://rotamate-lilac-git-main-rameesk.vercel.app",
    "https://rotamate.onrender.com",
    "https://rotamate-backend.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
