from datetime import datetime, timedelta, timezone

from typing import Optional, Dict, Any

def utcnow() -> datetime:
    """
    Get the current UTC time.
    """
    return datetime.now(timezone.utc)