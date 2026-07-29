from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    pass


class RoleUpdate(RoleBase):
    pass


class Role(RoleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

