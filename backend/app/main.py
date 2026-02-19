from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

import logging
import anyio
from app.core.config import settings
from app.api.v1.api import api_router

from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.api import deps

from contextlib import asynccontextmanager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        logger.info("Initializing database...")

        def init() -> None:
            db = SessionLocal()
            try:
                init_db(db, seed_demo=settings.ENABLE_DEMO_SEED)
            finally:
                db.close()

        await anyio.to_thread.run_sync(init)
        logger.info("Database initialized successfully")
    except Exception:
        logger.exception("Error initializing database")
        raise
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Set CORS enabled origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "https://rotamate-lilac.vercel.app",
    "https://rotamate-lilac-git-main-rameesk.vercel.app",
    "https://rotamate-gpt.vercel.app",
    "https://rotamate.onrender.com",
    "https://rotamate-backend.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https://rotamate.*\.vercel\.app",
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to RotaMate API - v23-Final-Production-Stable"}

@app.get("/healthz")
@app.get("/health")
def health_check(db: Session = Depends(deps.get_db)):
    try:
        # Try to execute a simple query to verify DB connection
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "error", "database": str(e)}
        )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    import logging
    err_logger = logging.getLogger("uvicorn.error")
    stack_trace = traceback.format_exc()
    err_logger.error(f"Global error caught: {exc}\n{stack_trace}")
    
    # We manually add CORS headers to the error response
    response = JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error"
        },
    )
    # Origin from request headers
    origin = request.headers.get("origin")
    if origin in origins or "*" in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response
