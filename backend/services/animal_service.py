from sqlalchemy.orm import Session
from backend.models.animal import Animal
from backend.models.pesaje import Pesaje
from backend.schemas.animal import AnimalCreate, AnimalUpdate
from backend.schemas.pesaje import PesajeCreate
from backend.core.exceptions import CaravanaDuplicadaException

def get_animal_by_caravana(db: Session, caravana: str):
    return db.query(Animal).filter(Animal.caravana == caravana).first()

def get_animal_by_id(db: Session, animal_id: int):
    return db.query(Animal).filter(Animal.id == animal_id).first()

def crear_animal(db: Session, animal_in: AnimalCreate):
    if get_animal_by_caravana(db, animal_in.caravana):
        raise CaravanaDuplicadaException(animal_in.caravana)
    nuevo_animal = Animal(**animal_in.model_dump())
    db.add(nuevo_animal)
    db.commit()
    db.refresh(nuevo_animal)
    return nuevo_animal

def listar_todos(db: Session):
    return db.query(Animal).all()

def actualizar_animal(db: Session, db_animal: Animal, obj_in: AnimalUpdate):
    update_data = obj_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_animal, key, value)
    db.commit()
    db.refresh(db_animal)
    return db_animal

def registrar_pesaje_sincronizado(db: Session, pesaje_in: PesajeCreate, db_animal: Animal):
    nuevo_pesaje = Pesaje(**pesaje_in.model_dump())
    db_animal.peso_actual = pesaje_in.peso
    db.add(nuevo_pesaje)
    db.commit()
    db.refresh(nuevo_pesaje)
    return nuevo_pesaje