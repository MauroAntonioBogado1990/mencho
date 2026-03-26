import React, { useState } from 'react';
import { db, TIPOS_EVENTO, ESPECIES_RAZAS } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ChevronRight, TrendingUp, TrendingDown, Minus, MapPin,
  Calendar, FileText, Scale, Pencil, Trash2, X, Save,
  CheckCircle, Syringe, StickyNote, MoveRight, ChevronDown, Bell
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────
const especieEmoji = (e) => {
  if (!e) return '🐄';
  const l = e.toLowerCase();
  if (l.includes('oveja'))  return '🐑';
  if (l.includes('búfalo') || l.includes('bufalo')) return '🦬';
  if (l.includes('caballo')) return '🐴';
  if (l.includes('cerdo'))  return '🐷';
  return '🐄';
};
const fmt  = (iso) => !iso ? '—' : new Date(iso).toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' });
const fmtH = (iso) => !iso ? '' : new Date(iso).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });

// ── Modal Registrar Evento ─────────────────────────────────────
const EventoModal = ({ animal, onClose }) => {
  const [tipo, setTipo]               = useState('vacuna');
  const [descripcion, setDesc]        = useState('');
  const [loteDestino, setLoteDest]    = useState('');
  const [guardado, setGuardado]       = useState(false);

  // Recordatorio
  const [agregarRecordatorio, setAgregarRec] = useState(false);
  const [fechaProxima, setFechaProxima]      = useState('');
  const [descRec, setDescRec]                = useState('');

  const lotes = useLiveQuery(() => db.lotes.toArray(), []);

  // Cuando cambia el tipo, resetear recordatorio si no aplica
  const handleTipo = (t) => {
    setTipo(t);
    if (t !== 'vacuna' && t !== 'tratamiento') {
      setAgregarRec(false);
      setFechaProxima('');
      setDescRec('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let desc = descripcion.trim();

    if (tipo === 'cambio_lote') {
      const lote = lotes?.find(l => l.id === parseInt(loteDestino));
      desc = lote ? `Movido al lote: ${lote.nombre}` : 'Cambio de lote';
      await db.animales.update(animal.id, { lote_id: loteDestino ? parseInt(loteDestino) : null, sincronizado: 0 });
    }

    await db.eventos.add({
      animal_id:    animal.id,
      tipo,
      descripcion:  desc,
      fecha:        new Date().toISOString(),
      sincronizado: 0,
    });

    // Guardar recordatorio si el usuario lo activó
    if (agregarRecordatorio && fechaProxima && (tipo === 'vacuna' || tipo === 'tratamiento')) {
      const descFinal = descRec.trim() || `Próxima aplicación: ${desc}`;
      await db.recordatorios.add({
        animal_id:        animal.id,
        tipo,
        descripcion:      descFinal,
        fecha_programada: fechaProxima,   // 'YYYY-MM-DD'
        completado:       false,
      });
    }

    setGuardado(true);
    setTimeout(() => { setGuardado(false); onClose(); }, 1200);
  };

  const puedeRecordatorio = tipo === 'vacuna' || tipo === 'tratamiento';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60]">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-[#1D5E4D] italic">Nuevo Evento</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-[#A69C8A]"><X size={18}/></button>
        </div>
        <div className="px-6 py-5 max-h-[85vh] overflow-y-auto">
          {guardado ? (
            <div className="flex flex-col items-center py-10 text-[#1D5E4D]">
              <CheckCircle size={60}/>
              <p className="mt-3 font-black text-lg">Evento registrado</p>
              {agregarRecordatorio && fechaProxima && (
                <p className="text-sm text-[#A69C8A] mt-1 flex items-center gap-1">
                  <Bell size={14}/> Recordatorio guardado para {new Date(fechaProxima + 'T12:00:00').toLocaleDateString('es-AR', { day:'2-digit', month:'short' })}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Tipo */}
              <div>
                <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Tipo de Evento</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TIPOS_EVENTO).map(([key, val]) => (
                    <button key={key} type="button"
                      onClick={() => handleTipo(key)}
                      className={`p-3 rounded-xl border-2 text-sm font-bold flex items-center gap-2 transition-all ${
                        tipo === key ? 'border-[#1D5E4D] bg-[#EAF4F0] text-[#1D5E4D]' : 'border-gray-100 bg-gray-50 text-[#A69C8A]'
                      }`}>
                      <span>{val.emoji}</span>{val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lote destino */}
              {tipo === 'cambio_lote' && (
                <div>
                  <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Lote Destino</label>
                  <div className="relative">
                    <select className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 outline-none font-semibold appearance-none pr-10"
                      value={loteDestino} onChange={e => setLoteDest(e.target.value)} required>
                      <option value="">Sin lote</option>
                      {lotes?.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A69C8A] pointer-events-none"/>
                  </div>
                </div>
              )}

              {/* Descripción */}
              {tipo !== 'cambio_lote' && (
                <div>
                  <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">
                    {tipo === 'vacuna' ? 'Nombre de la vacuna / dosis' : 'Descripción'}
                  </label>
                  <input type="text" required
                    className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none font-semibold"
                    placeholder={tipo === 'vacuna' ? 'Ej: Aftosa 2ml, Brucelosis...' : 'Describí el evento...'}
                    value={descripcion} onChange={e => setDesc(e.target.value)}/>
                </div>
              )}

              {/* ── Sección Recordatorio (solo vacuna/tratamiento) ── */}
              {puedeRecordatorio && (
                <div className={`rounded-2xl border-2 transition-all ${agregarRecordatorio ? 'border-[#8B5CF6] bg-purple-50' : 'border-gray-100 bg-gray-50'}`}>
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => setAgregarRec(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Bell size={16} className={agregarRecordatorio ? 'text-[#8B5CF6]' : 'text-[#A69C8A]'}/>
                      <span className={`text-sm font-black ${agregarRecordatorio ? 'text-[#8B5CF6]' : 'text-[#A69C8A]'}`}>
                        Programar próxima aplicación
                      </span>
                    </div>
                    {/* Switch visual */}
                    <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${agregarRecordatorio ? 'bg-[#8B5CF6]' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${agregarRecordatorio ? 'translate-x-5' : 'translate-x-0'}`}/>
                    </div>
                  </button>

                  {/* Campos del recordatorio */}
                  {agregarRecordatorio && (
                    <div className="px-4 pb-4 space-y-3 border-t border-purple-100 pt-3">
                      <div>
                        <label className="block text-xs font-bold text-[#8B5CF6] uppercase tracking-wider mb-1.5">
                          Fecha de próxima aplicación *
                        </label>
                        <input
                          type="date"
                          required={agregarRecordatorio}
                          value={fechaProxima}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setFechaProxima(e.target.value)}
                          className="w-full p-3.5 border-2 border-purple-200 rounded-xl bg-white focus:border-[#8B5CF6] outline-none font-semibold text-sm"
                        />
                        <p className="text-[10px] text-[#A69C8A] mt-1">
                          Recibirás un aviso 7 días antes en la pantalla de inicio.
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#8B5CF6] uppercase tracking-wider mb-1.5">
                          Nota del recordatorio (opcional)
                        </label>
                        <input
                          type="text"
                          value={descRec}
                          onChange={e => setDescRec(e.target.value)}
                          placeholder={`Ej: Segunda dosis ${descripcion || tipo}`}
                          className="w-full p-3.5 border-2 border-purple-200 rounded-xl bg-white focus:border-[#8B5CF6] outline-none font-semibold text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button type="submit"
                className="w-full bg-[#1D5E4D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                <Save size={18}/> Guardar Evento
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Modal Editar Animal ────────────────────────────────────────
const EditarAnimalModal = ({ animal, onClose }) => {
  const [especie, setEspecie]         = useState(animal.especie || 'Vaca');
  const [raza, setRaza]               = useState(animal.raza || '');
  const [ubicacion, setUbicacion]     = useState(animal.ubicacion || '');
  const [observaciones, setObs]       = useState(animal.observaciones || '');
  const [especieCustom, setEspCu]     = useState('');
  const [razaCustom, setRazaCu]       = useState('');
  const [showEspCu, setShowEspCu]     = useState(false);
  const [showRazaCu, setShowRazaCu]   = useState(false);
  const [loteId, setLoteId]           = useState(animal.lote_id ? String(animal.lote_id) : '');
  const [guardado, setGuardado]       = useState(false);
  const lotes = useLiveQuery(() => db.lotes.toArray(), []);

  const especiesDisponibles = [...Object.keys(ESPECIES_RAZAS), 'Otra especie...'];
  const razasDisponibles = ESPECIES_RAZAS[especie] ? [...ESPECIES_RAZAS[especie], 'Otra raza...'] : ['Otra raza...'];

  const handleEspecie = (v) => {
    if (v === 'Otra especie...') { setShowEspCu(true); setEspecie(''); }
    else { setShowEspCu(false); setEspecie(v); setRaza(''); setShowRazaCu(false); }
  };
  const handleRaza = (v) => {
    if (v === 'Otra raza...') { setShowRazaCu(true); setRaza(''); }
    else { setShowRazaCu(false); setRaza(v); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const especieFinal = showEspCu ? especieCustom : especie;
    const razaFinal    = showRazaCu ? razaCustom : raza;
    const nuevoLoteId  = loteId ? parseInt(loteId) : null;

    if (nuevoLoteId !== (animal.lote_id ?? null)) {
      const loteAnterior = lotes?.find(l => l.id === (animal.lote_id ?? null));
      const loteNuevo    = lotes?.find(l => l.id === nuevoLoteId);
      const desde = loteAnterior ? loteAnterior.nombre : 'Sin lote';
      const hacia = loteNuevo    ? loteNuevo.nombre    : 'Sin lote';
      await db.eventos.add({
        animal_id:    animal.id,
        tipo:         'cambio_lote',
        descripcion:  `Movido de "${desde}" a "${hacia}"`,
        fecha:        new Date().toISOString(),
        sincronizado: 0,
      });
    }

    await db.animales.update(animal.id, {
      especie:       especieFinal,
      raza:          razaFinal,
      ubicacion:     ubicacion.trim() || null,
      observaciones: observaciones.trim() || null,
      lote_id:       nuevoLoteId,
      sincronizado:  0,
    });
    setGuardado(true);
    setTimeout(() => { setGuardado(false); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60]">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#1D5E4D] italic">Editar Animal</h2>
            <p className="text-[11px] text-[#A69C8A] font-mono">{animal.caravana}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-[#A69C8A]"><X size={18}/></button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          {guardado ? (
            <div className="flex flex-col items-center py-10 text-[#1D5E4D]">
              <CheckCircle size={60}/><p className="mt-3 font-black text-lg">Cambios guardados</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Especie</label>
                <div className="relative">
                  <select className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 outline-none font-semibold appearance-none pr-10"
                    value={showEspCu ? 'Otra especie...' : especie} onChange={e => handleEspecie(e.target.value)}>
                    {especiesDisponibles.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A69C8A] pointer-events-none"/>
                </div>
                {showEspCu && <input type="text" required className="mt-2 w-full p-3 border-2 border-[#E67E22]/40 rounded-xl bg-[#FDF1E3] outline-none text-sm font-semibold" placeholder="Nueva especie..." value={especieCustom} onChange={e => setEspCu(e.target.value)}/>}
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Raza</label>
                <div className="relative">
                  <select className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 outline-none font-semibold appearance-none pr-10"
                    value={showRazaCu ? 'Otra raza...' : raza} onChange={e => handleRaza(e.target.value)}>
                    <option value="">Sin raza</option>
                    {razasDisponibles.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A69C8A] pointer-events-none"/>
                </div>
                {showRazaCu && <input type="text" className="mt-2 w-full p-3 border-2 border-[#E67E22]/40 rounded-xl bg-[#FDF1E3] outline-none text-sm font-semibold" placeholder="Nueva raza..." value={razaCustom} onChange={e => setRazaCu(e.target.value)}/>}
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Lote Asignado</label>
                <div className="relative">
                  <select className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 outline-none font-semibold appearance-none pr-10"
                    value={loteId} onChange={e => setLoteId(e.target.value)}>
                    <option value="">Sin lote asignado</option>
                    {lotes?.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A69C8A] pointer-events-none"/>
                </div>
                {loteId !== (animal.lote_id ? String(animal.lote_id) : '') && (
                  <p className="text-[11px] text-[#E67E22] font-bold mt-1.5 flex items-center gap-1">
                    ⚠ Se registrará un evento de cambio de lote al guardar
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Ubicación / Potrero</label>
                <input type="text" className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none font-semibold"
                  placeholder="Potrero Norte, Zona del río..." value={ubicacion} onChange={e => setUbicacion(e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Observaciones</label>
                <textarea rows={3} className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none resize-none text-sm font-medium"
                  placeholder="Notas, estado, tratamientos..." value={observaciones} onChange={e => setObs(e.target.value)}/>
              </div>
              <button type="submit" className="w-full bg-[#1D5E4D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                <Save size={18}/> Guardar Cambios
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Confirmar Eliminar ─────────────────────────────────────────
const ConfirmarEliminar = ({ animal, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
      <p className="text-4xl mb-3">⚠️</p>
      <h3 className="text-lg font-black text-gray-900">¿Eliminar {animal.caravana}?</h3>
      <p className="text-sm text-[#A69C8A] mt-2 mb-6">Se borrarán todos sus pesajes y eventos. Esta acción no se puede deshacer.</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-gray-100 font-bold text-gray-600 active:scale-95 transition-all">Cancelar</button>
        <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black active:scale-95 transition-all">Eliminar</button>
      </div>
    </div>
  </div>
);

// ── Componente principal ───────────────────────────────────────
const AnimalDetalle = ({ animal: animalProp, onClose, onNuevoPesaje, onEliminado }) => {
  const [tab, setTab]               = useState('pesajes');
  const [showEditar, setShowEditar] = useState(false);
  const [showEvento, setShowEvento] = useState(false);
  const [showConfDel, setShowConfDel] = useState(false);

  const animal = useLiveQuery(
    () => animalProp ? db.animales.get(animalProp.id) : null,
    [animalProp?.id]
  ) ?? animalProp;

  const pesajes = useLiveQuery(
    () => animalProp ? db.pesajes.where('animal_id').equals(animalProp.id).sortBy('fecha') : [],
    [animalProp?.id]
  );

  const eventos = useLiveQuery(
    () => animalProp ? db.eventos.where('animal_id').equals(animalProp.id).sortBy('fecha') : [],
    [animalProp?.id]
  );

  const lote = useLiveQuery(
    () => animal?.lote_id ? db.lotes.get(animal.lote_id) : null,
    [animal?.lote_id]
  );

  if (!animal) return null;

  const pesajesOrdenados = [...(pesajes || [])].reverse();
  const eventosOrdenados = [...(eventos || [])].reverse();
  const pesoIngreso   = pesajes?.length > 0 ? pesajes[0].peso : null;
  const gananciaTotal = pesoIngreso !== null ? animal.peso_actual - pesoIngreso : 0;
  const dias  = animal.fecha_ingreso ? Math.floor((Date.now() - new Date(animal.fecha_ingreso)) / 86400000) : null;
  const gdpg  = dias > 0 && gananciaTotal !== 0 ? (gananciaTotal / dias).toFixed(2) : null;

  const handleEliminar = async () => {
    await db.pesajes.where('animal_id').equals(animal.id).delete();
    await db.eventos.where('animal_id').equals(animal.id).delete();
    await db.recordatorios.where('animal_id').equals(animal.id).delete();
    await db.animales.delete(animal.id);
    onEliminado?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#F4F1ED] z-50 overflow-y-auto">

      {/* Header */}
      <div className="bg-white px-5 pt-10 pb-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onClose} className="p-2.5 bg-gray-100 rounded-full text-[#1D5E4D]">
            <ChevronRight size={20} className="rotate-180"/>
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-[#A69C8A] uppercase tracking-wider">Ficha del Animal</p>
            <h1 className="text-2xl font-black font-mono text-[#1D5E4D]">{animal.caravana}</h1>
          </div>
          <button onClick={() => setShowEditar(true)} className="p-2.5 bg-[#EAF4F0] rounded-full text-[#1D5E4D]">
            <Pencil size={18}/>
          </button>
          <button onClick={() => setShowConfDel(true)} className="p-2.5 bg-red-50 rounded-full text-red-400">
            <Trash2 size={18}/>
          </button>
          <span className="text-4xl">{especieEmoji(animal.especie)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {animal.especie && <span className="px-3 py-1 bg-[#EAF4F0] text-[#1D5E4D] text-xs font-bold rounded-full">{animal.especie}</span>}
          {animal.raza    && <span className="px-3 py-1 bg-[#EAF4F0] text-[#1D5E4D] text-xs font-bold rounded-full">{animal.raza}</span>}
          {lote           && <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">🏡 {lote.nombre}</span>}
          {animal.sincronizado === 0 && <span className="px-3 py-1 bg-[#FDF1E3] text-[#E67E22] text-xs font-bold rounded-full">⚠ Sin sync</span>}
        </div>
      </div>

      <div className="p-4 space-y-4 pb-36">

        {/* Peso */}
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
            {gdpg && <p className="text-[10px] opacity-60 mt-0.5">{gdpg} kg/día promedio</p>}
          </div>
        </div>

        {/* Info */}
        {(animal.ubicacion || animal.fecha_ingreso || animal.observaciones) && (
          <div className="bg-white rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black text-[#A69C8A] uppercase tracking-wider">Datos del Animal</h3>
            {animal.ubicacion     && <InfoRow icon={<MapPin size={15}/>}   label="Ubicación"        value={animal.ubicacion}/>}
            {animal.fecha_ingreso && <InfoRow icon={<Calendar size={15}/>} label="Fecha de ingreso"  value={`${fmt(animal.fecha_ingreso)}${dias !== null ? ` · hace ${dias} días` : ''}`}/>}
            {animal.observaciones && <InfoRow icon={<FileText size={15}/>} label="Observaciones"    value={animal.observaciones}/>}
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm">
          {[
            { id: 'pesajes', label: `Pesajes (${pesajesOrdenados.length})`, icon: <Scale size={15}/> },
            { id: 'eventos', label: `Eventos (${eventosOrdenados.length})`,  icon: <StickyNote size={15}/> },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t.id ? 'bg-[#1D5E4D] text-white shadow' : 'text-[#A69C8A]'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Tab: Pesajes */}
        {tab === 'pesajes' && (
          <div className="bg-white rounded-2xl p-5">
            {pesajesOrdenados.length === 0 ? (
              <div className="text-center py-6 text-[#A69C8A]">
                <p className="text-3xl mb-2">⚖️</p>
                <p className="text-sm font-semibold">Sin pesajes registrados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pesajesOrdenados.map((p, idx) => {
                  const anterior = pesajesOrdenados[idx + 1];
                  const diff = anterior ? p.peso - anterior.peso : null;
                  const esPrimero = idx === pesajesOrdenados.length - 1;
                  return (
                    <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${esPrimero ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'}`}>
                      <div className={`p-2 rounded-xl flex-shrink-0 ${
                        diff === null ? 'bg-gray-100 text-gray-400'
                        : diff > 0 ? 'bg-green-50 text-green-600'
                        : diff < 0 ? 'bg-red-50 text-red-500'
                        : 'bg-gray-100 text-gray-400'
                      }`}>
                        {diff === null ? <Minus size={15}/> : diff > 0 ? <TrendingUp size={15}/> : <TrendingDown size={15}/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#2F3E3B]">{fmt(p.fecha)}</p>
                        <p className="text-[10px] text-[#A69C8A]">{fmtH(p.fecha)}</p>
                      </div>
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
        )}

        {/* Tab: Eventos */}
        {tab === 'eventos' && (
          <div className="bg-white rounded-2xl p-5">
            {eventosOrdenados.length === 0 ? (
              <div className="text-center py-6 text-[#A69C8A]">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm font-semibold">Sin eventos registrados</p>
                <p className="text-xs mt-1">Registrá vacunas, cambios de lote u observaciones.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {eventosOrdenados.map(ev => {
                  const tipoInfo = TIPOS_EVENTO[ev.tipo] || { emoji: '📝', label: ev.tipo, color: '#A69C8A' };
                  return (
                    <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
                      <span className="text-2xl flex-shrink-0 mt-0.5">{tipoInfo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider" style={{color: tipoInfo.color}}>{tipoInfo.label}</span>
                          {ev.sincronizado === 0 && <span className="text-[9px] bg-[#FDF1E3] text-[#E67E22] font-bold px-1.5 py-0.5 rounded-full">Local</span>}
                        </div>
                        <p className="text-sm font-semibold text-[#2F3E3B]">{ev.descripcion}</p>
                        <p className="text-[10px] text-[#A69C8A] mt-0.5">{fmt(ev.fecha)} · {fmtH(ev.fecha)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botones fijos abajo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg flex gap-3">
        <button onClick={() => setShowEvento(true)}
          className="flex-1 bg-[#8B5CF6] text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
          <Syringe size={18}/> Evento
        </button>
        <button onClick={onNuevoPesaje}
          className="flex-1 bg-[#E67E22] text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
          <Scale size={18}/> Pesaje
        </button>
      </div>

      {showEditar   && <EditarAnimalModal  animal={animal}  onClose={() => setShowEditar(false)}/>}
      {showEvento   && <EventoModal        animal={animal}  onClose={() => setShowEvento(false)}/>}
      {showConfDel  && <ConfirmarEliminar  animal={animal}  onConfirm={handleEliminar} onCancel={() => setShowConfDel(false)}/>}
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