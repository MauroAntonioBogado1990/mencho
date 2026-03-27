from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"


class UsuarioOut(BaseModel):
    id:     int
    email:  str
    nombre: Optional[str]

    class Config:
        from_attributes = True