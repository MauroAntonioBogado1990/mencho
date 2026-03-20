/**
 * syncService.js
 * Sincronización bidireccional entre Dexie (local) y FastAPI (servidor)
 *
 * Estrategia:
 * 1. PUSH: subir al servidor los animales locales con sincronizado=0
 * 2. PULL: traer del servidor todos los animales y mergearlos en Dexie
 */
import api from './axios';
import { db } from '../db/db';

// ── PUSH: sube animales pendientes al servidor ─────────────────
export async function pushAnimalesPendientes() {
  const pendientes = await db.animales.where('sincronizado').equals(0).toArray();
  const resultados = { ok: 0, error: 0 };

  for (const animal of pendientes) {
    try {
      await api.post('/animales/', {
        caravana: animal.caravana,
        especie: animal.especie || 'Vaca',
        raza: animal.raza || null,
        peso_actual: animal.peso_actual,
        ubicacion: animal.lote_id ? `Lote ${animal.lote_id}` : null,
        observaciones: null,
      });
      // Marcar como sincronizado en local
      await db.animales.update(animal.id, { sincronizado: 1 });
      resultados.ok++;
    } catch (err) {
      // 400 = caravana duplicada en servidor, igual marcar como sync
      if (err.response?.status === 400) {
        await db.animales.update(animal.id, { sincronizado: 1 });
      } else {
        resultados.error++;
      }
    }
  }
  return resultados;
}

// ── PULL: trae animales del servidor y los mete en Dexie ───────
export async function pullAnimalesServidor() {
  const { data: animalesServidor } = await api.get('/animales/');

  for (const animalServer of animalesServidor) {
    const existe = await db.animales
      .where('caravana')
      .equals(animalServer.caravana)
      .first();

    if (!existe) {
      // Animal del servidor que no está en local: agregarlo
      await db.animales.add({
        caravana: animalServer.caravana,
        especie: animalServer.especie,
        raza: animalServer.raza || '',
        peso_actual: animalServer.peso_actual,
        lote_id: null,
        sincronizado: 1, // Ya está en el servidor
      });
    } else if (existe.sincronizado === 1) {
      // Ya sincronizado: actualizar metadata pero NO el peso_actual
      // El peso lo maneja el historial de pesajes local, no el servidor
      await db.animales.update(existe.id, {
        especie: animalServer.especie,
        raza: animalServer.raza || '',
        // peso_actual NO se pisa: el valor local es siempre el más reciente
      });
    }
    // Si sincronizado=0 (local pending), no pisamos con datos del servidor
  }

  return animalesServidor.length;
}

// ── SYNC COMPLETO: push + pull ─────────────────────────────────
export async function sincronizarTodo() {
  const push = await pushAnimalesPendientes();
  const pullCount = await pullAnimalesServidor();
  return { push, pullCount };
}