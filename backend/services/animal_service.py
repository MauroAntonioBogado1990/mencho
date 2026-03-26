from sqlalchemy.orm import Session
from backend.models.animal import Animal
from backend.models.pesaje import Pesaje
from backend.models.evento import Evento
from backend.schemas.animal import AnimalCreate, AnimalUpdate
from backend.schemas.pesaje import PesajeCreate
from backend.schemas.evento import EventoCreate
from backend.core.exceptions import CaravanaDuplicadaException
from datetime import datetime
import re

def get_animal_by_caravana(db: Session, caravana: str):
    return db.query(Animal).filter(Animal.caravana == caravana).first()

def get_animal_by_id(db: Session, animal_id: int):
    return db.query(Animal).filter(Animal.id == animal_id).first()

def crear_animal(db: Session, animal_in: AnimalCreate):
    if get_animal_by_caravana(db, animal_in.caravana):
        raise CaravanaDuplicadaException(animal_in.caravana)
    nuevo = Animal(**animal_in.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def listar_todos(db: Session):
    return db.query(Animal).all()

def actualizar_animal(db: Session, db_animal: Animal, obj_in: AnimalUpdate):
    update_data = obj_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_animal, key, value)
    db.commit()
    db.refresh(db_animal)
    return db_animal

def eliminar_animal(db: Session, db_animal: Animal):
    db.delete(db_animal)
    db.commit()

def registrar_pesaje_sincronizado(db: Session, pesaje_in: PesajeCreate, db_animal: Animal):
    nuevo_pesaje = Pesaje(
        peso=pesaje_in.peso,
        animal_id=pesaje_in.animal_id,
        caravana=db_animal.caravana,
        fecha_pesaje=pesaje_in.fecha_pesaje or datetime.utcnow(),
    )
    db_animal.peso_actual = pesaje_in.peso
    db.add(nuevo_pesaje)
    db.commit()
    db.refresh(nuevo_pesaje)
    return nuevo_pesaje

def listar_pesajes(db: Session, animal_id: int):
    return db.query(Pesaje).filter(Pesaje.animal_id == animal_id).order_by(Pesaje.fecha_pesaje).all()

def crear_evento(db: Session, animal_id: int, evento_in: EventoCreate):
    nuevo = Evento(
        animal_id=animal_id,
        tipo=evento_in.tipo,
        descripcion=evento_in.descripcion,
        fecha=evento_in.fecha or datetime.utcnow(),
    )

    # Si es un cambio de lote, actualizar lote_nombre en el animal
    if evento_in.tipo == "cambio_lote":
        db_animal = get_animal_by_id(db, animal_id)
        if db_animal:
            # Extraer destino del formato: 'Movido de "X" a "Y"'
            match = re.search(r'a\s+"([^"]+)"', evento_in.descripcion)
            if match:
                db_animal.lote_nombre = match.group(1)
            else:
                # Si la descripción no sigue el formato, guardarla directo
                db_animal.lote_nombre = evento_in.descripcion

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def listar_eventos(db: Session, animal_id: int):
    return db.query(Evento).filter(Evento.animal_id == animal_id).order_by(Evento.fecha.desc()).all()