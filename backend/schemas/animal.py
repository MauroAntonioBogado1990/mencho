from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AnimalBase(BaseModel):
    caravana:      str            = Field(..., example="AR-123")
    especie:       str            = Field(..., example="Vaca")
    raza:          Optional[str]  = Field(None, example="Braford")
    peso_actual:   float          = Field(0.0, ge=0)
    ubicacion:     Optional[str]  = Field(None, example="Potrero Norte")
    lote_nombre:   Optional[str]  = Field(None, example="Lote Norte")  # ← nuevo
    observaciones: Optional[str]  = None
    genero:        Optional[str]  = Field(None, example="Hembra")
    categoria:     Optional[str]  = Field(None, example="Vaca madre")

class AnimalCreate(AnimalBase):
    pass

class AnimalOut(AnimalBase):
    id:            int
    fecha_ingreso: datetime

    class Config:
        from_attributes = True

class AnimalUpdate(BaseModel):
    especie:       Optional[str]   = None
    raza:          Optional[str]   = None
    peso_actual:   Optional[float] = Field(None, ge=0)
    ubicacion:     Optional[str]   = None
    lote_nombre:   Optional[str]   = None   # ← nuevo
    observaciones: Optional[str]   = None