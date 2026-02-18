from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.db import models
from app.schemas.ai import AIScoringConfigRead, AIScoringConfigUpdate
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
