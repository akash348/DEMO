from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.enquiry import Enquiry
from app.schemas.enquiry import EnquiryCreate, EnquiryOut

router = APIRouter()


@router.post("/", response_model=EnquiryOut)
def create_enquiry(payload: EnquiryCreate, db: Session = Depends(get_db)):
    enquiry = Enquiry(**payload.dict())
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return enquiry


@router.get("/", response_model=list[EnquiryOut], dependencies=[Depends(get_current_user)])
def list_enquiries(db: Session = Depends(get_db)):
    return db.query(Enquiry).order_by(Enquiry.id.desc()).all()


@router.delete("/{enquiry_id}", dependencies=[Depends(get_current_user)])
def delete_enquiry(enquiry_id: int, db: Session = Depends(get_db)):
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    db.delete(enquiry)
    db.commit()
    return {"status": "deleted"}
