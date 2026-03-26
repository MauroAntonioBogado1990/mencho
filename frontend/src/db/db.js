import Dexie from 'dexie';

export const db = new Dexie('MenchoDB');

db.version(1).stores({
  animales: '++id, caravana, peso_actual, sincronizado',
  pesajes:  '++id, animal_id, peso, fecha, sincronizado',
});

db.version(2).stores({
  animales: '++id, caravana, peso_actual, sincronizado, lote_id, especie, raza',
  pesajes:  '++id, animal_id, peso, fecha, sincronizado',
  lotes:    '++id, nombre, descripcion',
}).upgrade(async tx => {
  await tx.table('animales').toCollection().modify(a => {
    if (a.lote_id === undefined) a.lote_id = null;
    if (a.especie === undefined) a.especie = 'Vaca';
    if (a.raza    === undefined) a.raza    = '';
  });
});

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

db.version(4).stores({
  animales: '++id, caravana, peso_actual, sincronizado, lote_id, especie, raza, ubicacion, observaciones, fecha_ingreso, server_id',
  pesajes:  '++id, animal_id, peso, fecha, sincronizado, server_id',
  lotes:    '++id, nombre, descripcion',
  eventos:  '++id, animal_id, tipo, descripcion, fecha, sincronizado',
}).upgrade(async tx => {
  await tx.table('animales').toCollection().modify(a => {
    if (a.server_id === undefined) a.server_id = null;
  });
  await tx.table('pesajes').toCollection().modify(p => {
    if (p.server_id === undefined) p.server_id = null;
  });
});

db.version(5).stores({
  animales: '++id, caravana, peso_actual, sincronizado, lote_id, especie, raza, ubicacion, observaciones, fecha_ingreso, server_id, genero, categoria',
  pesajes:  '++id, animal_id, peso, fecha, sincronizado, server_id',
  lotes:    '++id, nombre, descripcion',
  eventos:  '++id, animal_id, tipo, descripcion, fecha, sincronizado',
}).upgrade(async tx => {
  await tx.table('animales').toCollection().modify(a => {
    if (a.genero    === undefined) a.genero    = null;
    if (a.categoria === undefined) a.categoria = null;
  });
});

// v6: tabla recordatorios para alertas de próximas aplicaciones
db.version(6).stores({
  animales:      '++id, caravana, peso_actual, sincronizado, lote_id, especie, raza, ubicacion, observaciones, fecha_ingreso, server_id, genero, categoria',
  pesajes:       '++id, animal_id, peso, fecha, sincronizado, server_id',
  lotes:         '++id, nombre, descripcion',
  eventos:       '++id, animal_id, tipo, descripcion, fecha, sincronizado',
  recordatorios: '++id, animal_id, tipo, descripcion, fecha_programada, completado',
});

export const CATEGORIAS_VACA_HEMBRA = [
  'Ternera', 'Vaquillita', 'Vaquilla', 'Vaquilla primer servicio',
  'Vaca de cría', 'Vaca madre', 'Vaca madre con cría a pie', 'Vaca madre q (última cría)',
];

export const ESPECIES_RAZAS = {
  'Vaca':   ['Brahman', 'Angus', 'Brangus', 'Braangus', 'Hereford', 'Braford'],
  'Oveja':  ['Merino', 'Romney Marsh', 'Corriedale', 'Lincoln', 'Ideal'],
  'Búfalo': ['Mediterráneo', 'Murrah', 'Jafarabadi'],
};

export const TIPOS_EVENTO = {
  cambio_lote:  { label: 'Cambio de Lote',  emoji: '🏡', color: '#1D5E4D' },
  vacuna:       { label: 'Vacuna',           emoji: '💉', color: '#8B5CF6' },
  observacion:  { label: 'Observación',      emoji: '📝', color: '#E67E22' },
  tratamiento:  { label: 'Tratamiento',      emoji: '🩺', color: '#EF4444' },
};                