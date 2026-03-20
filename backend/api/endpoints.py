from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from backend.api.dependencies import get_db
from backend.schemas.animal import AnimalCreate, AnimalOut, AnimalUpdate
from backend.schemas.pesaje import PesajeCreate, PesajeOut
from backend.schemas.evento import EventoCreate, EventoOut
from backend.services import animal_service

router = APIRouter(prefix="/animales", tags=["Animales"])

# ── ANIMALES ───────────────────────────────────────────────────
@router.post("/", response_model=AnimalOut, status_code=status.HTTP_201_CREATED)
def crear_animal(animal: AnimalCreate, db: Session = Depends(get_db)):
    return animal_service.crear_animal(db, animal)

@router.get("/", response_model=List[AnimalOut])
def listar_animales(db: Session = Depends(get_db)):
    return animal_service.listar_todos(db)

@router.get("/{animal_id}", response_model=AnimalOut)
def obtener_animal(animal_id: int, db: Session = Depends(get_db)):
    db_animal = animal_service.get_animal_by_id(db, animal_id)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    return db_animal

@router.patch("/{animal_id}", response_model=AnimalOut)
def actualizar_animal(animal_id: int, obj_in: AnimalUpdate, db: Session = Depends(get_db)):
    db_animal = animal_service.get_animal_by_id(db, animal_id)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    return animal_service.actualizar_animal(db, db_animal, obj_in)

@router.delete("/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_animal(animal_id: int, db: Session = Depends(get_db)):
    db_animal = animal_service.get_animal_by_id(db, animal_id)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    animal_service.eliminar_animal(db, db_animal)

# ── PESAJES ────────────────────────────────────────────────────
@router.post("/registrar-peso", response_model=PesajeOut)
def registrar_peso(pesaje: PesajeCreate, db: Session = Depends(get_db)):
    db_animal = animal_service.get_animal_by_id(db, pesaje.animal_id)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    return animal_service.registrar_pesaje_sincronizado(db, pesaje, db_animal)

@router.get("/{animal_id}/pesajes", response_model=List[PesajeOut])
def listar_pesajes(animal_id: int, db: Session = Depends(get_db)):
    return animal_service.listar_pesajes(db, animal_id)

# ── EVENTOS (cambio lote, vacunas, observaciones) ──────────────
@router.post("/{animal_id}/eventos", response_model=EventoOut, status_code=status.HTTP_201_CREATED)
def crear_evento(animal_id: int, evento: EventoCreate, db: Session = Depends(get_db)):
    db_animal = animal_service.get_animal_by_id(db, animal_id)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    return animal_service.crear_evento(db, animal_id, evento)

@router.get("/{animal_id}/eventos", response_model=List[EventoOut])
def listar_eventos(animal_id: int, db: Session = Depends(get_db)):
    return animal_service.listar_eventos(db, animal_id)