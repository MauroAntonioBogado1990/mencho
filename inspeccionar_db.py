import sqlite3

conn = sqlite3.connect('mencho.db')

tablas = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print('Tablas:', tablas)

for (tabla,) in tablas:
    print(f'\n--- {tabla} ---')
    cols = conn.execute(f"PRAGMA table_info({tabla})").fetchall()
    print('Columnas:', [c[1] for c in cols])
    rows = conn.execute(f"SELECT * FROM {tabla} LIMIT 5").fetchall()
    for r in rows:
        print(r)

conn.close()