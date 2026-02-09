from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, shifts, availability, time_off, ai

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(shifts.router, prefix="/shifts", tags=["shifts"])
api_router.include_router(availability.router, prefix="/availability", tags=["availability"])
api_router.include_router(time_off.router, prefix="/time-off", tags=["time-off"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
from app.api.v1.endpoints import analytics, notifications
api_router.include_router(analytics.router, prefix="/dashboard-metrics", tags=["analytics"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

from app.api.v1.endpoints import superadmin
api_router.include_router(superadmin.router, prefix="/superadmin", tags=["superadmin"])
