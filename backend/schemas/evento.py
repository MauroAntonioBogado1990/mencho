from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EventoCreate(BaseModel):
    animal_id: int
    tipo: str
    descripcion: str
    fecha: Optional[datetime] = None

class EventoOut(BaseModel):
    id: int
    animal_id: int
    tipo: str
    descripcion: str
    fecha: datetime

    class Config:
        from_attributes = True