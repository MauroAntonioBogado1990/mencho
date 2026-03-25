"""
Reportes de evolución de peso.
Rutas:
  GET /reportes/evolucion-lote/{ubicacion}   → evolución de un lote
  GET /reportes/evolucion-periodo            → evolución con filtros libres
  GET /reportes/evolucion-animal/{animal_id} → evolución individual
  GET /reportes/lotes                        → lista de ubicaciones/lotes disponibles
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, date

from backend.api.dependencies import get_db
from backend.models.animal import Animal
from backend.models.pesaje import Pesaje

router = APIRouter(prefix="/reportes", tags=["Reportes"])


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _calcular_gdp(puntos: list[dict]) -> list[dict]:
    """Agrega Ganancia Diaria de Peso (GDP) a cada punto de la serie."""
    for i, punto in enumerate(puntos):
        if i == 0:
            punto["gdp"] = None
        else:
            prev = puntos[i - 1]
            dias = (punto["fecha"] - prev["fecha"]).days
            if dias > 0:
                punto["gdp"] = round((punto["peso_promedio"] - prev["peso_promedio"]) / dias, 3)
            else:
                punto["gdp"] = None
    return puntos


# ──────────────────────────────────────────────────────────────────────────────
# GET /reportes/lotes
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/lotes")
def listar_lotes(db: Session = Depends(get_db)):
    """Devuelve todas las ubicaciones/lotes distintos que tienen animales."""
    resultados = (
        db.query(Animal.ubicacion)
        .filter(Animal.ubicacion.isnot(None))
        .distinct()
        .order_by(Animal.ubicacion)
        .all()
    )
    return {"lotes": [r.ubicacion for r in resultados]}


# ──────────────────────────────────────────────────────────────────────────────
# GET /reportes/evolucion-lote/{ubicacion}
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/evolucion-lote/{ubicacion}")
def evolucion_por_lote(
    ubicacion: str,
    fecha_desde: Optional[date] = Query(None, description="Fecha inicio YYYY-MM-DD"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha fin   YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Retorna la evolución del peso promedio diario de todos los animales
    que pertenecen al lote (ubicacion) indicado.
    """
    # IDs de animales en ese lote
    animal_ids = (
        db.query(Animal.id)
        .filter(Animal.ubicacion == ubicacion)
        .subquery()
    )

    query = (
        db.query(
            func.date(Pesaje.fecha_pesaje).label("fecha"),
            func.avg(Pesaje.peso).label("peso_promedio"),
            func.count(Pesaje.id).label("cantidad_pesajes"),
            func.min(Pesaje.peso).label("peso_min"),
            func.max(Pesaje.peso).label("peso_max"),
        )
        .filter(Pesaje.animal_id.in_(animal_ids))
    )

    if fecha_desde:
        query = query.filter(Pesaje.fecha_pesaje >= datetime.combine(fecha_desde, datetime.min.time()))
    if fecha_hasta:
        query = query.filter(Pesaje.fecha_pesaje <= datetime.combine(fecha_hasta, datetime.max.time()))

    rows = (
        query
        .group_by(func.date(Pesaje.fecha_pesaje))
        .order_by(func.date(Pesaje.fecha_pesaje))
        .all()
    )

    puntos = [
        {
            "fecha": row.fecha if isinstance(row.fecha, date) else date.fromisoformat(str(row.fecha)),
            "peso_promedio": round(row.peso_promedio, 2),
            "cantidad_pesajes": row.cantidad_pesajes,
            "peso_min": round(row.peso_min, 2),
            "peso_max": round(row.peso_max, 2),
        }
        for row in rows
    ]

    puntos = _calcular_gdp(puntos)

    # serializar fechas a string para JSON
    for p in puntos:
        p["fecha"] = p["fecha"].isoformat()

    total_animales = db.query(func.count(Animal.id)).filter(Animal.ubicacion == ubicacion).scalar()

    return {
        "lote": ubicacion,
        "total_animales": total_animales,
        "puntos": puntos,
    }


