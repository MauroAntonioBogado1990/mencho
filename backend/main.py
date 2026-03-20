from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.database import engine
from backend.core.exceptions import MenchoException
from backend.models import animal, pesaje
from backend.api.endpoints import router as animal_router

# Crear tablas si no existen
animal.Base.metadata.create_all(bind=engine)
pesaje.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mencho API",
    description="Gestión Ganadera para el Litoral",
    version="0.1.0"
)

# ── CORS: permite que el frontend React se conecte ──────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(animal_router)

@app.get("/")
async def read_root():
    return {"message": "Mencho API en línea"}

@app.exception_handler(MenchoException)
async def mencho_exception_handler(request: Request, exc: MenchoException):
    return JSONResponse(
        status_code=exc.code,
        content={
            "status": "error",
            "message": exc.message,
            "path": request.url.path
        },
    )