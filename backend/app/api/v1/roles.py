from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...schemas.role import Role, RoleCreate, RoleUpdate
from ...models.role import Role as RoleModel

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=List[Role])
def get_roles(db: Session = Depends(get_db)):
    return db.query(RoleModel).all()


@router.get("/{role_id}", response_model=Role)
def get_role(role_id: int, db: Session = Depends(get_db)):
    role = db.query(RoleModel).filter(RoleModel.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role
