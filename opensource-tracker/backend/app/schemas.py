from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    monthly_pr_target: int = Field(ge=1)
    current_progress: int = Field(default=0, ge=0)


class GoalUpdate(BaseModel):
    monthly_pr_target: Optional[int] = Field(default=None, ge=1)
    current_progress: Optional[int] = Field(default=None, ge=0)


class GoalResponse(GoalCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BadgeResponse(BaseModel):
    id: int
    user_id: int
    badge_name: str
    description: str
    awarded_at: datetime

    class Config:
        from_attributes = True
