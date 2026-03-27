from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.database import engine, Base
from backend.core.exceptions import MenchoException

# Importar TODOS los modelos para que Base los registre
from backend.models.usuario import Usuario      # noqa  ← nuevo
from backend.models.animal import Animal        # noqa
from backend.models.pesaje import Pesaje        # noqa
from backend.models.evento import Evento        # noqa
from backend.models.recordatorio import Recordatorio  # noqa

from backend.api.auth import router as auth_router               # ← nuevo
from backend.api.endpoints import router as animal_router
from backend.api.reportes import router as reportes_router
from backend.api.recordatorios import router as recordatorios_router

# Crear todas las tablas (incluida 'usuarios')
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mencho API", description="Gestión Ganadera para el Litoral", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,   # necesario para que el navegador envíe cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)           # ← nuevo, primero
app.include_router(animal_router)
app.include_router(reportes_router)
app.include_router(recordatorios_router)

@app.get("/")
async def read_root():
    return {"message": "Mencho API v0.3 en línea"}

@app.exception_handler(MenchoException)
async def mencho_exception_handler(request: Request, exc: MenchoException):
    return JSONResponse(status_code=exc.code, content={"status": "error", "message": exc.message})