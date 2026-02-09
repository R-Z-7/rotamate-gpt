from datetime import datetime, timedelta
from typing import Optional, Any, Union
from jose import jwt
import bcrypt
import hashlib
from app.core.config import settings

ALGORITHM = "HS256"

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if not hashed_password:
            return False
        # Pre-hash with sha256 to ensure length < 72
        pwd_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
        return bcrypt.checkpw(pwd_hash.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    # Pre-hash with sha256 to ensure length < 72
    pwd_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return bcrypt.hashpw(pwd_hash.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
