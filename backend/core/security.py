import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

# Cambiá este valor por uno seguro en producción (ej: openssl rand -hex 32)
SECRET_KEY        = "CAMBIA_ESTO_POR_UN_SECRET_SEGURO_EN_PRODUCCION"
ALGORITHM         = "HS256"
ACCESS_TOKEN_EXP  = 30           # minutos
REFRESH_TOKEN_EXP = 30 * 24 * 60 # 30 días en minutos


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def crear_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"]  = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXP)
    payload["type"] = "access"
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def crear_refresh_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"]  = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXP)
    payload["type"] = "refresh"
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token(token: str, tipo: str = "access") -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != tipo:
            return None
        return payload
    except JWTError:
        return None