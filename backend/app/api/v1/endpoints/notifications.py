from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models import Notification, User
from app.schemas.notification import Notification as NotificationSchema, NotificationCreate, NotificationUpdate

router = APIRouter()

@router.get("", response_model=List[NotificationSchema])
@router.get("/", response_model=List[NotificationSchema], include_in_schema=False)
def read_notifications(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve notifications for current user.
    """
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@router.put("/{id}/read", response_model=NotificationSchema)
def mark_read(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark notification as read.
    """
    notification = db.query(Notification).filter(
        Notification.id == id,
        Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

@router.put("/read-all", response_model=List[NotificationSchema])
def mark_all_read(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark all notifications as read.
    """
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).all()
    
    for n in notifications:
        n.is_read = True
        db.add(n)
        
    db.commit()
    return notifications
