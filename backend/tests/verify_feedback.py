import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.ai_scoring import AIFeedbackLoop, AIScoringConfig
from app.services.ai_scoring_service import analyze_feedback, capture_feedback

def test_feedback_analysis():
    db = SessionLocal()
    try:
        # 1. Setup Data
        tenant_id = 1 # Assuming seeded company
        
        # Ensure scoring config exists
        config = db.query(AIScoringConfig).filter_by(tenant_id=tenant_id).first()
        if not config:
            config = AIScoringConfig(tenant_id=tenant_id)
            db.add(config)
            db.commit()
            
        print(f"Current Config: Skill={config.skill_match_weight}, Pref={config.preference_weight}")

        # 2. Insert Mock Feedback (6 overrides to trigger threshold > 5)
        # We need valid shift/user IDs ideally, but the analysis only checks counts for MVP.
        # So we can fake the IDs if constraints aren't enforced strictly at DB level for existence 
        # (SQLite might be lax, but PG isn't). 
        # Let's try to get real IDs or just insert raw objects if we can.
        
        # For safety/speed, let's just use dummy IDs. If FK fails, we might need to look them up.
        # Assuming seed data exists from init_db.
        
        print("Inserting 6 mock feedback entries...")
        for i in range(6):
            # We use capture_feedback or direct insert
            # capture_feedback checks original != final
            fb = AIFeedbackLoop(
                tenant_id=tenant_id,
                shift_id=1, # Dummy
                original_employee_id=2, # Dummy
                final_employee_id=3, # Dummy
                change_reason="MANUAL_OVERRIDE",
                created_at=datetime.utcnow()
            )
            db.add(fb)
        db.commit()

        # 3. Run Analysis
        result = analyze_feedback(db, tenant_id)
        
        print("\nAnalysis Result:")
        print(result)

        # 4. Verify
        if result['total_overrides'] >= 6:
            print("SUCCESS: Overrides detected.")
            if result['suggested_weight_changes']:
                print("SUCCESS: Weight changes suggested.")
                print(result['suggested_weight_changes'])
            else:
                print("FAILURE: No suggestions despite overrides.")
        else:
            print("FAILURE: Overrides not counted.")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_feedback_analysis()
