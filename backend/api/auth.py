from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session
from typing import Optional

from backend.api.dependencies import get_db
from backend.models.usuario import Usuario
from backend.schemas.auth import LoginRequest, TokenResponse, UsuarioOut
from backend.core.security import (
    verify_password, crear_access_token, crear_refresh_token, verificar_token
)

router = APIRouter(prefix="/auth", tags=["Auth"])

REFRESH_COOKIE = "mencho_refresh"
COOKIE_MAX_AGE = 30 * 24 * 60 * 60  # 30 días en segundos


def _set_refresh_cookie(response: Response, token: str):
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,        # no accesible desde JS
        secure=False,         # cambiar a True en producción con HTTPS
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/auth",         # solo se envía a /auth/*
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == body.email).first()
    if not usuario or not verify_password(body.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    if not usuario.activo:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    access  = crear_access_token({"sub": str(usuario.id), "email": usuario.email})
    refresh = crear_refresh_token({"sub": str(usuario.id), "email": usuario.email})
    _set_refresh_cookie(response, refresh)

    return {"access_token": access}


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    response: Response,
    mencho_refresh: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not mencho_refresh:
        raise HTTPException(status_code=401, detail="Sin refresh token")

    payload = verificar_token(mencho_refresh, tipo="refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Refresh token inválido o vencido")

    usuario = db.query(Usuario).filter(Usuario.id == int(payload["sub"])).first()
    if not usuario or not usuario.activo:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    access  = crear_access_token({"sub": str(usuario.id), "email": usuario.email})
    refresh_nuevo = crear_refresh_token({"sub": str(usuario.id), "email": usuario.email})
    _set_refresh_cookie(response, refresh_nuevo)  # rotación del refresh token

    return {"access_token": access}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=REFRESH_COOKIE, path="/auth")
    return {"ok": True}


@router.get("/me", response_model=UsuarioOut)
def me(
    mencho_refresh: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    """Verifica si hay sesión activa — el frontend lo llama al abrir la app."""
    if not mencho_refresh:
        raise HTTPException(status_code=401, detail="No autenticado")
    payload = verificar_token(mencho_refresh, tipo="refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Sesión vencida")
    usuario = db.query(Usuario).filter(Usuario.id == int(payload["sub"])).first()
    if not usuario or not usuario.activo:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return usuario