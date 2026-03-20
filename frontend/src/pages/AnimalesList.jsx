import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Plus, CloudOff, TrendingUp, Search, X, Home, HardHat, DoorOpen } from 'lucide-react';
import AddAnimalModal from '../components/AddAnimalModal';
import AddWeighingModal from '../components/AddWeighingModal';
import LotesPage from './LotesPage';
import PerfilPage from './PerfilPage';

// ── Iconos de emoji para especies ──────────────────────────────
const especieEmoji = (e) => {
  if (!e) return '🐄';
  const l = e.toLowerCase();
  if (l.includes('oveja') || l.includes('ovi')) return '🐑';
  if (l.includes('bufalo') || l.includes('búfalo')) return '🦬';
  if (l.includes('vaca') || l.includes('bov')) return '🐄';
  if (l.includes('caballo') || l.includes('equi')) return '🐴';
  if (l.includes('cerdo') || l.includes('port')) return '🐷';
  return '🐾';
};

// ── Navbar Bottom ──────────────────────────────────────────────
const NavBar = ({ tab, setTab }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-4 pt-2 pb-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
    {[
      { id: 'inicio', icon: <Home size={22} />, label: 'Inicio' },
      { id: 'lotes', icon: <DoorOpen size={22} />, label: 'Lotes' },
      { id: 'perfil', icon: <HardHat size={22} />, label: 'Perfil' },
    ].map(item => (
      <button
        key={item.id}
        onClick={() => setTab(item.id)}
        className={`flex flex-col items-center gap-0.5 px-4 transition-all ${
          tab === item.id ? 'text-[#1D5E4D]' : 'text-[#A69C8A]'
        }`}
      >
        <span className={`${tab === item.id ? 'scale-110' : ''} transition-transform`}>{item.icon}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${tab === item.id ? 'text-[#1D5E4D]' : 'text-[#C4B8AA]'}`}>
          {item.label}
        </span>
        {tab === item.id && <span className="w-1 h-1 bg-[#1D5E4D] rounded-full mt-0.5" />}
      </button>
    ))}
  </nav>
);

// ── Modal de búsqueda ──────────────────────────────────────────
const BuscadorModal = ({ isOpen, onClose, animales, onSelectAnimal }) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const resultados = animales?.filter(a => {
    const q = query.toLowerCase();
    return (
      a.caravana?.toLowerCase().includes(q) ||
      a.especie?.toLowerCase().includes(q) ||
      a.raza?.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
      <div className="bg-[#F4F1ED] px-4 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
            <Search size={18} className="text-[#1D5E4D] flex-shrink-0" />
            <input
              autoFocus
              className="flex-1 outline-none text-base font-semibold bg-transparent"
              placeholder="Buscar por caravana, especie, raza..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button onClick={onClose} className="p-2.5 bg-white rounded-full shadow-sm text-[#A69C8A]">
            <X size={18} />
          </button>
        </div>
        {query && (
          <p className="text-xs text-[#A69C8A] font-bold uppercase tracking-wider mt-3 px-1">
            {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {query === '' ? (
          <div className="text-center py-12 text-[#A69C8A]">
            <Search size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-bold">Escribí para buscar</p>
            <p className="text-sm mt-1">caravana, especie o raza</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="text-center py-12 text-[#A69C8A]">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-bold">Sin resultados</p>
          </div>
        ) : resultados.map(animal => (
          <div
            key={animal.id}
            onClick={() => { onSelectAnimal(animal); onClose(); }}
            className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <span className="text-3xl">{especieEmoji(animal.especie)}</span>
            <div className="flex-1">
              <p className="font-black text-[#1D5E4D] font-mono text-lg">{animal.caravana}</p>
              <p className="text-xs text-[#A69C8A]">{animal.especie} · {animal.raza || 'Sin raza'}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-gray-800">{animal.peso_actual}</p>
              <p className="text-[10px] text-[#A69C8A] font-bold">kg</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Página Principal ───────────────────────────────────────────
const InicioPage = ({ onPesaje }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buscadorOpen, setBuscadorOpen] = useState(false);
  const [filtroLote, setFiltroLote] = useState(null); // null = "todo"
  const animales = useLiveQuery(() => db.animales.toArray());
  const lotes = useLiveQuery(() => db.lotes.toArray());

  const animalesFiltrados = useMemo(() => {
    if (!animales) return [];
    if (filtroLote === null) return animales;
    return animales.filter(a => a.lote_id === filtroLote);
  }, [animales, filtroLote]);

  return (
    <div className="min-h-screen bg-[#F4F1ED] p-4 pb-28 text-[#2F3E3B]">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-black text-[#1D5E4D] italic tracking-tight">
            Mencho<span className="text-[#E67E22]">.</span>
          </h1>
          <p className="text-[11px] text-[#A69C8A] font-medium uppercase tracking-widest -mt-1">Gestión de Hacienda</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setBuscadorOpen(true)}
            className="bg-white text-[#A69C8A] p-2.5 rounded-full shadow-sm hover:text-[#1D5E4D] active:scale-95 transition-all"
          >
            <Search size={20} />
          </button>
        </div>
      </header>

      {/* Selector de Lotes tipo tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFiltroLote(null)}
          className={`flex-shrink-0 py-2.5 px-5 rounded-full text-sm font-bold transition-all ${
            filtroLote === null
              ? 'bg-[#1D5E4D] text-white shadow-md'
              : 'bg-white text-[#A69C8A] hover:bg-gray-50'
          }`}
        >
          Todo el rodeo
        </button>
        {lotes?.map(lote => (
          <button
            key={lote.id}
            onClick={() => setFiltroLote(lote.id)}
            className={`flex-shrink-0 py-2.5 px-5 rounded-full text-sm font-bold transition-all ${
              filtroLote === lote.id
                ? 'bg-[#1D5E4D] text-white shadow-md'
                : 'bg-white text-[#A69C8A] hover:bg-gray-50'
            }`}
          >
            {lote.nombre}
          </button>
        ))}
      </div>

      {/* Conteo */}
      {animalesFiltrados.length > 0 && (
        <p className="text-xs text-[#A69C8A] font-bold uppercase tracking-wider mb-3 px-1">
          {animalesFiltrados.length} animal{animalesFiltrados.length !== 1 ? 'es' : ''}
        </p>
      )}

      {/* Lista de animales */}
      <div className="space-y-3">
        {!animales ? (
          <p className="text-center text-[#A69C8A] py-10">Cargando...</p>
        ) : animalesFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-[#A69C8A]">
            <p className="text-5xl mb-3">🌿</p>
            <p className="font-bold text-lg">
              {filtroLote ? 'Este lote está vacío' : 'Sin animales aún'}
            </p>
            <p className="text-sm mt-1">
              {filtroLote ? 'Asigná animales a este lote.' : 'Tocá el + para registrar tu primer animal.'}
            </p>
          </div>
        ) : animalesFiltrados.map(animal => (
          <div
            key={animal.id}
            onClick={() => onPesaje(animal)}
            className="bg-white p-5 rounded-2xl shadow-sm border-2 border-transparent hover:border-[#1D5E4D]/20 active:border-[#1D5E4D]/30 transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3 items-center">
                <div className="p-2.5 bg-[#EAF4F0] rounded-xl text-3xl leading-none">
                  {especieEmoji(animal.especie)}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#A69C8A] uppercase tracking-wider">Caravana</span>
                  <h3 className="text-xl font-mono font-bold text-[#1D5E4D] -mt-0.5">{animal.caravana}</h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#A69C8A] uppercase tracking-wider">Peso</span>
                <p className="text-2xl font-black text-gray-900 tracking-tight">
                  {animal.peso_actual} <span className="text-sm font-normal text-gray-400">kg</span>
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#A69C8A]">
                  {animal.especie || '—'}
                  {animal.raza ? ` · ${animal.raza}` : ''}
                </span>
              </div>
              {animal.sincronizado === 0 && (
                <div className="flex items-center text-[#E67E22] text-[10px] font-bold uppercase px-2.5 py-1 bg-[#FDF1E3] rounded-full">
                  <CloudOff size={11} className="mr-1" /> Local
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-5 bg-[#1D5E4D] hover:bg-[#154639] text-white p-5 rounded-full shadow-2xl active:scale-95 transition-transform z-30"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      <AddAnimalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <BuscadorModal
        isOpen={buscadorOpen}
        onClose={() => setBuscadorOpen(false)}
        animales={animales}
        onSelectAnimal={onPesaje}
      />
    </div>
  );
};

// ── App Shell con router simple ────────────────────────────────
const AnimalesList = () => {
  const [tab, setTab] = useState('inicio');
  const [animalParaPesar, setAnimalParaPesar] = useState(null);

  return (
    <>
      {tab === 'inicio' && <InicioPage onPesaje={setAnimalParaPesar} />}
      {tab === 'lotes' && <LotesPage />}
      {tab === 'perfil' && <PerfilPage />}

      <NavBar tab={tab} setTab={setTab} />

      <AddWeighingModal
        isOpen={animalParaPesar !== null}
        onClose={() => setAnimalParaPesar(null)}
        animal={animalParaPesar}
      />
    </>
  );
};

export default AnimalesList;
