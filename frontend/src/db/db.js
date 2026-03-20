import Dexie from 'dexie';
 
export const db = new Dexie('MenchoDB');
 
// v1 original
db.version(1).stores({
  animales: '++id, caravana, peso_actual, sincronizado',
  pesajes: '++id, animal_id, peso, fecha, sincronizado'
});
 
// v2: lotes, especie, raza
db.version(2).stores({
  animales: '++id, caravana, peso_actual, sincronizado, lote_id, especie, raza',
  pesajes: '++id, animal_id, peso, fecha, sincronizado',
  lotes: '++id, nombre, descripcion',
}).upgrade(async tx => {
  await tx.table('animales').toCollection().modify(a => {
    if (a.lote_id === undefined) a.lote_id = null;
    if (a.especie === undefined) a.especie = 'Vaca';
    if (a.raza === undefined) a.raza = '';
  });
});
 
// Datos de especies y razas
export const ESPECIES_RAZAS = {
  'Vaca': ['Brahman', 'Angus', 'Brangus', 'Braangus', 'Hereford', 'Braford'],
  'Oveja': ['Merino', 'Romney Marsh', 'Corriedale', 'Lincoln', 'Ideal'],
  'Búfalo': ['Mediterráneo', 'Murrah', 'Jafarabadi'],
};