from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.animal import Animal
from app.schemas.animal import AnimalCreate, AnimalOut, AnimalUpdate
from app.models.pesaje import Pesaje
from app.schemas.pesaje import PesajeCreate, PesajeOut

router = APIRouter(prefix="/animales", tags=["Animales"])

@router.post("/", response_model=AnimalOut)
def crear_animal(animal: AnimalCreate, db: Session = Depends(get_db)):
    # 1. Verificamos si la caravana ya existe (para evitar duplicados)
    db_animal = db.query(Animal).filter(Animal.caravana == animal.caravana).first()
    if db_animal:
        raise HTTPException(status_code=400, detail="La caravana ya está registrada")
    
    # 2. Convertimos el Schema en un Modelo de Base de Datos
    nuevo_animal = Animal(**animal.model_dump())
    
    # 3. Guardamos en la DB
    db.add(nuevo_animal)
    db.commit()
    db.refresh(nuevo_animal)
    return nuevo_animal

@router.get("/", response_model=List[AnimalOut])
def listar_animales(db: Session = Depends(get_db)):
    return db.query(Animal).all()


@router.patch("/{animal_id}", response_model=AnimalOut)
def actualizar_animal(animal_id: int, obj_in: AnimalUpdate, db: Session = Depends(get_db)):
    # 1. Buscamos si el animal existe
    db_animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")

    # 2. Extraemos los datos enviados (solo los que no son None)
    update_data = obj_in.model_dump(exclude_unset=True)
    
    # 3. Aplicamos los cambios al modelo de la DB
    for key, value in update_data.items():
        setattr(db_animal, key, value)

    db.commit()
    db.refresh(db_animal)
    return db_animal

@router.post("/registrar-peso", response_model=PesajeOut)
def registrar_peso(pesaje: PesajeCreate, db: Session = Depends(get_db)):
    # 1. Verificar que el animal existe
    db_animal = db.query(Animal).filter(Animal.id == pesaje.animal_id).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    
    # 2. Crear el registro de pesaje
    nuevo_pesaje = Pesaje(**pesaje.model_dump())
    
    # 3. Actualizar el 'peso_actual' en la tabla de Animal (Sincronización)
    db_animal.peso_actual = pesaje.peso
    
    db.add(nuevo_pesaje)
    db.commit()
    db.refresh(nuevo_pesaje)
    return nuevo_pesaje