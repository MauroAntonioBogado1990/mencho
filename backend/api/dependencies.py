from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, Header
from typing import Optional

from backend.core.database import SessionLocal
from backend.core.security import verificar_token
from backend.models.usuario import Usuario


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Extrae y valida el access token del header Authorization: Bearer <token>.
    Usalo como dependencia en cualquier endpoint protegido.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")

    token = authorization.removeprefix("Bearer ").strip()
    payload = verificar_token(token, tipo="access")
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o vencido")

    usuario = db.query(Usuario).filter(Usuario.id == int(payload["sub"])).first()
    if not usuario or not usuario.activo:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return usuario