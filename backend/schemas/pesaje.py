from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PesajeCreate(BaseModel):
    peso: float
    animal_id: int
    fecha_pesaje: Optional[datetime] = None  # si viene del celular con fecha local

class PesajeOut(BaseModel):
    id: int
    peso: float
    fecha_pesaje: datetime
    animal_id: int
    caravana: Optional[str] = None

    class Config:
        from_attributes = True