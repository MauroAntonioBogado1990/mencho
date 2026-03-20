import React from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, TrendingUp, TrendingDown, Minus, MapPin, Calendar, FileText, Scale } from 'lucide-react';

const especieEmoji = (e) => {
  if (!e) return '🐄';
  const l = e.toLowerCase();
  if (l.includes('oveja'))  return '🐑';
  if (l.includes('búfalo') || l.includes('bufalo')) return '🦬';
  if (l.includes('caballo')) return '🐴';
  if (l.includes('cerdo'))  return '🐷';
  return '🐄';
};

const formatFecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatHora = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const AnimalDetalle = ({ animal: animalProp, onClose, onNuevoPesaje }) => {
  // Usar useLiveQuery para que el componente se actualice automáticamente al cambiar Dexie
  const animal = useLiveQuery(
    () => animalProp ? db.animales.get(animalProp.id) : null,
    [animalProp?.id]
  ) ?? animalProp; // fallback al prop mientras carga

  const pesajes = useLiveQuery(
    () => animalProp ? db.pesajes.where('animal_id').equals(animalProp.id).sortBy('fecha') : [],
    [animalProp?.id]
  );

  if (!animal) return null;

  // Calcular trazabilidad
  const pesajesOrdenados = [...(pesajes || [])].reverse(); // más reciente primero
  const primerPeso = pesajes?.[0]?.peso ?? animal.peso_actual;
  const gananciaTotal = animal.peso_actual - primerPeso;
  const diasDesdeIngreso = animal.fecha_ingreso
    ? Math.floor((Date.now() - new Date(animal.fecha_ingreso)) / 86400000)
    : null;
  const gdpg = diasDesdeIngreso && diasDesdeIngreso > 0
    ? (gananciaTotal / diasDesdeIngreso).toFixed(2)
    : null;

  return (
    <div className="fixed inset-0 bg-[#F4F1ED] z-50 overflow-y-auto">

      {/* Header */}
      <div className="bg-white px-5 pt-10 pb-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onClose} className="p-2.5 bg-gray-100 rounded-full text-[#1D5E4D]">
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-[#A69C8A] uppercase tracking-wider">Ficha del Animal</p>
            <h1 className="text-2xl font-black font-mono text-[#1D5E4D]">{animal.caravana}</h1>
          </div>
          <span className="text-5xl">{especieEmoji(animal.especie)}</span>
        </div>

        {/* Tags de especie/raza */}
        <div className="flex flex-wrap gap-2">
          {animal.especie && (
            <span className="px-3 py-1 bg-[#EAF4F0] text-[#1D5E4D] text-xs font-bold rounded-full">{animal.especie}</span>
          )}
          {animal.raza && (
            <span className="px-3 py-1 bg-[#EAF4F0] text-[#1D5E4D] text-xs font-bold rounded-full">{animal.raza}</span>
          )}
          {animal.sincronizado === 0 && (
            <span className="px-3 py-1 bg-[#FDF1E3] text-[#E67E22] text-xs font-bold rounded-full">⚠ Sin sync</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">

        {/* Peso actual destacado */}
        <div className="bg-[#1D5E4D] rounded-2xl p-5 text-white flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">Peso Actual</p>
            <p className="text-5xl font-black tracking-tight mt-1">
              {animal.peso_actual}<span className="text-2xl font-normal opacity-60 ml-1">kg</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">Ganancia Total</p>
            <p className={`text-2xl font-black mt-1 ${gananciaTotal >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {gananciaTotal >= 0 ? '+' : ''}{gananciaTotal.toFixed(1)} kg
            </p>
            {gdpg && (
              <p className="text-[10px] opacity-60 mt-0.5">{gdpg} kg/día promedio</p>
            )}
          </div>
        </div>

        {/* Info del animal */}
        <div className="bg-white rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-black text-[#A69C8A] uppercase tracking-wider">Datos del Animal</h3>

          {animal.ubicacion && (
            <InfoRow icon={<MapPin size={16} />} label="Ubicación" value={animal.ubicacion} />
          )}
          {animal.fecha_ingreso && (
            <InfoRow icon={<Calendar size={16} />} label="Fecha de ingreso"
              value={`${formatFecha(animal.fecha_ingreso)}${diasDesdeIngreso !== null ? ` · hace ${diasDesdeIngreso} días` : ''}`} />
          )}
          {animal.observaciones && (
            <InfoRow icon={<FileText size={16} />} label="Observaciones" value={animal.observaciones} />
          )}
          {!animal.ubicacion && !animal.fecha_ingreso && !animal.observaciones && (
            <p className="text-sm text-[#A69C8A]">Sin datos adicionales registrados.</p>
          )}
        </div>

        {/* Historial de pesajes */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-[#A69C8A] uppercase tracking-wider">
              Historial de Pesajes ({pesajesOrdenados.length})
            </h3>
            <Scale size={16} className="text-[#A69C8A]" />
          </div>

          {pesajesOrdenados.length === 0 ? (
            <div className="text-center py-6 text-[#A69C8A]">
              <p className="text-3xl mb-2">⚖️</p>
              <p className="text-sm font-semibold">Sin pesajes registrados</p>
              <p className="text-xs mt-1">Tocá "Nuevo Pesaje" para registrar el primero.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pesajesOrdenados.map((p, idx) => {
                const anterior = pesajesOrdenados[idx + 1];
                const diff = anterior ? p.peso - anterior.peso : (p.diferencia ?? null);
                const esPrimero = idx === pesajesOrdenados.length - 1;

                return (
                  <div key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${esPrimero ? 'bg-gray-50' : 'bg-white'} border border-gray-100`}>

                    {/* Indicador de tendencia */}
                    <div className={`p-2 rounded-xl flex-shrink-0 ${
                      diff === null ? 'bg-gray-100 text-gray-400'
                      : diff > 0 ? 'bg-green-50 text-green-600'
                      : diff < 0 ? 'bg-red-50 text-red-500'
                      : 'bg-gray-100 text-gray-400'
                    }`}>
                      {diff === null ? <Minus size={16} />
                        : diff > 0 ? <TrendingUp size={16} />
                        : diff < 0 ? <TrendingDown size={16} />
                        : <Minus size={16} />}
                    </div>

                    {/* Fecha */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#2F3E3B]">{formatFecha(p.fecha)}</p>
                      <p className="text-[10px] text-[#A69C8A]">{formatHora(p.fecha)}</p>
                    </div>

                    {/* Peso y diferencia */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black text-gray-900">{p.peso} <span className="text-xs font-normal text-gray-400">kg</span></p>
                      {diff !== null && (
                        <p className={`text-[11px] font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                        </p>
                      )}
                      {esPrimero && <p className="text-[10px] text-[#A69C8A]">Ingreso</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Botón flotante nuevo pesaje */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
        <button
          onClick={onNuevoPesaje}
          className="w-full bg-[#E67E22] hover:bg-[#d4700f] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <Scale size={20} /> Registrar Nuevo Pesaje
        </button>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-[#1D5E4D] mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-[10px] font-bold text-[#A69C8A] uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-[#2F3E3B] mt-0.5">{value}</p>
    </div>
  </div>
);

export default AnimalDetalle;