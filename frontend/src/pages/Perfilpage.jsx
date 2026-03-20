import React, { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { HardHat, MapPin, Phone, Save, CheckCircle } from 'lucide-react';

const PerfilPage = () => {
  const [nombre, setNombre] = useState('');
  const [establecimiento, setEstablecimiento] = useState('');
  const [provincia, setProvincia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardado, setGuardado] = useState(false);

  const animales = useLiveQuery(() => db.animales.toArray(), []);
  const lotes = useLiveQuery(() => db.lotes.toArray(), []);
  const pesajes = useLiveQuery(() => db.pesajes.toArray(), []);

  const handleGuardar = (e) => {
    e.preventDefault();
    localStorage.setItem('mencho_perfil', JSON.stringify({ nombre, establecimiento, provincia, telefono }));
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  React.useEffect(() => {
    const p = localStorage.getItem('mencho_perfil');
    if (p) {
      const data = JSON.parse(p);
      setNombre(data.nombre || '');
      setEstablecimiento(data.establecimiento || '');
      setProvincia(data.provincia || '');
      setTelefono(data.telefono || '');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F1ED] p-4 pb-28 text-[#2F3E3B]">
      <header className="flex items-center gap-4 mb-6 pt-2">
        <div className="p-3 bg-[#1D5E4D] rounded-2xl text-white">
          <HardHat size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1D5E4D] italic tracking-tight">Mi Perfil</h1>
          <p className="text-[11px] text-[#A69C8A] font-medium uppercase tracking-widest">Datos del productor</p>
        </div>
      </header>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Animales', value: animales?.length || 0, emoji: '🐄' },
          { label: 'Lotes', value: lotes?.length || 0, emoji: '🌿' },
          { label: 'Pesajes', value: pesajes?.length || 0, emoji: '⚖️' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl">{stat.emoji}</p>
            <p className="text-2xl font-black text-[#1D5E4D] mt-1">{stat.value}</p>
            <p className="text-[10px] text-[#A69C8A] font-bold uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Formulario de perfil */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-black text-[#A69C8A] uppercase tracking-wider mb-4">Datos del Productor</h2>
        <form onSubmit={handleGuardar} className="space-y-3">
          {[
            { label: 'Nombre / Razón Social', value: nombre, setter: setNombre, placeholder: 'Juan García' },
            { label: 'Nombre del Establecimiento', value: establecimiento, setter: setEstablecimiento, placeholder: 'Establecimiento La Esperanza' },
            { label: 'Provincia', value: provincia, setter: setProvincia, placeholder: 'Corrientes, Misiones...' },
            { label: 'Teléfono', value: telefono, setter: setTelefono, placeholder: '+54 9 3794 000000', type: 'tel' },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1">{field.label}</label>
              <input
                type={field.type || 'text'}
                className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-sm font-semibold"
                placeholder={field.placeholder}
                value={field.value}
                onChange={e => field.setter(e.target.value)}
              />
            </div>
          ))}
          <button
            type="submit"
            className={`w-full ${guardado ? 'bg-[#27AE60]' : 'bg-[#1D5E4D]'} text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 mt-2`}
          >
            {guardado ? <><CheckCircle size={20} /> Guardado</> : <><Save size={20} /> Guardar Perfil</>}
          </button>
        </form>
      </div>

      {/* Info de la app */}
      <div className="mt-4 text-center text-xs text-[#A69C8A] font-medium">
        <p className="font-black text-[#1D5E4D] italic text-base">Mencho<span className="text-[#E67E22]">.</span></p>
        <p className="mt-0.5">Gestión de hacienda · Litoral Argentino</p>
        <p className="mt-0.5 opacity-60">v0.2.0 — Offline First</p>
      </div>
    </div>
  );
};

export default PerfilPage;