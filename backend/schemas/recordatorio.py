from pydantic import BaseModel
from datetime import date
from typing import Optional

class RecordatorioCreate(BaseModel):
    animal_id:        int
    tipo:             str
    descripcion:      str
    fecha_programada: date

class RecordatorioOut(RecordatorioCreate):
    id:         int
    completado: bool
    class Config:
        from_attributes = True