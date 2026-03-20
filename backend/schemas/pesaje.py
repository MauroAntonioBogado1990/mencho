from pydantic import BaseModel
from datetime import datetime

class PesajeCreate(BaseModel):
    peso: float
    animal_id: int

class PesajeOut(BaseModel):
    id: int
    peso: float
    fecha_pesaje: datetime
    animal_id: int

    class Config:
        from_attributes = True