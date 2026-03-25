from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from backend.core.database import Base
from sqlalchemy.orm import relationship

class Animal(Base):
    __tablename__ = "animals"

    id             = Column(Integer, primary_key=True, index=True)
    caravana       = Column(String, unique=True, index=True, nullable=False)
    especie        = Column(String, nullable=False)
    raza           = Column(String, nullable=True)
    peso_actual    = Column(Float, default=0.0)
    ubicacion      = Column(String, nullable=True)
    lote_nombre    = Column(String, nullable=True)   # ← nuevo: nombre del lote asignado
    fecha_ingreso  = Column(DateTime, default=datetime.utcnow)
    observaciones  = Column(String, nullable=True)
    genero         = Column(String, nullable=True)
    categoria      = Column(String, nullable=True)

    pesajes = relationship("Pesaje", back_populates="animal", cascade="all, delete-orphan")
    eventos = relationship("Evento", back_populates="animal", cascade="all, delete-orphan")