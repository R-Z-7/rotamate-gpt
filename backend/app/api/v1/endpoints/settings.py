from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.db import models
from app.models.ai_scoring import ContractRule, EmployeePreference
from app.schemas.ai import AIScoringConfigRead, AIScoringConfigUpdate
from app.schemas.settings import ContractRuleInDB, ContractRuleUpdate, EmployeePreferenceInDB, EmployeePreferenceUpdate
from app.services.ai_scoring_service import get_or_default_scoring_config, update_scoring_config

router = APIRouter()


def _resolve_tenant_id(
    current_user: models.User,
    explicit_tenant_id: Optional[int] = None,
) -> int:
    if current_user.role == "superadmin":
        if explicit_tenant_id is not None:
            return explicit_tenant_id
        if current_user.company_id is not None:
            return current_user.company_id
        raise HTTPException(
            status_code=400,
            detail="tenant_id is required for superadmin requests",
        )

    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="Admin has no company association")
    return current_user.company_id


def _serialize_scoring_config(config: Any) -> AIScoringConfigRead:
    return AIScoringConfigRead(
        id=config.id,
        tenant_id=config.tenant_id,
        availability_weight=float(config.availability_weight),
        skill_match_weight=float(config.skill_match_weight),
        hours_balance_weight=float(config.hours_balance_weight),
        rest_margin_weight=float(config.rest_margin_weight),
        weekend_balance_weight=float(config.weekend_balance_weight),
        night_balance_weight=float(config.night_balance_weight),
        preference_weight=float(config.preference_weight),
        min_score_threshold=(
            float(config.min_score_threshold)
            if config.min_score_threshold is not None
            else None
        ),
        created_at=config.created_at,
        updated_at=config.updated_at,
    )


@router.get("/ai-scoring", response_model=AIScoringConfigRead)
def get_ai_scoring_config(
    *,
    tenant_id: Optional[int] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    scoped_tenant_id = _resolve_tenant_id(current_user, explicit_tenant_id=tenant_id)
    config = get_or_default_scoring_config(db, scoped_tenant_id, create_if_missing=True)
    return _serialize_scoring_config(config)


@router.put("/ai-scoring", response_model=AIScoringConfigRead)
def put_ai_scoring_config(
    *,
    payload: AIScoringConfigUpdate,
    tenant_id: Optional[int] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    requested_tenant_id = payload.tenant_id if payload.tenant_id is not None else tenant_id
    scoped_tenant_id = _resolve_tenant_id(current_user, explicit_tenant_id=requested_tenant_id)

    update_data: Dict[str, Any]
    if hasattr(payload, "model_dump"):
        update_data = payload.model_dump(exclude_unset=True)
    else:
        update_data = payload.dict(exclude_unset=True)

    update_data.pop("tenant_id", None)
    clear_threshold = bool(update_data.pop("clear_min_score_threshold", False))
    if clear_threshold:
        update_data["min_score_threshold"] = None

    if not update_data:
        config = get_or_default_scoring_config(db, scoped_tenant_id, create_if_missing=True)
        return _serialize_scoring_config(config)

    config = update_scoring_config(db, scoped_tenant_id, update_data)
    return _serialize_scoring_config(config)

@router.get("/contract-rules", response_model=ContractRuleInDB)
def get_contract_rules(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    tenant_id = _resolve_tenant_id(current_user)
    rule = db.query(ContractRule).filter(ContractRule.tenant_id == tenant_id).first()
    if not rule:
        rule = ContractRule(tenant_id=tenant_id)
        db.add(rule)
        db.commit()
        db.refresh(rule)
    return rule

@router.put("/contract-rules", response_model=ContractRuleInDB)
def update_contract_rules(
    *,
    db: Session = Depends(deps.get_db),
    payload: ContractRuleUpdate,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    tenant_id = _resolve_tenant_id(current_user)
    rule = db.query(ContractRule).filter(ContractRule.tenant_id == tenant_id).first()
    if not rule:
        rule = ContractRule(tenant_id=tenant_id)
        db.add(rule)
        
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
        
    db.commit()
    db.refresh(rule)
    return rule

@router.get("/employee-preferences/{employee_id}", response_model=EmployeePreferenceInDB)
def get_employee_preferences(
    employee_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    # Admin can view any in their company, employee can view their own
    if current_user.role == "employee" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    employee = db.query(models.User).filter(models.User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if current_user.role != "superadmin" and current_user.company_id != employee.company_id:
        raise HTTPException(status_code=404, detail="Employee not found")

    tenant_id = employee.company_id
    pref = db.query(EmployeePreference).filter(EmployeePreference.employee_id == employee_id).first()
    if not pref:
        pref = EmployeePreference(tenant_id=tenant_id, employee_id=employee_id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref

@router.put("/employee-preferences/{employee_id}", response_model=EmployeePreferenceInDB)
def update_employee_preferences(
    *,
    employee_id: int,
    payload: EmployeePreferenceUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role == "employee" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    employee = db.query(models.User).filter(models.User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if current_user.role != "superadmin" and current_user.company_id != employee.company_id:
        raise HTTPException(status_code=404, detail="Employee not found")

    pref = db.query(EmployeePreference).filter(EmployeePreference.employee_id == employee_id).first()
    if not pref:
        pref = EmployeePreference(tenant_id=employee.company_id, employee_id=employee_id)
        db.add(pref)
        
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pref, field, value)
        
    db.commit()
    db.refresh(pref)
    return pref
