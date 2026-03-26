from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import date, timedelta
from backend.api.dependencies import get_db
from backend.models.recordatorio import Recordatorio
from backend.models.animal import Animal
from backend.schemas.recordatorio import RecordatorioCreate, RecordatorioOut

router = APIRouter(prefix="/recordatorios", tags=["Recordatorios"])

@router.post("/", response_model=RecordatorioOut, status_code=201)
def crear_recordatorio(rec: RecordatorioCreate, db: Session = Depends(get_db)):
    nuevo = Recordatorio(**rec.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/proximos")
def proximos(db: Session = Depends(get_db)):
    """Recordatorios pendientes en los próximos 7 días (para el badge)."""
    hoy   = date.today()
    limit = hoy + timedelta(days=7)
    rows  = (
        db.query(Recordatorio, Animal.caravana)
        .join(Animal, Animal.id == Recordatorio.animal_id)
        .filter(
            Recordatorio.completado == False,
            Recordatorio.fecha_programada >= hoy,
            Recordatorio.fecha_programada <= limit,
        )
        .order_by(Recordatorio.fecha_programada)
        .all()
    )
    return [
        {
            "id":               r.id,
            "animal_id":        r.animal_id,
            "caravana":         caravana,
            "tipo":             r.tipo,
            "descripcion":      r.descripcion,
            "fecha_programada": r.fecha_programada.isoformat(),
            "dias_restantes":   (r.fecha_programada - hoy).days,
        }
        for r, caravana in rows
    ]

@router.get("/todos")
def todos(db: Session = Depends(get_db)):
    """Todos los recordatorios pendientes."""
    hoy  = date.today()
    rows = (
        db.query(Recordatorio, Animal.caravana)
        .join(Animal, Animal.id == Recordatorio.animal_id)
        .filter(Recordatorio.completado == False)
        .order_by(Recordatorio.fecha_programada)
        .all()
    )
    return [
        {
            "id":               r.id,
            "animal_id":        r.animal_id,
            "caravana":         caravana,
            "tipo":             r.tipo,
            "descripcion":      r.descripcion,
            "fecha_programada": r.fecha_programada.isoformat(),
            "dias_restantes":   (r.fecha_programada - hoy).days,
            "vencido":          r.fecha_programada < hoy,
        }
        for r, caravana in rows
    ]

@router.patch("/{rec_id}/completar")
def completar(rec_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recordatorio).filter(Recordatorio.id == rec_id).first()
    if rec:
        rec.completado = True
        db.commit()
    return {"ok": True}

@router.delete("/{rec_id}", status_code=204)
def eliminar(rec_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recordatorio).filter(Recordatorio.id == rec_id).first()
    if rec:
        db.delete(rec)
        db.commit()