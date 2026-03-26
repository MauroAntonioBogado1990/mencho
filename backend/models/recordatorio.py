from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.core.database import Base

class Recordatorio(Base):
    __tablename__ = "recordatorios"

    id          = Column(Integer, primary_key=True, index=True)
    animal_id   = Column(Integer, ForeignKey("animals.id"), nullable=False)
    tipo        = Column(String, nullable=False)   # 'vacuna', 'tratamiento', etc.
    descripcion = Column(String, nullable=False)   # ej: "Segunda dosis Aftosa"
    fecha_programada = Column(Date, nullable=False)
    completado  = Column(Boolean, default=False)

    animal = relationship("Animal", back_populates="recordatorios")