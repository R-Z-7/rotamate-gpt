from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.api import deps
from app.db.models import User, Company, Shift
# from app.schemas.company import Company as CompanySchema # Assuming schemas exist, if not I'll return dicts or create schemas. 
# For now, returning dicts/custom schemas to avoid complex schema creation if not needed.

router = APIRouter()

@router.get("/stats")
def get_superadmin_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Get platform-wide statistics for superadmin.
    """
    total_companies = db.query(Company).count()
    total_users = db.query(User).count()
    
    # Mocking active subscriptions for now as we don't have a Subscription model yet
    active_subscriptions = 12 
    trial_accounts = 3
    revenue_formatted = "$4,320" # Mock revenue

    return {
        "companies": total_companies,
        "totalUsers": total_users,
        "activeSubscriptions": active_subscriptions,
        "revenue": revenue_formatted,
        "trialAccounts": trial_accounts
    }

@router.get("/companies")
def get_all_companies(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Get list of all companies.
    """
    companies = db.query(Company).all()
    
    result = []
    for comp in companies:
        user_count = db.query(User).filter(User.company_id == comp.id).count()
        result.append({
            "id": comp.id,
            "name": comp.name,
            "users": user_count,
            "plan": "Premium", # Mock
            "status": comp.status,
            "joined": comp.created_at.strftime("%Y-%m-%d") if comp.created_at else "2024-01-01"
        })
    return result

@router.get("/revenue")
def get_revenue_data(
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Get revenue chart data (Dummy data for now as we lack a Billing model).
    """
    # In a real app, this would query a Payments/Invoices table.
    return [
        { "name": 'Jan', "revenue": 2400 },
        { "name": 'Feb', "revenue": 1398 },
        { "name": 'Mar', "revenue": 9800 },
        { "name": 'Apr', "revenue": 3908 },
        { "name": 'May', "revenue": 4800 },
        { "name": 'Jun', "revenue": 3800 },
        { "name": 'Jul', "revenue": 4300 },
    ]

@router.get("/billing")
def get_billing_data(
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Get recent invoices (Dummy data).
    """
    return [
        { "id": "INV-001", "company": "Acme Healthcare", "amount": "$299.00", "status": "Paid", "date": "2024-02-01", "method": "Credit Card" },
        { "id": "INV-002", "company": "City Hospital", "amount": "$899.00", "status": "Paid", "date": "2024-02-01", "method": "Bank Transfer" },
        { "id": "INV-003", "company": "Westside Care", "amount": "$299.00", "status": "Pending", "date": "2024-02-05", "method": "Credit Card" },
        { "id": "INV-004", "company": "Dental Partners", "amount": "$99.00", "status": "Overdue", "date": "2024-01-01", "method": "PayPal" },
    ]