# ──────────────────────────────────────────────────────────────────────────────
# GET /reportes/evolucion-periodo
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/evolucion-periodo")
def evolucion_por_periodo(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    ubicacion: Optional[str] = Query(None, description="Filtrar por lote"),
    especie: Optional[str] = Query(None),
    categoria: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Evolución de peso en un período dado, con filtros opcionales.
    Agrupa por fecha y devuelve promedio, min, max y GDP.
    """
    query = (
        db.query(
            func.date(Pesaje.fecha_pesaje).label("fecha"),
            func.avg(Pesaje.peso).label("peso_promedio"),
            func.count(Pesaje.id).label("cantidad_pesajes"),
            func.min(Pesaje.peso).label("peso_min"),
            func.max(Pesaje.peso).label("peso_max"),
        )
        .join(Animal, Animal.id == Pesaje.animal_id)
    )

    if fecha_desde:
        query = query.filter(Pesaje.fecha_pesaje >= datetime.combine(fecha_desde, datetime.min.time()))
    if fecha_hasta:
        query = query.filter(Pesaje.fecha_pesaje <= datetime.combine(fecha_hasta, datetime.max.time()))
    if ubicacion:
        query = query.filter(Animal.ubicacion == ubicacion)
    if especie:
        query = query.filter(Animal.especie == especie)
    if categoria:
        query = query.filter(Animal.categoria == categoria)

    rows = (
        query
        .group_by(func.date(Pesaje.fecha_pesaje))
        .order_by(func.date(Pesaje.fecha_pesaje))
        .all()
    )

    puntos = [
        {
            "fecha": row.fecha if isinstance(row.fecha, date) else date.fromisoformat(str(row.fecha)),
            "peso_promedio": round(row.peso_promedio, 2),
            "cantidad_pesajes": row.cantidad_pesajes,
            "peso_min": round(row.peso_min, 2),
            "peso_max": round(row.peso_max, 2),
        }
        for row in rows
    ]

    puntos = _calcular_gdp(puntos)

    for p in puntos:
        p["fecha"] = p["fecha"].isoformat()

    return {
        "filtros": {
            "fecha_desde": fecha_desde.isoformat() if fecha_desde else None,
            "fecha_hasta": fecha_hasta.isoformat() if fecha_hasta else None,
            "ubicacion": ubicacion,
            "especie": especie,
            "categoria": categoria,
        },
        "puntos": puntos,
    }


# ──────────────────────────────────────────────────────────────────────────────
# GET /reportes/evolucion-animal/{animal_id}
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/evolucion-animal/{caravana}")
def evolucion_por_animal(
    caravana: str,
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Evolución individual de un animal buscado por caravana,
    con GDP entre cada medición.
    """
    from fastapi import HTTPException
    animal = db.query(Animal).filter(Animal.caravana == caravana).first()
    if not animal:
        raise HTTPException(status_code=404, detail=f"Animal con caravana '{caravana}' no encontrado")

    query = db.query(Pesaje).filter(Pesaje.animal_id == animal.id)

    if fecha_desde:
        query = query.filter(Pesaje.fecha_pesaje >= datetime.combine(fecha_desde, datetime.min.time()))
    if fecha_hasta:
        query = query.filter(Pesaje.fecha_pesaje <= datetime.combine(fecha_hasta, datetime.max.time()))

    pesajes = query.order_by(Pesaje.fecha_pesaje).all()

    puntos = [
        {
            "fecha": p.fecha_pesaje.date(),
            "peso_promedio": p.peso,   # campo unificado para el componente
            "peso": p.peso,
            "peso_min": p.peso,
            "peso_max": p.peso,
            "cantidad_pesajes": 1,
        }
        for p in pesajes
    ]

    puntos = _calcular_gdp(puntos)

    for p in puntos:
        p["fecha"] = p["fecha"].isoformat()

    return {
        "animal": {
            "id": animal.id,
            "caravana": animal.caravana,
            "especie": animal.especie,
            "raza": animal.raza,
            "categoria": animal.categoria,
            "ubicacion": animal.ubicacion,
        },
        "puntos": puntos,
    }