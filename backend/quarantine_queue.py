"""
QUARANTINED QUEUE IMPLEMENTATION (FastAPI)
Quarantined per Phase 0 ADR 0001.

All queue management, token sequencing, RBAC authentication, and live synchronization
are authoritatively handled by the primary Express API (server.mjs / server/routes/queue.mjs).
These endpoints are archived here for historical reference only and are not mounted.
"""

import os
import sqlite3
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "clinicops.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class QueueStatusRequest(BaseModel):
    status: str
    notes: Optional[str] = None

class QueueRequeueRequest(BaseModel):
    note: Optional[str] = "Requeued to active waiting queue"
