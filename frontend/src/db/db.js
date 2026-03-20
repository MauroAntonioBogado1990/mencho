import Dexie from 'dexie';

export const db = new Dexie('MenchoDB');

// Definimos el esquema
// sincronizado: 0 (pendiente), 1 (ya subido al servidor)
db.version(1).stores({
  animales: '++id, caravana, peso_actual, sincronizado',
  pesajes: '++id, animal_id, peso, fecha, sincronizado'
});