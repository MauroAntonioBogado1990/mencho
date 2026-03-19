from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.core.database import Base # Luego crearemos este archivo de conexión
from sqlalchemy.orm import relationship
class Animal(Base):
    __tablename__ = "animals"

    id = Column(Integer, primary_key=True, index=True)
    caravana = Column(String, unique=True, index=True, nullable=False) # Identificador único
    especie = Column(String, nullable=False) # Vaca, Búfalo, Oveja
    raza = Column(String, nullable=True)
    peso_actual = Column(Float, default=0.0)
    ubicacion = Column(String, nullable=True) # Potrero o zona
    fecha_ingreso = Column(DateTime, default=datetime.utcnow)
    observaciones = Column(String, nullable=True)
    pesajes = relationship("Pesaje", back_populates="animal")