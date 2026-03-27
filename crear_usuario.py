"""
Ejecutar una sola vez para crear tu usuario en la DB:
  python crear_usuario.py
"""
from backend.core.database import SessionLocal
from backend.models.usuario import Usuario
from backend.core.security import hash_password

EMAIL    = "mauroantoniobogado@gmail.com"     # ← cambiá esto
PASSWORD = "menchomauro"      # ← cambiá esto
NOMBRE   = "Mauro"            # ← cambiá esto

db = SessionLocal()

existente = db.query(Usuario).filter(Usuario.email == EMAIL).first()
if existente:
    print(f"Ya existe un usuario con email {EMAIL}")
else:
    usuario = Usuario(
        email=EMAIL,
        nombre=NOMBRE,
        password_hash=hash_password(PASSWORD),
        activo=True,
    )
    db.add(usuario)
    db.commit()
    print(f"Usuario '{NOMBRE}' creado con email {EMAIL}")

db.close()