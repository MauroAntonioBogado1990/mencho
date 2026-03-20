import React, { useState } from 'react';
import { db } from '../db/db';
import { X, Save, TrendingUp, CheckCircle } from 'lucide-react';

const AddWeighingModal = ({ isOpen, onClose, animal }) => {
  const [nuevoPeso, setNuevoPeso] = useState('');
  const [mensaje, setMensaje] = useState(false);

  // No renderizar si no hay modal abierto o animal seleccionado
  if (!isOpen || !animal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pesoValue = parseFloat(nuevoPeso);

    if (!pesoValue || pesoValue <= 0) {
        alert("Por favor, ingrese un peso válido.");
        return;
    }
    
    try {
      // 1. Calculamos la diferencia (Dato Senior para mostrar después)
      const diferencia = pesoValue - animal.peso_actual;
      const fecha = new Date().toISOString(); // Fecha actual

      // --- OPERACIÓN SENIOR: TRANSACCIÓN EN DEXIE ---
      // Usamos una transacción para asegurar integridad: o se guardan ambos o ninguno.
      await db.transaction('rw', db.pesajes, db.animales, async () => {
        
        // A. Insertar el Pesaje
        await db.pesajes.add({
          animal_id: animal.id,
          caravana: animal.caravana,
          peso: pesoValue,
          fecha: fecha,
          diferencia: diferencia,
          sincronizado: 0 // Pendiente de subir a FastAPI
        });

        // B. Actualizar el Peso Actual en el Animal
        await db.animales.update(animal.id, {
          peso_actual: pesoValue,
          sincronizado: 0 // Marcar animal también como pendiente de sync
        });
      });

      // Feedback visual y cierre
      setMensaje(true);
      setTimeout(() => {
        setMensaje(false);
        setNuevoPeso('');
        onClose();
      }, 1500);

    } catch (error) {
      console.error("Error al registrar pesaje local:", error);
      alert("Error al guardar localmente.");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2F3E3B]/70 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 transition-opacity">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
        
        <div className="flex justify-between items-center mb-6">
          <div className='flex items-center gap-2 text-[#1D5E4D]'>
              <TrendingUp size={22} className='text-[#E67E22]'/>
              <h2 className="text-xl font-black italic">Nuevo Pesaje</h2>
          </div>
          <button onClick={onClose} className="text-[#A69C8A] hover:text-[#2F3E3B] p-1.5 bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {mensaje ? (
          <div className="flex flex-col items-center py-10 text-[#1D5E4D] animate-pulse">
            <CheckCircle size={64} strokeWidth={2.5}/>
            <p className="mt-4 font-black text-xl text-center">Peso registrado en {animal.caravana}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Info del Animal (Solo lectura) */}
            <div className="bg-[#F4F1ED] p-4 rounded-xl flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-bold text-[#A69C8A] uppercase tracking-wider">Caravana</span>
                    <h3 className="text-2xl font-mono font-bold text-[#1D5E4D] -mt-1">{animal.caravana}</h3>
                </div>
                <div className='text-right'>
                    <span className="text-[10px] font-bold text-[#A69C8A] uppercase tracking-wider">Peso Anterior</span>
                    <p className="text-xl font-bold text-gray-500">{animal.peso_actual} kg</p>
                </div>
            </div>

            {/* Input Grande (Tipo NX) */}
            <div>
              <label className="block text-sm font-bold text-[#2F3E3B] mb-2">Peso Actual en Balanza (kg)</label>
              <div className='relative'>
                <input 
                    type="number" 
                    required
                    step="0.1"
                    inputMode='decimal' // Mejor teclado numérico en móvil
                    className="w-full p-5 border-2 border-[#1D5E4D]/10 rounded-2xl bg-gray-50 focus:border-[#1D5E4D] focus:ring-1 focus:ring-[#1D5E4D]/30 outline-none text-3xl font-black tracking-tight"
                    placeholder="0.0"
                    value={nuevoPeso}
                    onChange={(e) => setNuevoPeso(e.target.value)}
                    autoFocus
                />
                <span className='absolute right-5 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400'>kg</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#1D5E4D] hover:bg-[#154639] text-white font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95"
            >
              <Save size={22} /> Guardar Pesaje
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddWeighingModal;