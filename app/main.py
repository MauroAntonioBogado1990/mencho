from fastapi import FastAPI
from app.core.database import engine
from app.models import animal
from app.api.endpoints import router as animal_router # Importamos el router
# Agrega esta línea con los otros imports de modelos
from app.models import animal, pesaje

animal.Base.metadata.create_all(bind=engine)
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.exceptions import MenchoException

app = FastAPI(
    title="Mencho API",
    description="Gestión Ganadera para el Litoral",
    version="0.1.0"
)

# Incluimos las rutas de animales
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