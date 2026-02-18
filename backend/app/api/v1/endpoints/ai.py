from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any
from datetime import timedelta, datetime
import os
import random
import json

from app.api import deps
from app.schemas.ai import ScheduleRequest, AIResponse, SuggestedShift
from app.db import models

router = APIRouter()

def generate_mock_schedule(users: Any, request: ScheduleRequest) -> AIResponse:
    """Generate a dummy schedule if AI service is unavailable."""
    shifts = []
    current_date = request.start_date
    delta = timedelta(days=1)
    
    # ensure users is a list
    if not isinstance(users, list):
        users = list(users)

    if not users:
        return AIResponse(shifts=[], explanation="No users available")

    while current_date <= request.end_date:
        # Create shifts for the day: Morning (8-16) and Evening (14-22)
        # Randomly pick employees
        day_staff = random.sample(users, min(len(users), 2))
        
        for i, emp in enumerate(day_staff):
            is_morning = i == 0
            start_hour = 8 if is_morning else 14
            end_hour = 16 if is_morning else 22
            
            # Combine date and time
            s_time = datetime.combine(current_date.date(), datetime.min.time()).replace(hour=start_hour)
            e_time = datetime.combine(current_date.date(), datetime.min.time()).replace(hour=end_hour)
            
            shifts.append(SuggestedShift(
                employee_id=emp.id,
                employee_name=emp.full_name,
                start_time=s_time,
                end_time=e_time,
                role=emp.role if emp.role else "Employee",
                reason="Mock AI: Random assignment based on availability"
            ))
        
        current_date += delta
        
    return AIResponse(
        shifts=shifts,
        explanation="Generated using heuristic fallback (AI Service Unavailable)."
    )

@router.post("/suggest_schedule", response_model=AIResponse)
def suggest_schedule(
    request: ScheduleRequest,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Suggest a schedule based on availability and constraints.
    """
    if current_user.role == "superadmin":
        if not request.company_id:
            raise HTTPException(status_code=400, detail="company_id is required for superadmin requests")
        company_id = request.company_id
    else:
        if not current_user.company_id:
            raise HTTPException(status_code=403, detail="Admin has no company association")
        company_id = current_user.company_id

    # 1. Fetch Candidates
    users = db.query(models.User).filter(
        models.User.is_active == True,
        models.User.company_id == company_id,
        models.User.role == "employee",
    ).all()
    if not users:
        raise HTTPException(status_code=400, detail="No active employees found")

    # 2. Check for OpenAI Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return generate_mock_schedule(users, request)

    try:
        from langchain.chat_models import ChatOpenAI
        from langchain.schema import SystemMessage, HumanMessage
        
        chat = ChatOpenAI(temperature=0, openai_api_key=api_key, model_name="gpt-3.5-turbo")
        
        # Simplify data for prompt
        employee_data = [
            f"ID: {u.id}, Name: {u.full_name}, Role: {u.role}" 
            for u in users
        ]
        
        prompt = f"""
        You are an expert rota scheduler.
        Generate a shift schedule from {request.start_date} to {request.end_date}.
        
        Employees:
        {json.dumps(employee_data)}
        
        Constraints:
        - 2 shifts per day: 08:00-16:00 and 14:00-22:00.
        - Ensure fair distribution.
        
        Return JSON format ONLY:
        {{
            "shifts": [
                {{
                    "employee_id": 1,
                    "employee_name": "John Doe",
                    "start_time": "YYYY-MM-DDTHH:MM:SS",
                    "end_time": "YYYY-MM-DDTHH:MM:SS",
                    "role": "Nurse",
                    "reason": "Expertise match"
                }}
            ],
            "explanation": "Brief summary of strategy"
        }}
        """
        
        messages = [
            SystemMessage(content="You are a helpful scheduling assistant. Output valid JSON."),
            HumanMessage(content=prompt)
        ]
        
        response = chat(messages)
        content = response.content
        
        # Basic parsing
        try:
            data = json.loads(content)
            # Create AIResponse
            # Convert string times back to datetime if needed, Pydantic might handle it
            return AIResponse(**data)
        except Exception as e:
            print(f"LLM Parse Error: {e}")
            return generate_mock_schedule(users, request)
            
    except Exception as e:
        print(f"LangChain Error: {e}")
        return generate_mock_schedule(users, request)
