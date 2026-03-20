from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db
from app.schemas.animal import AnimalCreate, AnimalOut, AnimalUpdate
from app.schemas.pesaje import PesajeCreate, PesajeOut
from app.services import animal_service

router = APIRouter(prefix="/animales", tags=["Animales"])

@router.post("/", response_model=AnimalOut, status_code=status.HTTP_201_CREATED)
def crear_animal(animal: AnimalCreate, db: Session = Depends(get_db)):
    if animal_service.get_animal_by_caravana(db, animal.caravana):
        raise HTTPException(status_code=400, detail="La caravana ya está registrada")
    return animal_service.crear_animal(db, animal)

@router.get("/", response_model=List[AnimalOut])
def listar_animales(db: Session = Depends(get_db)):
    return animal_service.listar_todos(db)

@router.patch("/{animal_id}", response_model=AnimalOut)
def actualizar_animal(animal_id: int, obj_in: AnimalUpdate, db: Session = Depends(get_db)):
    db_animal = animal_service.get_animal_by_id(db, animal_id)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    return animal_service.actualizar_animal(db, db_animal, obj_in)

@router.post("/registrar-peso", response_model=PesajeOut)
def registrar_peso(pesaje: PesajeCreate, db: Session = Depends(get_db)):
    db_animal = animal_service.get_animal_by_id(db, pesaje.animal_id)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    
    # La lógica de actualizar el peso actual vive dentro del servicio
    return animal_service.registrar_pesaje_sincronizado(db, pesaje, db_animal)