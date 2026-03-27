from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from backend.core.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id             = Column(Integer, primary_key=True, index=True)
    email          = Column(String, unique=True, index=True, nullable=False)
    nombre         = Column(String, nullable=True)
    password_hash  = Column(String, nullable=False)
    activo         = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)