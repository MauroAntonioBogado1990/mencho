import React, { useState } from 'react';
import { db, ESPECIES_RAZAS } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Save, CheckCircle, ChevronDown } from 'lucide-react';

const AddAnimalModal = ({ isOpen, onClose }) => {
  const [caravana, setCaravana]                     = useState('');
  const [peso, setPeso]                             = useState('');
  const [especie, setEspecie]                       = useState('Vaca');
  const [raza, setRaza]                             = useState('');
  const [razaCustom, setRazaCustom]                 = useState('');
  const [mostrarRazaCustom, setMostrarRazaCustom]   = useState(false);
  const [especieCustom, setEspecieCustom]           = useState('');
  const [mostrarEspecieCustom, setMostrarEspecieCustom] = useState(false);
  const [loteId, setLoteId]                         = useState('');
  const [ubicacion, setUbicacion]                   = useState('');
  const [observaciones, setObservaciones]           = useState('');
  const [mensaje, setMensaje]                       = useState(false);

  const lotes = useLiveQuery(() => db.lotes.toArray(), []);

  if (!isOpen) return null;

  const especiesDisponibles = [...Object.keys(ESPECIES_RAZAS), 'Otra especie...'];
  const razasDisponibles = especie && ESPECIES_RAZAS[especie]
    ? [...ESPECIES_RAZAS[especie], 'Otra raza...']
    : ['Otra raza...'];

  const handleEspecieChange = (val) => {
    if (val === 'Otra especie...') {
      setMostrarEspecieCustom(true); setEspecie('');
    } else {
      setMostrarEspecieCustom(false); setEspecie(val);
      setRaza(''); setRazaCustom(''); setMostrarRazaCustom(false);
    }
  };

  const handleRazaChange = (val) => {
    if (val === 'Otra raza...') {
      setMostrarRazaCustom(true); setRaza('');
    } else {
      setMostrarRazaCustom(false); setRaza(val);
    }
  };

  const especieFinal = mostrarEspecieCustom ? especieCustom : especie;
  const razaFinal    = mostrarRazaCustom    ? razaCustom    : raza;

  const reset = () => {
    setCaravana(''); setPeso(''); setEspecie('Vaca');
    setRaza(''); setRazaCustom(''); setEspecieCustom('');
    setMostrarRazaCustom(false); setMostrarEspecieCustom(false);
    setLoteId(''); setUbicacion(''); setObservaciones('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!especieFinal) return alert('Ingresá el nombre de la especie.');
    try {
      await db.animales.add({
        caravana:      caravana.toUpperCase(),
        peso_actual:   parseFloat(peso),
        especie:       especieFinal,
        raza:          razaFinal,
        lote_id:       loteId ? parseInt(loteId) : null,
        ubicacion:     ubicacion.trim() || null,
        observaciones: observaciones.trim() || null,
        fecha_ingreso: new Date().toISOString(),
        sincronizado:  0,
      });
      setMensaje(true);
      setTimeout(() => { setMensaje(false); reset(); onClose(); }, 1500);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-[#1D5E4D] italic">Nuevo Animal</h2>
            <p className="text-[11px] text-[#A69C8A] uppercase tracking-widest font-medium">Registrar en hacienda</p>
          </div>
          <button onClick={onClose} className="text-[#A69C8A] hover:text-[#2F3E3B] p-2 bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[82vh] overflow-y-auto">
          {mensaje ? (
            <div className="flex flex-col items-center py-12 text-[#1D5E4D]">
              <CheckCircle size={64} strokeWidth={2} />
              <p className="mt-4 font-black text-xl text-center">Animal registrado</p>
              <p className="text-sm text-[#A69C8A] mt-1">Guardado localmente</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Caravana */}
              <Field label="N° Caravana">
                <input type="text" required
                  className="input-base text-xl font-mono font-bold uppercase tracking-widest"
                  placeholder="EJ: AB-123"
                  value={caravana} onChange={e => setCaravana(e.target.value)} />
              </Field>

              {/* Especie */}
              <Field label="Especie">
                <SelectBase value={mostrarEspecieCustom ? 'Otra especie...' : especie} onChange={e => handleEspecieChange(e.target.value)}>
                  {especiesDisponibles.map(s => <option key={s}>{s}</option>)}
                </SelectBase>
                {mostrarEspecieCustom && (
                  <input type="text" required className="mt-2 input-custom"
                    placeholder="Nombre de la nueva especie..."
                    value={especieCustom} onChange={e => setEspecieCustom(e.target.value)} />
                )}
              </Field>

              {/* Raza */}
              <Field label="Raza">
                <SelectBase value={mostrarRazaCustom ? 'Otra raza...' : raza} onChange={e => handleRazaChange(e.target.value)}>
                  <option value="">Seleccionar raza...</option>
                  {razasDisponibles.map(r => <option key={r}>{r}</option>)}
                </SelectBase>
                {mostrarRazaCustom && (
                  <input type="text" className="mt-2 input-custom"
                    placeholder="Nombre de la nueva raza..."
                    value={razaCustom} onChange={e => setRazaCustom(e.target.value)} />
                )}
              </Field>

              {/* Lote */}
              <Field label="Asignar a Lote">
                <SelectBase value={loteId} onChange={e => setLoteId(e.target.value)}>
                  <option value="">Sin lote asignado</option>
                  {lotes?.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </SelectBase>
              </Field>

              {/* Ubicación */}
              <Field label="Ubicación / Potrero">
                <input type="text"
                  className="input-base"
                  placeholder="Ej: Potrero Norte, Zona del río..."
                  value={ubicacion} onChange={e => setUbicacion(e.target.value)} />
              </Field>

              {/* Peso */}
              <Field label="Peso Inicial (kg)">
                <div className="relative">
                  <input type="number" required step="0.1" inputMode="decimal"
                    className="input-base text-3xl font-black tracking-tight pr-16"
                    placeholder="0.0"
                    value={peso} onChange={e => setPeso(e.target.value)} />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">kg</span>
                </div>
              </Field>

              {/* Observaciones */}
              <Field label="Observaciones">
                <textarea
                  rows={3}
                  className="input-base resize-none text-sm"
                  placeholder="Notas, estado del animal, tratamientos..."
                  value={observaciones} onChange={e => setObservaciones(e.target.value)} />
              </Field>

              <button type="submit"
                className="w-full bg-[#1D5E4D] hover:bg-[#154639] text-white font-black text-base py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95 mt-2">
                <Save size={20} /> Guardar Animal
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Estilos inline para los campos (evitamos Tailwind dinámico) */}
      <style>{`
        .input-base {
          width: 100%; padding: 1rem; border: 2px solid #f3f4f6;
          border-radius: 0.75rem; background: #f9fafb;
          outline: none; transition: border-color 0.15s;
        }
        .input-base:focus { border-color: #1D5E4D; }
        .input-custom {
          width: 100%; padding: 0.75rem; border: 2px solid rgba(230,126,34,0.3);
          border-radius: 0.75rem; background: #FDF1E3;
          outline: none; font-size: 0.875rem; font-weight: 600;
        }
        .input-custom:focus { border-color: #E67E22; }
      `}</style>
    </div>
  );
};

// Sub-componentes de formulario
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const SelectBase = ({ children, ...props }) => (
  <div className="relative">
    <select className="input-base font-semibold appearance-none pr-10" {...props}>
      {children}
    </select>
    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A69C8A] pointer-events-none" />
  </div>
);

export default AddAnimalModal;