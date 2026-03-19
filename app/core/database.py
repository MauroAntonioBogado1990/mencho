from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# El archivo se creará automáticamente en la raíz como 'mencho.db'
SQLALCHEMY_DATABASE_URL = "sqlite:///./mencho.db"

# Engine: El corazón de la conexión
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# SessionLocal: Cada vez que necesitemos guardar algo, pediremos una "sesión"
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base: De aquí heredarán todos nuestros modelos (como el de Animal)
Base = declarative_base()

# Dependencia para obtener la DB en nuestras rutas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  