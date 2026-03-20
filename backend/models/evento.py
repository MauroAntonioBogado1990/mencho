from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.core.database import Base

class Evento(Base):
    __tablename__ = "eventos"

    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animals.id"), nullable=False)
    tipo = Column(String, nullable=False)  # 'cambio_lote' | 'vacuna' | 'observacion'
    descripcion = Column(String, nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)

    animal = relationship("Animal", back_populates="eventos")