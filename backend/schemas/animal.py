from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Esquema Base: Campos comunes que siempre usamos
class AnimalBase(BaseModel):
    caravana: str = Field(..., example="AR-123", description="ID único del animal")
    especie: str = Field(..., example="Vaca", description="Tipo de animal (Vaca, Búfalo, Oveja)")
    raza: Optional[str] = Field(None, example="Braford")
    peso_actual: float = Field(0.0, ge=0, description="Peso en kilogramos")
    ubicacion: Optional[str] = Field(None, example="Potrero Norte")
    observaciones: Optional[str] = None
    genero:    Optional[str] = Field(None, example="Hembra")
    categoria: Optional[str] = Field(None, example="Vaca madre")

# Esquema para CREAR (Lo que el usuario envía desde el celular)
class AnimalCreate(AnimalBase):
    pass # Por ahora pedimos lo mismo que la base

# Esquema para LEER (Lo que la API devuelve, incluye el ID y la fecha)
class AnimalOut(AnimalBase):
    id: int
    fecha_ingreso: datetime

    class Config:
        from_attributes = True # Esto permite que Pydantic lea modelos de SQLAlchemy

# Esquema para ACTUALIZAR (Todo es opcional)
class AnimalUpdate(BaseModel):
    especie: Optional[str] = None
    raza: Optional[str] = None
    peso_actual: Optional[float] = Field(None, ge=0)
    ubicacion: Optional[str] = None
    observaciones: Optional[str] = None