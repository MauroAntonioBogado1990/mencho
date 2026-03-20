import Dexie from 'dexie';

export const db = new Dexie('MenchoDB');

db.version(1).stores({
  animales: '++id, caravana, peso_actual, sincronizado',
  pesajes:  '++id, animal_id, peso, fecha, sincronizado'
});

db.version(2).stores({
  animales: '++id, caravana, peso_actual, sincronizado, lote_id, especie, raza, ubicacion, observaciones, fecha_ingreso',
  pesajes:  '++id, animal_id, peso, fecha, sincronizado',
  lotes:    '++id, nombre, descripcion',
}).upgrade(async tx => {
  await tx.table('animales').toCollection().modify(a => {
    if (a.lote_id  === undefined) a.lote_id  = null;
    if (a.especie  === undefined) a.especie  = 'Vaca';
    if (a.raza     === undefined) a.raza     = '';
  });
});

// v3: agrega ubicacion, observaciones, fecha_ingreso
db.version(3).stores({
  animales: '++id, caravana, peso_actual, sincronizado, lote_id, especie, raza, ubicacion, observaciones, fecha_ingreso',
  pesajes:  '++id, animal_id, peso, fecha, sincronizado',
  lotes:    '++id, nombre, descripcion',
}).upgrade(async tx => {
  await tx.table('animales').toCollection().modify(a => {
    if (a.ubicacion     === undefined) a.ubicacion     = null;
    if (a.observaciones === undefined) a.observaciones = null;
    if (a.fecha_ingreso === undefined) a.fecha_ingreso = new Date().toISOString();
  });
});

export const ESPECIES_RAZAS = {
  'Vaca':   ['Brahman', 'Angus', 'Brangus', 'Braangus', 'Hereford', 'Braford'],
  'Oveja':  ['Merino', 'Romney Marsh', 'Corriedale', 'Lincoln', 'Ideal'],
  'Búfalo': ['Mediterráneo', 'Murrah', 'Jafarabadi'],
};