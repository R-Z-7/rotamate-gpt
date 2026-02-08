from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class NotificationBase(BaseModel):
    title: str
    description: str
    type: str = "info"

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationUpdate(BaseModel):
    is_read: bool

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
