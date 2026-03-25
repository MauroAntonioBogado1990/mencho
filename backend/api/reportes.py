"""
Reportes de evolución de peso.
Rutas:
  GET /reportes/lotes                        → lista de lotes disponibles (por lote_nombre)
  GET /reportes/evolucion-lote/{lote}        → evolución de un lote
  GET /reportes/evolucion-periodo            → evolución con filtros libres
  GET /reportes/evolucion-animal/{caravana}  → evolución individual
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, date

from backend.api.dependencies import get_db
from backend.models.animal import Animal
from backend.models.pesaje import Pesaje

router = APIRouter(prefix="/reportes", tags=["Reportes"])


def _calcular_gdp(puntos: list[dict]) -> list[dict]:
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


def _serializar_puntos(puntos: list[dict]) -> list[dict]:
    for p in puntos:
        if isinstance(p["fecha"], date):
            p["fecha"] = p["fecha"].isoformat()
    return puntos


@router.get("/lotes")
def listar_lotes(db: Session = Depends(get_db)):
    """Devuelve todos los nombres de lote distintos registrados en animales."""
    resultados = (
        db.query(Animal.lote_nombre)
        .filter(Animal.lote_nombre.isnot(None))
        .distinct()
        .order_by(Animal.lote_nombre)
        .all()
    )
    return {"lotes": [r.lote_nombre for r in resultados]}


@router.get("/evolucion-lote/{lote_nombre}")
def evolucion_por_lote(
    lote_nombre: str,
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    animal_ids = (
        db.query(Animal.id)
        .filter(Animal.lote_nombre == lote_nombre)
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
            "fecha":            row.fecha if isinstance(row.fecha, date) else date.fromisoformat(str(row.fecha)),
            "peso_promedio":    round(row.peso_promedio, 2),
            "cantidad_pesajes": row.cantidad_pesajes,
            "peso_min":         round(row.peso_min, 2),
            "peso_max":         round(row.peso_max, 2),
        }
        for row in rows
    ]

    puntos = _calcular_gdp(puntos)
    puntos = _serializar_puntos(puntos)

    total_animales = (
        db.query(func.count(Animal.id))
        .filter(Animal.lote_nombre == lote_nombre)
        .scalar()
    )

    return {"lote": lote_nombre, "total_animales": total_animales, "puntos": puntos}


@router.get("/evolucion-periodo")
def evolucion_por_periodo(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    lote_nombre: Optional[str]  = Query(None),
    especie:     Optional[str]  = Query(None),
    categoria:   Optional[str]  = Query(None),
    db: Session = Depends(get_db),
):
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
    if lote_nombre:
        query = query.filter(Animal.lote_nombre == lote_nombre)
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
            "fecha":            row.fecha if isinstance(row.fecha, date) else date.fromisoformat(str(row.fecha)),
            "peso_promedio":    round(row.peso_promedio, 2),
            "cantidad_pesajes": row.cantidad_pesajes,
            "peso_min":         round(row.peso_min, 2),
            "peso_max":         round(row.peso_max, 2),
        }
        for row in rows
    ]

    puntos = _calcular_gdp(puntos)
    puntos = _serializar_puntos(puntos)

    return {
        "filtros": {
            "fecha_desde": fecha_desde.isoformat() if fecha_desde else None,
            "fecha_hasta": fecha_hasta.isoformat() if fecha_hasta else None,
            "lote_nombre": lote_nombre,
            "especie":     especie,
            "categoria":   categoria,
        },
        "puntos": puntos,
    }


@router.get("/evolucion-animal/{caravana}")
def evolucion_por_animal(
    caravana: str,
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
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
            "fecha":            p.fecha_pesaje.date(),
            "peso_promedio":    p.peso,
            "peso":             p.peso,
            "peso_min":         p.peso,
            "peso_max":         p.peso,
            "cantidad_pesajes": 1,
        }
        for p in pesajes
    ]

    puntos = _calcular_gdp(puntos)
    puntos = _serializar_puntos(puntos)

    return {
        "animal": {
            "id":          animal.id,
            "caravana":    animal.caravana,
            "especie":     animal.especie,
            "raza":        animal.raza,
            "categoria":   animal.categoria,
            "lote_nombre": animal.lote_nombre,
            "ubicacion":   animal.ubicacion,
        },
        "puntos": puntos,
    }