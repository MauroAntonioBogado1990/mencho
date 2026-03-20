import React, { useState } from 'react';
import { db } from '../db/db';
import { X, Save, CheckCircle } from 'lucide-react';

const AddAnimalModal = ({ isOpen, onClose }) => {
  const [caravana, setCaravana] = useState('');
  const [peso, setPeso] = useState('');
  const [mensaje, setMensaje] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Guardamos en la IndexedDB local
      await db.animales.add({
        caravana: caravana.toUpperCase(),
        peso_actual: parseFloat(peso),
        sincronizado: 0 // Importante: 0 significa que aún no subió al FastAPI
      });

      setMensaje(true);
      setTimeout(() => {
        setMensaje(false);
        setCaravana('');
        setPeso('');
        onClose();
      }, 1500);

    } catch (error) {
      console.error("Error al guardar localmente:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Nuevo Animal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {mensaje ? (
          <div className="flex flex-col items-center py-10 text-green-600 animate-bounce">
            <CheckCircle size={60} />
            <p className="mt-4 font-bold text-lg text-center">¡Guardado en el dispositivo!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Número de Caravana</label>
              <input 
                type="text" 
                required
                className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-green-500 outline-none text-xl font-mono"
                placeholder="EJ: AB-123"
                value={caravana}
                onChange={(e) => setCaravana(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Peso Inicial (kg)</label>
              <input 
                type="number" 
                required
                step="0.1"
                className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-green-500 outline-none text-2xl font-bold"
                placeholder="0.0"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg mt-4"
            >
              <Save size={20} /> Guardar Animal
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddAnimalModal;