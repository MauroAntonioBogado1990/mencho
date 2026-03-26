"""
Migra lote_nombre en la tabla animals tomando el último evento
cambio_lote de cada animal y extrayendo el destino del texto.
Formato esperado: 'Movido de "X" a "Y"'
"""
import sqlite3
import re

conn = sqlite3.connect('mencho.db')

# Obtener el último cambio_lote por animal
eventos = conn.execute("""
    SELECT animal_id, descripcion
    FROM eventos
    WHERE tipo = 'cambio_lote'
    ORDER BY fecha ASC
""").fetchall()

# Agrupar: quedarse con el último por animal_id
ultimo_lote = {}
for animal_id, descripcion in eventos:
    # Extraer el destino: texto entre las últimas comillas
    match = re.search(r'a\s+"([^"]+)"', descripcion)
    if match:
        ultimo_lote[animal_id] = match.group(1)

print("Lotes encontrados por animal:")
for animal_id, lote in ultimo_lote.items():
    print(f"  Animal {animal_id} → {lote}")

# Actualizar la tabla animals
for animal_id, lote_nombre in ultimo_lote.items():
    conn.execute(
        "UPDATE animals SET lote_nombre = ? WHERE id = ?",
        (lote_nombre, animal_id)
    )

conn.commit()

# Verificar resultado
print("\nAnimales después de la migración:")
rows = conn.execute("SELECT id, caravana, lote_nombre FROM animals").fetchall()
for r in rows:
    print(f"  {r}")

conn.close()
print("\nMigración completada.")