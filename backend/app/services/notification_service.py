from sqlalchemy.orm import Session
from app.db.models import Notification

def create_notification(db: Session, user_id: int, company_id: int, title: str, description: str, notif_type: str = "info"):
    notification = Notification(
        user_id=user_id,
        company_id=company_id,
        title=title,
        description=description,
        type=notif_type
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
