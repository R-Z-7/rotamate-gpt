import sys
import os
sys.path.append(os.getcwd())

try:
    from app.main import app
    print("Backend import successful")
except Exception as e:
    print(f"Backend import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
