from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.trade import Trade
from app.schemas.trade import TradeCreate, TradeOut, TradeUpdate

router = APIRouter()


@router.get("/", response_model=list[TradeOut])
def list_trades(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(Trade)
    if active_only:
        query = query.filter(Trade.is_active.is_(True))
    return query.order_by(Trade.id.desc()).all()


@router.get("/{trade_id}", response_model=TradeOut)
def get_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade


@router.post("/", response_model=TradeOut, dependencies=[Depends(get_current_user)])
def create_trade(payload: TradeCreate, db: Session = Depends(get_db)):
    existing = db.query(Trade).filter(Trade.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Trade already exists")
    trade = Trade(**payload.dict())
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return trade


@router.put("/{trade_id}", response_model=TradeOut, dependencies=[Depends(get_current_user)])
def update_trade(trade_id: int, payload: TradeUpdate, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(trade, key, value)

    db.commit()
    db.refresh(trade)
    return trade


@router.delete("/{trade_id}", dependencies=[Depends(get_current_user)])
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    db.delete(trade)
    db.commit()
    return {"status": "deleted"}
