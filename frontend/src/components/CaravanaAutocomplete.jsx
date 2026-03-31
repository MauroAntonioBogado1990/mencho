import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const CaravanaAutocomplete = ({ value, onChange }) => {
  const [opciones, setOpciones] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/reportes/caravanas`)
      .then(r => r.json())
      .then(d => {
        const lista = d.caravanas ?? d ?? [];
        setOpciones(lista);
        setFiltradas(lista);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const term = value.trim().toLowerCase();
    setFiltradas(
      term === ''
        ? opciones
        : opciones.filter(c => c.toLowerCase().includes(term))
    );
  }, [value, opciones]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        placeholder="Ej: AR-123"
        value={value}
        onChange={e => { onChange(e.target.value); setAbierto(true); }}
        onFocus={() => setAbierto(true)}
        className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-sm font-semibold font-mono uppercase"
      />

      {abierto && filtradas.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
          {filtradas.map(caravana => (
            <li
              key={caravana}
              onMouseDown={() => { onChange(caravana); setAbierto(false); }}
              className="px-4 py-2.5 text-sm font-mono font-bold text-[#1D5E4D] cursor-pointer hover:bg-[#EAF4F0] border-b border-gray-50 last:border-0 uppercase"
            >
              {caravana}
            </li>
          ))}
        </ul>
      )}

      {abierto && value.trim() !== '' && filtradas.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-xs text-[#A69C8A] font-bold uppercase tracking-wider">
          Sin resultados — se usará el valor ingresado
        </div>
      )}
    </div>
  );
};

export default CaravanaAutocomplete;