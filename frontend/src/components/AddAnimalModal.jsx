import React, { useState } from 'react';
import { db, ESPECIES_RAZAS } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Save, CheckCircle, ChevronDown } from 'lucide-react';

const AddAnimalModal = ({ isOpen, onClose }) => {
  const [caravana, setCaravana] = useState('');
  const [peso, setPeso] = useState('');
  const [especie, setEspecie] = useState('Vaca');
  const [raza, setRaza] = useState('');
  const [razaCustom, setRazaCustom] = useState('');
  const [mostrarRazaCustom, setMostrarRazaCustom] = useState(false);
  const [especieCustom, setEspecieCustom] = useState('');
  const [mostrarEspecieCustom, setMostrarEspecieCustom] = useState(false);
  const [loteId, setLoteId] = useState('');
  const [mensaje, setMensaje] = useState(false);

  const lotes = useLiveQuery(() => db.lotes.toArray(), []);

  if (!isOpen) return null;

  const especiesDisponibles = [...Object.keys(ESPECIES_RAZAS), 'Otra especie...'];
  const razasDisponibles = especie && ESPECIES_RAZAS[especie]
    ? [...ESPECIES_RAZAS[especie], 'Otra raza...']
    : ['Otra raza...'];

  const handleEspecieChange = (val) => {
    if (val === 'Otra especie...') {
      setMostrarEspecieCustom(true);
      setEspecie('');
    } else {
      setMostrarEspecieCustom(false);
      setEspecie(val);
      setRaza('');
      setRazaCustom('');
      setMostrarRazaCustom(false);
    }
  };

  const handleRazaChange = (val) => {
    if (val === 'Otra raza...') {
      setMostrarRazaCustom(true);
      setRaza('');
    } else {
      setMostrarRazaCustom(false);
      setRaza(val);
    }
  };

  const especieFinal = mostrarEspecieCustom ? especieCustom : especie;
  const razaFinal = mostrarRazaCustom ? razaCustom : raza;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!especieFinal) return alert('Ingresa el nombre de la especie.');

    try {
      await db.animales.add({
        caravana: caravana.toUpperCase(),
        peso_actual: parseFloat(peso),
        especie: especieFinal,
        raza: razaFinal,
        lote_id: loteId ? parseInt(loteId) : null,
        sincronizado: 0,
      });

      setMensaje(true);
      setTimeout(() => {
        setMensaje(false);
        setCaravana(''); setPeso(''); setEspecie('Vaca');
        setRaza(''); setRazaCustom(''); setEspecieCustom('');
        setMostrarRazaCustom(false); setMostrarEspecieCustom(false);
        setLoteId('');
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-[#1D5E4D] italic">Nuevo Animal</h2>
            <p className="text-[11px] text-[#A69C8A] uppercase tracking-widest font-medium">Registrar en hacienda</p>
          </div>
          <button onClick={onClose} className="text-[#A69C8A] hover:text-[#2F3E3B] p-2 bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          {mensaje ? (
            <div className="flex flex-col items-center py-12 text-[#1D5E4D]">
              <CheckCircle size={64} strokeWidth={2} />
              <p className="mt-4 font-black text-xl text-center">Animal registrado</p>
              <p className="text-sm text-[#A69C8A] mt-1">Guardado en el dispositivo</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">N° Caravana</label>
                <input
                  type="text" required
                  className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-xl font-mono font-bold uppercase tracking-widest"
                  placeholder="EJ: AB-123"
                  value={caravana}
                  onChange={e => setCaravana(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Especie</label>
                <div className="relative">
                  <select
                    className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-base font-semibold appearance-none pr-10"
                    value={mostrarEspecieCustom ? 'Otra especie...' : especie}
                    onChange={e => handleEspecieChange(e.target.value)}
                  >
                    {especiesDisponibles.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A69C8A] pointer-events-none" />
                </div>
                {mostrarEspecieCustom && (
                  <input
                    type="text" required
                    className="mt-2 w-full p-3 border-2 border-[#E67E22]/40 rounded-xl bg-[#FDF1E3] focus:border-[#E67E22] outline-none text-sm font-semibold"
                    placeholder="Nombre de la nueva especie..."
                    value={especieCustom}
                    onChange={e => setEspecieCustom(e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Raza</label>
                <div className="relative">
                  <select
                    className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-base font-semibold appearance-none pr-10"
                    value={mostrarRazaCustom ? 'Otra raza...' : raza}
                    onChange={e => handleRazaChange(e.target.value)}
                  >
                    <option value="">Seleccionar raza...</option>
                    {razasDisponibles.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A69C8A] pointer-events-none" />
                </div>
                {mostrarRazaCustom && (
                  <input
                    type="text"
                    className="mt-2 w-full p-3 border-2 border-[#E67E22]/40 rounded-xl bg-[#FDF1E3] focus:border-[#E67E22] outline-none text-sm font-semibold"
                    placeholder="Nombre de la nueva raza..."
                    value={razaCustom}
                    onChange={e => setRazaCustom(e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Asignar a Lote</label>
                <div className="relative">
                  <select
                    className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-base font-semibold appearance-none pr-10"
                    value={loteId}
                    onChange={e => setLoteId(e.target.value)}
                  >
                    <option value="">Sin lote asignado</option>
                    {lotes?.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A69C8A] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">Peso Inicial (kg)</label>
                <div className="relative">
                  <input
                    type="number" required step="0.1" inputMode="decimal"
                    className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-3xl font-black tracking-tight pr-16"
                    placeholder="0.0"
                    value={peso}
                    onChange={e => setPeso(e.target.value)}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">kg</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1D5E4D] hover:bg-[#154639] text-white font-black text-base py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95 mt-2"
              >
                <Save size={20} /> Guardar Animal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddAnimalModal;