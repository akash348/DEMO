from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.fee import Fee
from app.schemas.fee import FeeCreate, FeeOut, FeeUpdate

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/", response_model=list[FeeOut])
def list_fees(db: Session = Depends(get_db)):
    return db.query(Fee).order_by(Fee.id.desc()).all()


@router.post("/", response_model=FeeOut)
def create_fee(payload: FeeCreate, db: Session = Depends(get_db)):
    fee = Fee(**payload.dict())
    db.add(fee)
    db.commit()
    db.refresh(fee)
    return fee


@router.put("/{fee_id}", response_model=FeeOut)
def update_fee(fee_id: int, payload: FeeUpdate, db: Session = Depends(get_db)):
    fee = db.query(Fee).filter(Fee.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(fee, key, value)

    db.commit()
    db.refresh(fee)
    return fee


@router.delete("/{fee_id}")
def delete_fee(fee_id: int, db: Session = Depends(get_db)):
    fee = db.query(Fee).filter(Fee.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")

    db.delete(fee)
    db.commit()
    return {"status": "deleted"}
