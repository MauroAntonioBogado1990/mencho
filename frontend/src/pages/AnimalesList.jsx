import React, { useState } from 'react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { Plus, CloudOff, Target, TrendingUp, Search, Layers3 } from 'lucide-react';
import AddAnimalModal from '../components/AddAnimalModal'; 
import AddWeighingModal from '../components/AddWeighingModal'; // <--- IMPORTAMOS EL NUEVO MODAL

const AnimalesList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnimalForWeighing, setSelectedAnimalForWeighing] = useState(null);
  const animales = useLiveQuery(() => db.animales.toArray());

  return (
    <div className="min-h-screen bg-[#F4F1ED] p-4 pb-28 text-[#2F3E3B]">
      
      {/* --- HEADER SUPERIOR (Tipo NX) --- */}
      <header className="flex justify-between items-center mb-6 pt-2">
        <div>
           <h1 className="text-2xl font-black text-[#1D5E4D] italic tracking-tight">Mencho<span className='text-[#E67E22]'>.</span></h1>
           <p className="text-[11px] text-[#A69C8A] font-medium uppercase tracking-widest -mt-1">Gestión de Hacienda</p>
        </div>
        <div className='flex gap-2 items-center'>
            {/* Botón de Sincronización (Rústico pero limpio) */}
            <button className="bg-white text-[#A69C8A] p-2.5 rounded-full shadow-sm hover:text-[#1D5E4D] active:scale-95 transition-all">
                <Target size={20} />
            </button>
             {/* Buscador Rápido (Limpio tipo NX) */}
            <button className="bg-white text-[#A69C8A] p-2.5 rounded-full shadow-sm hover:text-[#1D5E4D] active:scale-95 transition-all">
                <Search size={20} />
            </button>
        </div>
      </header>

      {/* --- SELECTOR DE LOTES (Tipo Tabs NX) --- */}
      <div className="flex space-x-2 mb-6 bg-white p-1 rounded-full shadow-inner">
        <button className="flex-1 text-center py-2.5 px-4 bg-[#1D5E4D] text-white rounded-full text-sm font-bold shadow-md">
          Todo el rodeo
        </button>
        <button className="flex-1 text-center py-2.5 px-4 text-[#A69C8A] rounded-full text-sm font-medium hover:bg-gray-50">
          Mis Lotes
        </button>
      </div>

      <div className="space-y-4">
        
        {/* --- ESTADO VACÍO (Con diseño rústico) --- */}
        {animales?.map((animal) => (
          <div 
            key={animal.id} 
            // NUEVO: Agregamos interactividad y puntero
            onClick={() => setSelectedAnimalForWeighing(animal)}
            className="bg-white p-5 rounded-2xl shadow-sm border-2 border-transparent hover:border-[#1D5E4D]/20 active:border-[#1D5E4D]/30 transition-all cursor-pointer active:scale-[0.98]"
          >
            {/* ... (Contenido de la tarjeta permanece igual) ... */}
          </div>
        ))}

        {/* --- TARJETA DE ANIMAL (Inspirada en NX, colores Litoral) --- */}
        {animales?.map((animal) => (
          <div key={animal.id} className="bg-white p-5 rounded-2xl shadow-sm border-2 border-transparent hover:border-[#1D5E4D]/20 active:border-[#1D5E4D]/30 transition-all active:scale-[0.99]">
            <div className="flex justify-between items-start mb-4">
              <div className='flex gap-3 items-center'>
                <div className='p-2.5 bg-[#FDF1E3] text-[#E67E22] rounded-xl'>
                    <Target size={22} strokeWidth={2.5}/>
                </div>
                <div>
                    <span className="text-[10px] font-bold text-[#A69C8A] uppercase tracking-wider">Caravana</span>
                    <h3 className="text-xl font-mono font-bold text-[#1D5E4D]">{animal.caravana}</h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#A69C8A] uppercase tracking-wider">Peso Actual</span>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{animal.peso_actual} <span className="text-sm font-normal text-gray-400">kg</span></p>
              </div>
            </div>
            
            {/* -- Sección Inferior Rústica/Limpia -- */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <div className='flex items-center gap-1.5 text-[#1D5E4D]'>
                    <TrendingUp size={16}/>
                    <p className='text-xs font-bold'>+1.2 kg / día <span className='text-gray-400 font-normal'>(última sem.)</span></p>
                </div>
                
                {/* Indicador Offline - Limpio pero visible */}
                {animal.sincronizado === 0 && (
                  <div className="flex items-center text-[#E67E22] text-[10px] font-bold uppercase p-1.5 px-3 bg-[#FDF1E3] rounded-full">
                    <CloudOff size={12} className="mr-1.5" /> En Celular
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* --- BOTÓN FLOTANTE (Estilo NX, color Verde Litoral) --- */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-[#1D5E4D] hover:bg-[#154639] text-white p-5 rounded-full shadow-2xl active:scale-95 transition-transform"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* El Modal de carga (mantenemos su diseño limpio) */}
      <AddAnimalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      {/* --- NUEVO MODAL DE PESAJE --- */}
      <AddWeighingModal
        isOpen={selectedAnimalForWeighing !== null}
        onClose={() => setSelectedAnimalForWeighing(null)}
        animal={selectedAnimalForWeighing}
      />
    </div>
  );
};

export default AnimalesList;