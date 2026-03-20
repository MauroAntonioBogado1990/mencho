from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.core.database import Base

class Pesaje(Base):
    __tablename__ = "pesajes"

    id = Column(Integer, primary_key=True, index=True)
    peso = Column(Float, nullable=False)
    fecha_pesaje = Column(DateTime, default=datetime.utcnow)
    animal_id = Column(Integer, ForeignKey("animals.id"))
    caravana = Column(String, nullable=True)

    animal = relationship("Animal", back_populates="pesajes")