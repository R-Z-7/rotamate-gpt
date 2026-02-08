import json
from typing import List, Dict, Any
from datetime import datetime, timedelta
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from app.core.config import settings
from app.schemas.shift import ShiftCreate
from app.db.models import User, Availability, TimeOffRequest

class AIService:
    def __init__(self):
        self.llm = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            model_name="gpt-4",
            temperature=0.2
        )

    def generate_rota(
        self, 
        start_date: datetime, 
        end_date: datetime, 
        employees: List[User], 
        availabilities: List[Availability],
        time_off_requests: List[TimeOffRequest]
    ) -> List[Dict[str, Any]]:
        
        # 1. Prepare context for the LLM
        employee_data = [
            f"ID: {e.id}, Name: {e.full_name}, Role: {e.role}" 
            for e in employees
        ]
        
        availability_data = [
            f"Employee {a.employee_id}: {a.day_of_week} ({a.start_time}-{a.end_time})"
            for a in availabilities
        ]
        
        time_off_data = [
            f"Employee {t.employee_id}: {t.start_date} to {t.end_date} ({t.status})"
            for t in time_off_requests
        ]
        
        constraints = """
        - Each day must have at least 1 Manager and 2 Staff (Bar/Waiter).
        - Morning shift: 09:00 - 17:00
        - Afternoon shift: 12:00 - 20:00
        - Night shift: 17:00 - 01:00
        - Employees cannot work if they have approved Time Off.
        - Respect availability preferences where possible.
        - No double shifts on the same day.
        """
        
        prompt = f"""
        Generate a weekly rota for the week starting {start_date.date()} to {end_date.date()}.
        
        Employees:
        {json.dumps(employee_data, indent=2)}
        
        Availabilities:
        {json.dumps(availability_data, indent=2)}
        
        Time Off:
        {json.dumps(time_off_data, indent=2)}
        
        Constraints:
        {constraints}
        
        Output Format:
        Return ONLY a JSON array of shift objects. Each object must have:
        - employee_id: int
        - start_time: ISO 8601 datetime string
        - end_time: ISO 8601 datetime string
        - role_type: string (Manager, Bar, Waiter)
        
        Do not include any explanation or markdown formatting outside the JSON array.
        """
        
        # 2. Call LLM
        messages = [
            SystemMessage(content="You are an expert Rota Manager AI. Generate valid JSON schedules only."),
            HumanMessage(content=prompt)
        ]
        
        try:
            response = self.llm.predict_messages(messages)
            content = response.content.strip()
            
            # Attempt to clean up markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
                
            shifts_data = json.loads(content)
            return shifts_data
            
        except Exception as e:
            print(f"Error generating rota: {e}")
            return []

ai_service = AIService()
