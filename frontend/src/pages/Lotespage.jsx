import React, { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, X, Save, CheckCircle, DoorOpen, ChevronRight, Trash2 } from 'lucide-react';

const LotesPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensaje, setMensaje] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);

  const lotes = useLiveQuery(() => db.lotes.toArray(), []);
  const animales = useLiveQuery(() => db.animales.toArray(), []);

  const handleCrearLote = async (e) => {
    e.preventDefault();
    await db.lotes.add({ nombre, descripcion });
    setMensaje(true);
    setTimeout(() => {
      setMensaje(false);
      setNombre(''); setDescripcion('');
      setShowModal(false);
    }, 1200);
  };

  const handleEliminarLote = async (id) => {
    if (confirm('¿Eliminar este lote? Los animales quedarán sin lote asignado.')) {
      await db.animales.where('lote_id').equals(id).modify({ lote_id: null });
      await db.lotes.delete(id);
      setLoteSeleccionado(null);
    }
  };

  const animalesEnLote = (loteId) => animales?.filter(a => a.lote_id === loteId) || [];

  if (loteSeleccionado) {
    const aLote = animalesEnLote(loteSeleccionado.id);
    return (
      <div className="min-h-screen bg-[#F4F1ED] p-4 pb-28 text-[#2F3E3B]">
        <header className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => setLoteSeleccionado(null)} className="bg-white p-2.5 rounded-full shadow-sm text-[#1D5E4D]">
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#1D5E4D] italic">{loteSeleccionado.nombre}</h1>
            <p className="text-[11px] text-[#A69C8A] font-medium uppercase tracking-widest">{loteSeleccionado.descripcion || 'Sin descripción'}</p>
          </div>
        </header>
        
        <div className="space-y-3">
          {aLote.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-[#A69C8A]">
              <p className="text-4xl mb-3">🐄</p>
              <p className="font-bold">Este lote está vacío</p>
              <p className="text-sm mt-1">Asigná animales al crear o editar un animal.</p>
            </div>
          ) : aLote.map(animal => (
            <div key={animal.id} className="bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-[#A69C8A] uppercase">Caravana</span>
                  <p className="text-lg font-mono font-bold text-[#1D5E4D]">{animal.caravana}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#A69C8A] uppercase">{animal.especie}</span>
                  <p className="text-sm font-semibold text-gray-600">{animal.raza || '—'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#A69C8A] uppercase">Peso</span>
                  <p className="text-xl font-black text-gray-900">{animal.peso_actual} <span className="text-xs font-normal text-gray-400">kg</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1ED] p-4 pb-28 text-[#2F3E3B]">
      <header className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-black text-[#1D5E4D] italic tracking-tight">Mencho<span className="text-[#E67E22]">.</span></h1>
          <p className="text-[11px] text-[#A69C8A] font-medium uppercase tracking-widest -mt-1">Mis Lotes</p>
        </div>
      </header>

      <div className="space-y-3">
        {!lotes || lotes.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-[#A69C8A]">
            <p className="text-5xl mb-3">🌿</p>
            <p className="font-bold text-lg">Sin lotes creados</p>
            <p className="text-sm mt-1">Creá un lote para organizar tu hacienda.</p>
          </div>
        ) : lotes.map(lote => {
          const count = animalesEnLote(lote.id).length;
          return (
            <div
              key={lote.id}
              className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer hover:border-[#1D5E4D]/20 border-2 border-transparent active:scale-[0.98] transition-all"
              onClick={() => setLoteSeleccionado(lote)}
            >
              <div className="p-3 bg-[#EAF4F0] rounded-xl text-[#1D5E4D]">
                <DoorOpen size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[#1D5E4D] text-lg">{lote.nombre}</h3>
                <p className="text-xs text-[#A69C8A]">{lote.descripcion || 'Sin descripción'}</p>
              </div>
              <div className="text-right mr-2">
                <p className="text-2xl font-black text-gray-800">{count}</p>
                <p className="text-[10px] text-[#A69C8A] uppercase font-bold">animales</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleEliminarLote(lote.id); }}
                className="p-2 text-red-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-[#1D5E4D] hover:bg-[#154639] text-white p-5 rounded-full shadow-2xl active:scale-95 transition-transform"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-black text-[#1D5E4D] italic">Nuevo Lote</h2>
              <button onClick={() => setShowModal(false)} className="text-[#A69C8A] p-2 bg-gray-100 rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              {mensaje ? (
                <div className="flex flex-col items-center py-10 text-[#1D5E4D]">
                  <CheckCircle size={60} />
                  <p className="mt-4 font-black text-xl">¡Lote creado!</p>
                </div>
              ) : (
                <form onSubmit={handleCrearLote} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Nombre del Lote</label>
                    <input
                      type="text" required
                      className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-lg font-bold"
                      placeholder="Ej: Lote Norte, Potrero 3..."
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Descripción (opcional)</label>
                    <input
                      type="text"
                      className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-base"
                      placeholder="Ej: Zona de pastoreo cerca del río..."
                      value={descripcion}
                      onChange={e => setDescripcion(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#1D5E4D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <Save size={20} /> Crear Lote
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotesPage;