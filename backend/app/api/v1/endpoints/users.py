from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models import User
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate
from app.crud import create_user, get_user_by_email, get_user, update_user, delete_user

router = APIRouter()

@router.get("", response_model=List[UserSchema])
@router.get("/", response_model=List[UserSchema], include_in_schema=False)
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    role: str = None,
    company_id: int = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    query = db.query(User)
    
    # Tenant Isolation
    if current_user.role != "superadmin":
        if not current_user.company_id:
            raise HTTPException(status_code=403, detail="User is not assigned to a company")
        query = query.filter(User.company_id == current_user.company_id)
    else:
        if company_id:
            query = query.filter(User.company_id == company_id)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_filter)) | (User.email.ilike(search_filter))
        )
    if role and role != "all":
        query = query.filter(User.role == role)
        
    users = query.offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=UserSchema)
def create_user_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    # Determine company context
    company_id = current_user.company_id
    
    if current_user.role != "superadmin" and user_in.role != "employee":
        raise HTTPException(status_code=403, detail="Admins can only create employee users")

    if current_user.role == "superadmin":
        if user_in.company_id:
            company_id = user_in.company_id
    elif not company_id:
        raise HTTPException(
            status_code=400,
            detail="Admin has no company association. Cannot create users.",
        )

    # Only admins can create other users via this endpoint
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = create_user(db, user=user_in, company_id=company_id)
    return user

@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return current_user

@router.put("/{user_id}", response_model=UserSchema)
def update_user_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )

    if current_user.role != "superadmin":
        if not current_user.company_id or user.company_id != current_user.company_id:
            raise HTTPException(status_code=404, detail="The user with this id does not exist in the system")
        if user_in.role and user_in.role != "employee":
            raise HTTPException(status_code=403, detail="Admins can only assign employee role")

    user = update_user(db, db_user=user, user_in=user_in)
    return user

@router.delete("/{user_id}", response_model=UserSchema)
def delete_user_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )

    if current_user.role != "superadmin":
        if not current_user.company_id or user.company_id != current_user.company_id:
            raise HTTPException(status_code=404, detail="The user with this id does not exist in the system")

    try:
        user = delete_user(db, user_id=user_id)
        return user
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
