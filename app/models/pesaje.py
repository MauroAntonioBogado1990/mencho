from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Pesaje(Base):
    __tablename__ = "pesajes"

    id = Column(Integer, primary_key=True, index=True)
    peso = Column(Float, nullable=False)
    fecha_pesaje = Column(DateTime, default=datetime.utcnow)
    
    # Relación con el Animal
    animal_id = Column(Integer, ForeignKey("animals.id"))
    animal = relationship("Animal", back_populates="pesajes")