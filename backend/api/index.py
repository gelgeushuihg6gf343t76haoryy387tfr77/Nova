import sys
from pathlib import Path

# Ensure the backend root is on sys.path so Vercel can find `app`
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.main import app  # noqa: E402
