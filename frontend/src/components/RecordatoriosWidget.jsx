import React, { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bell, CheckCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const hoy = () => new Date().toISOString().split('T')[0];

const diasRestantes = (fechaStr) => {
  const hoyDate  = new Date(hoy() + 'T12:00:00');
  const fechaDate = new Date(fechaStr + 'T12:00:00');
  return Math.round((fechaDate - hoyDate) / 86400000);
};

const etiquetaDias = (dias) => {
  if (dias < 0)  return { texto: `Hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`, color: 'text-red-500',    bg: 'bg-red-50',    borde: 'border-red-200' };
  if (dias === 0) return { texto: '¡Hoy!',                                                         color: 'text-red-600',    bg: 'bg-red-50',    borde: 'border-red-300' };
  if (dias <= 3)  return { texto: `En ${dias} día${dias !== 1 ? 's' : ''}`,                         color: 'text-orange-500', bg: 'bg-orange-50', borde: 'border-orange-200' };
  if (dias <= 7)  return { texto: `En ${dias} días`,                                                color: 'text-amber-500',  bg: 'bg-amber-50',  borde: 'border-amber-200' };
  return           { texto: `En ${dias} días`,                                                      color: 'text-[#1D5E4D]',  bg: 'bg-[#EAF4F0]', borde: 'border-[#c8e6de]' };
};

// ── Badge exportable para usar en la barra de navegación ──────
export const RecordatoriosBadge = () => {
  const count = useLiveQuery(async () => {
    const limite = new Date();
    limite.setDate(limite.getDate() + 7);
    const limiteStr = limite.toISOString().split('T')[0];
    return db.recordatorios
      .filter(r => !r.completado && r.fecha_programada <= limiteStr)
      .count();
  }, []);

  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow">
      {count > 9 ? '9+' : count}
    </span>
  );
};

// ── Widget principal ───────────────────────────────────────────
const RecordatoriosWidget = () => {
  const [expandido, setExpandido] = useState(true);
  const [soloProximos, setSoloProximos] = useState(true);

  const recordatorios = useLiveQuery(async () => {
    const todos = await db.recordatorios
      .filter(r => !r.completado)
      .toArray();

    // Enriquecer con caravana del animal
    const enriquecidos = await Promise.all(
      todos.map(async r => {
        const animal = await db.animales.get(r.animal_id);
        return { ...r, caravana: animal?.caravana ?? `Animal #${r.animal_id}` };
      })
    );

    // Ordenar por fecha
    return enriquecidos.sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada));
  }, []);

  const filtrados = soloProximos
    ? (recordatorios ?? []).filter(r => diasRestantes(r.fecha_programada) <= 7)
    : (recordatorios ?? []);

  const totalProximos = (recordatorios ?? []).filter(r => diasRestantes(r.fecha_programada) <= 7).length;
  const totalVencidos = (recordatorios ?? []).filter(r => diasRestantes(r.fecha_programada) < 0).length;

  const marcarCompletado = async (id) => {
    await db.recordatorios.update(id, { completado: true });
  };

  const eliminar = async (id) => {
    await db.recordatorios.delete(id);
  };

  if (!recordatorios) return null;
  if (recordatorios.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">

      {/* Header del widget */}
      <button
        onClick={() => setExpandido(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Bell size={18} className="text-[#8B5CF6]"/>
            </div>
            {totalProximos > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                {totalProximos}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-[#2F3E3B]">Recordatorios</p>
            <p className="text-[10px] text-[#A69C8A]">
              {totalVencidos > 0
                ? `${totalVencidos} vencido${totalVencidos !== 1 ? 's' : ''} · ${recordatorios.length} total`
                : `${recordatorios.length} pendiente${recordatorios.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>
        {expandido ? <ChevronUp size={18} className="text-[#A69C8A]"/> : <ChevronDown size={18} className="text-[#A69C8A]"/>}
      </button>

      {/* Lista */}
      {expandido && (
        <div className="border-t border-gray-50">

          {/* Filtro */}
          {recordatorios.length > 0 && (
            <div className="flex gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <button
                onClick={() => setSoloProximos(true)}
                className={`px-3 py-1 rounded-full text-[11px] font-black transition-all ${soloProximos ? 'bg-[#8B5CF6] text-white' : 'bg-white text-[#A69C8A] border border-gray-200'}`}
              >
                Próximos 7 días {totalProximos > 0 ? `(${totalProximos})` : ''}
              </button>
              <button
                onClick={() => setSoloProximos(false)}
                className={`px-3 py-1 rounded-full text-[11px] font-black transition-all ${!soloProximos ? 'bg-[#8B5CF6] text-white' : 'bg-white text-[#A69C8A] border border-gray-200'}`}
              >
                Todos ({recordatorios.length})
              </button>
            </div>
          )}

          {filtrados.length === 0 ? (
            <div className="px-5 py-6 text-center text-[#A69C8A]">
              <p className="text-2xl mb-1">✅</p>
              <p className="text-xs font-semibold">Sin recordatorios en los próximos 7 días</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtrados.map(r => {
                const dias  = diasRestantes(r.fecha_programada);
                const etiq  = etiquetaDias(dias);
                const emoji = r.tipo === 'vacuna' ? '💉' : '🩺';
                return (
                  <div key={r.id} className={`flex items-center gap-3 px-4 py-3.5 ${etiq.bg}`}>
                    <span className="text-xl flex-shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${etiq.color} ${etiq.borde} bg-white`}>
                          {etiq.texto}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#2F3E3B] truncate">{r.descripcion}</p>
                      <p className="text-[10px] text-[#A69C8A] mt-0.5">
                        🐄 {r.caravana} · {new Date(r.fecha_programada + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {/* Acciones */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => marcarCompletado(r.id)}
                        className="p-2 bg-green-50 rounded-xl text-green-600 active:scale-90 transition-all"
                        title="Marcar como hecho"
                      >
                        <CheckCircle size={16}/>
                      </button>
                      <button
                        onClick={() => eliminar(r.id)}
                        className="p-2 bg-red-50 rounded-xl text-red-400 active:scale-90 transition-all"
                        title="Eliminar recordatorio"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordatoriosWidget;