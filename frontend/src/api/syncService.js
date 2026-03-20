/**
 * syncService.js — Sincronización completa bidireccional
 * Sube: animales, pesajes, eventos pendientes
 * Baja: animales, pesajes y eventos del servidor
 */
import api from './axios';
import { db } from '../db/db';

// ── Helpers ────────────────────────────────────────────────────
const getServerIdByCaravana = async (caravana) => {
  try {
    const { data } = await api.get('/animales/');
    const found = data.find(a => a.caravana === caravana);
    return found?.id ?? null;
  } catch { return null; }
};

// ── PUSH Animales ──────────────────────────────────────────────
export async function pushAnimalesPendientes() {
  const pendientes = await db.animales.where('sincronizado').equals(0).toArray();
  const resultado = { ok: 0, error: 0 };

  for (const animal of pendientes) {
    try {
      const { data } = await api.post('/animales/', {
        caravana:      animal.caravana,
        especie:       animal.especie || 'Vaca',
        raza:          animal.raza || null,
        peso_actual:   animal.peso_actual,
        ubicacion:     animal.ubicacion || null,
        observaciones: animal.observaciones || null,
      });
      await db.animales.update(animal.id, { sincronizado: 1, server_id: data.id });
      resultado.ok++;
    } catch (err) {
      if (err.response?.status === 400) {
        // Ya existe en server — buscar su server_id
        const sid = await getServerIdByCaravana(animal.caravana);
        await db.animales.update(animal.id, { sincronizado: 1, server_id: sid });
      } else {
        resultado.error++;
      }
    }
  }
  return resultado;
}

// ── PUSH Pesajes ───────────────────────────────────────────────
export async function pushPesajesPendientes() {
  const pendientes = await db.pesajes.where('sincronizado').equals(0).toArray();
  const resultado = { ok: 0, error: 0 };

  for (const pesaje of pendientes) {
    // Necesitamos el server_id del animal
    const animal = await db.animales.get(pesaje.animal_id);
    if (!animal?.server_id) {
      // El animal aún no fue sincronizado, saltear por ahora
      continue;
    }
    try {
      const { data } = await api.post('/animales/registrar-peso', {
        animal_id:   animal.server_id,
        peso:        pesaje.peso,
        fecha_pesaje: pesaje.fecha,
      });
      await db.pesajes.update(pesaje.id, { sincronizado: 1, server_id: data.id });
      resultado.ok++;
    } catch {
      resultado.error++;
    }
  }
  return resultado;
}

// ── PUSH Eventos ───────────────────────────────────────────────
export async function pushEventosPendientes() {
  const pendientes = await db.eventos.where('sincronizado').equals(0).toArray();
  const resultado = { ok: 0, error: 0 };

  for (const evento of pendientes) {
    const animal = await db.animales.get(evento.animal_id);
    if (!animal?.server_id) { continue; }
    try {
      await api.post(`/animales/${animal.server_id}/eventos`, {
        animal_id:   animal.server_id,
        tipo:        evento.tipo,
        descripcion: evento.descripcion,
        fecha:       evento.fecha,
      });
      await db.eventos.update(evento.id, { sincronizado: 1 });
      resultado.ok++;
    } catch {
      resultado.error++;
    }
  }
  return resultado;
}

// ── PULL Animales + pesajes + eventos ─────────────────────────
export async function pullDesdeServidor() {
  const { data: animalesServer } = await api.get('/animales/');
  let animalesBajados = 0;
  let pesajesBajados = 0;
  let eventosBajados = 0;

  for (const as of animalesServer) {
    const existe = await db.animales.where('caravana').equals(as.caravana).first();

    if (!existe) {
      await db.animales.add({
        caravana:      as.caravana,
        especie:       as.especie,
        raza:          as.raza || '',
        peso_actual:   as.peso_actual,
        ubicacion:     as.ubicacion || null,
        observaciones: as.observaciones || null,
        fecha_ingreso: as.fecha_ingreso || new Date().toISOString(),
        lote_id:       null,
        sincronizado:  1,
        server_id:     as.id,
      });
      animalesBajados++;
    } else {
      // Actualizar server_id si no lo tenía
      if (!existe.server_id) {
        await db.animales.update(existe.id, { server_id: as.id });
      }
    }

    // Bajar pesajes del servidor para este animal
    try {
      const animalLocal = await db.animales.where('caravana').equals(as.caravana).first();
      if (!animalLocal) continue;

      const { data: pesajesServer } = await api.get(`/animales/${as.id}/pesajes`);
      for (const ps of pesajesServer) {
        const existePesaje = await db.pesajes
          .where('server_id').equals(ps.id).first();
        if (!existePesaje) {
          await db.pesajes.add({
            animal_id:   animalLocal.id,
            peso:        ps.peso,
            fecha:       ps.fecha_pesaje,
            diferencia:  null,
            sincronizado: 1,
            server_id:   ps.id,
          });
          pesajesBajados++;
        }
      }

      // Bajar eventos
      const { data: eventosServer } = await api.get(`/animales/${as.id}/eventos`);
      for (const ev of eventosServer) {
        const existeEvento = await db.eventos
          .where('[animal_id+fecha]')
          .equals([animalLocal.id, ev.fecha])
          .first()
          .catch(() => null);

        // Fallback: buscar por descripción y animal
        const existe2 = await db.eventos
          .filter(e => e.animal_id === animalLocal.id && e.descripcion === ev.descripcion)
          .first();

        if (!existeEvento && !existe2) {
          await db.eventos.add({
            animal_id:   animalLocal.id,
            tipo:        ev.tipo,
            descripcion: ev.descripcion,
            fecha:       ev.fecha,
            sincronizado: 1,
          });
          eventosBajados++;
        }
      }
    } catch { /* si falla un animal puntual, continuar */ }
  }

  return { animalesBajados, pesajesBajados, eventosBajados };
}

// ── SYNC COMPLETO ──────────────────────────────────────────────
export async function sincronizarTodo() {
  const pushAnim   = await pushAnimalesPendientes();
  const pushPes    = await pushPesajesPendientes();
  const pushEv     = await pushEventosPendientes();
  const pull       = await pullDesdeServidor();
  return { pushAnim, pushPes, pushEv, pull };
}