# Importar TODOS los modelos antes de create_all
from backend.core.database import Base, engine
from backend.models.animal import Animal
from backend.models.pesaje import Pesaje
from backend.models.evento import Evento
from backend.models.recordatorio import Recordatorio
 
Base.metadata.create_all(bind=engine)
print("Tabla 'recordatorios' creada OK")
 