from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.db import models
from app.schemas.automation import AutomationConfig as AutomationConfigSchema, AutomationConfigUpdate
from app.db.models import AutomationConfig

router = APIRouter()

@router.get("/config", response_model=AutomationConfigSchema)
def get_automation_config(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    tenant_id = current_user.company_id if current_user.role != "superadmin" else (current_user.company_id or 1)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
        
    config = db.query(AutomationConfig).filter(AutomationConfig.tenant_id == tenant_id).first()
    if not config:
        config = AutomationConfig(tenant_id=tenant_id)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/config", response_model=AutomationConfigSchema)
def update_automation_config(
    *,
    db: Session = Depends(deps.get_db),
    payload: AutomationConfigUpdate,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    tenant_id = current_user.company_id if current_user.role != "superadmin" else (current_user.company_id or 1)
    config = db.query(AutomationConfig).filter(AutomationConfig.tenant_id == tenant_id).first()
    if not config:
        config = AutomationConfig(tenant_id=tenant_id)
        db.add(config)
        
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
        
    db.commit()
    db.refresh(config)
    return config

@router.post("/trigger", response_model=dict)
def trigger_automation(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    from app.services.automation_service import run_automation_for_tenant
    tenant_id = current_user.company_id if current_user.role != "superadmin" else (current_user.company_id or 1)
    run_automation_for_tenant(db, tenant_id)
    return {"status": "success", "message": "Automation triggered successfully"}
