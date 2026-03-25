import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Search, TrendingUp, TrendingDown, Minus, ChevronRight, BarChart2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ─── Tooltip personalizado ────────────────────────────────────────────────────
const TooltipMencho = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1D3A30] text-white rounded-2xl px-4 py-3 shadow-2xl text-sm min-w-[160px]">
      <p className="font-black text-[#86efac] mb-1.5 text-xs uppercase tracking-wider">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex justify-between gap-4">
          <span className="text-white/60 text-xs">{entry.name}</span>
          <span className="font-black">{entry.value != null ? `${entry.value} kg` : '—'}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Chip de GDP ──────────────────────────────────────────────────────────────
const ChipGDP = ({ valor }) => {
  if (valor == null) return <span className="text-[#A69C8A]">—</span>;
  if (valor > 0) return (
    <span className="flex items-center gap-1 text-[#1D5E4D] font-black">
      <TrendingUp size={13} /> +{valor}
    </span>
  );
  if (valor < 0) return (
    <span className="flex items-center gap-1 text-red-500 font-black">
      <TrendingDown size={13} /> {valor}
    </span>
  );
  return <span className="flex items-center gap-1 text-[#A69C8A]"><Minus size={13} /> 0</span>;
};

// ─── Tarjeta stat ─────────────────────────────────────────────────────────────
const StatCard = ({ emoji, label, valor, sub }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm flex-1 min-w-[100px]">
    <p className="text-2xl leading-none mb-1">{emoji}</p>
    <p className="text-xl font-black text-[#1D5E4D] leading-tight">{valor ?? '—'}</p>
    <p className="text-[10px] font-bold text-[#A69C8A] uppercase tracking-wider leading-tight">{label}</p>
    {sub && <p className="text-[10px] text-[#A69C8A] mt-0.5">{sub}</p>}
  </div>
);

// ─── Tabs internos ────────────────────────────────────────────────────────────
const TabInterna = ({ id, label, activo, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`py-2 px-4 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
      activo
        ? 'bg-[#1D5E4D] text-white shadow-md'
        : 'bg-white text-[#A69C8A] border border-gray-100'
    }`}
  >
    {label}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
const ReportesPage = () => {
  const [modo, setModo]             = useState('lote');      // 'lote' | 'periodo' | 'animal'
  const [lotes, setLotes]           = useState([]);
  const [loteSelec, setLoteSelec]   = useState('');
  const [caravana, setCaravana]     = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [datos, setDatos]           = useState(null);
  const [cargando, setCargando]     = useState(false);
  const [error, setError]           = useState(null);
  const [mostrarTabla, setMostrarTabla] = useState(false);

  // Cargar lotes disponibles
  useEffect(() => {
    fetch(`${API}/reportes/lotes`)
      .then(r => r.json())
      .then(d => setLotes(d.lotes ?? []))
      .catch(() => {});
  }, []);

  // Resetear al cambiar modo
  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setDatos(null);
    setError(null);
  };

  const consultar = useCallback(async () => {
    setCargando(true);
    setError(null);
    setDatos(null);

    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.set('fecha_desde', fechaDesde);
      if (fechaHasta) params.set('fecha_hasta', fechaHasta);

      let url;
      if (modo === 'lote') {
        if (!loteSelec) { setError('Seleccioná un lote.'); setCargando(false); return; }
        url = `${API}/reportes/evolucion-lote/${encodeURIComponent(loteSelec)}?${params}`;
      } else if (modo === 'periodo') {
        if (loteSelec) params.set('lote_nombre', loteSelec);
        url = `${API}/reportes/evolucion-periodo?${params}`;
      } else {
        if (!caravana.trim()) { setError('Ingresá la caravana del animal.'); setCargando(false); return; }
        url = `${API}/reportes/evolucion-animal/${encodeURIComponent(caravana.trim())}?${params}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
      setDatos(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [modo, loteSelec, caravana, fechaDesde, fechaHasta]);

  // ── Resumen calculado ──
  const resumen = (() => {
    if (!datos?.puntos?.length) return null;
    const pts    = datos.puntos;
    const primer = pts[0];
    const ultimo = pts[pts.length - 1];
    const gdps   = pts.map(p => p.gdp).filter(g => g != null);
    const gdpProm = gdps.length
      ? (gdps.reduce((a, b) => a + b, 0) / gdps.length).toFixed(3)
      : null;
    const ganancia = (ultimo.peso_promedio - primer.peso_promedio).toFixed(2);
    const dias = Math.round((new Date(ultimo.fecha) - new Date(primer.fecha)) / 86_400_000);
    return { primer, ultimo, gdpProm, ganancia: parseFloat(ganancia), dias };
  })();

  // ── Título del bloque de resultados ──
  const subtitulo =
    modo === 'lote'    ? `Lote: ${datos?.lote ?? loteSelec}`
    : modo === 'animal' ? `Animal ${datos?.animal?.caravana ?? caravana}`
    : 'Todo el rodeo';

  return (
    <div className="min-h-screen bg-[#F4F1ED] p-4 pb-28 text-[#2F3E3B]">

      {/* ── Header ── */}
      <header className="flex items-center gap-4 mb-6 pt-2">
        <div className="p-3 bg-[#1D5E4D] rounded-2xl text-white">
          <BarChart2 size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1D5E4D] italic tracking-tight">
            Mencho<span className="text-[#E67E22]">.</span>
          </h1>
          <p className="text-[11px] text-[#A69C8A] font-medium uppercase tracking-widest -mt-1">
            Evolución de Peso
          </p>
        </div>
      </header>

      {/* ── Tabs de modo ── */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <TabInterna id="lote"    label="Por Lote"   activo={modo === 'lote'}    onClick={cambiarModo} />
        <TabInterna id="periodo" label="Período"    activo={modo === 'periodo'} onClick={cambiarModo} />
        <TabInterna id="animal"  label="Por Animal" activo={modo === 'animal'}  onClick={cambiarModo} />
      </div>

      {/* ── Panel de filtros ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 space-y-3">

        {/* Selector de lote */}
        {modo === 'lote' && (
          <div>
            <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">
              Lote *
            </label>
            <select
              value={loteSelec}
              onChange={e => setLoteSelec(e.target.value)}
              className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-sm font-semibold"
            >
              <option value="">— Seleccionar lote —</option>
              {lotes.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {lotes.length === 0 && (
              <p className="text-xs text-[#A69C8A] mt-1">
                Sin lotes disponibles. Asigná ubicación a los animales primero.
              </p>
            )}
          </div>
        )}

        {/* Caravana animal */}
        {modo === 'animal' && (
          <div>
            <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">
              Caravana *
            </label>
            <input
              type="text"
              placeholder="Ej: AR-123"
              value={caravana}
              onChange={e => setCaravana(e.target.value)}
              className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-sm font-semibold font-mono uppercase"
            />
          </div>
        )}

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">
              Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-sm font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">
              Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none text-sm font-semibold"
            />
          </div>
        </div>

        {/* Botón */}
        <button
          onClick={consultar}
          disabled={cargando}
          className="w-full bg-[#1D5E4D] hover:bg-[#154639] disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          {cargando
            ? <span className="animate-pulse">Consultando…</span>
            : <><Search size={18} strokeWidth={3} /> Consultar</>
          }
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm font-bold mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* ── Sin datos ── */}
      {datos && !datos.puntos?.length && (
        <div className="bg-white rounded-2xl p-10 text-center text-[#A69C8A]">
          <p className="text-5xl mb-3">⚖️</p>
          <p className="font-bold text-lg">Sin pesajes</p>
          <p className="text-sm mt-1">No hay datos para la selección indicada.</p>
        </div>
      )}

      {/* ── Resultados ── */}
      {datos?.puntos?.length > 0 && (
        <>
          {/* Subtítulo */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-200" />
            <p className="text-[11px] font-black text-[#A69C8A] uppercase tracking-widest px-2">
              {subtitulo}
            </p>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Tarjetas de resumen */}
          {resumen && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              <StatCard
                emoji="⚖️"
                label="Peso inicial"
                valor={`${resumen.primer.peso_promedio} kg`}
              />
              <StatCard
                emoji="📈"
                label="Peso final"
                valor={`${resumen.ultimo.peso_promedio} kg`}
              />
              <StatCard
                emoji={resumen.ganancia >= 0 ? '🟢' : '🔴'}
                label="Ganancia"
                valor={`${resumen.ganancia >= 0 ? '+' : ''}${resumen.ganancia} kg`}
                sub={`en ${resumen.dias} días`}
              />
              <StatCard
                emoji="⚡"
                label="GDP prom."
                valor={resumen.gdpProm ? `${resumen.gdpProm} kg/d` : '—'}
              />
              {datos.total_animales && (
                <StatCard emoji="🐄" label="Animales" valor={datos.total_animales} />
              )}
            </div>
          )}

          {/* Gráfico */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <p className="text-xs font-black text-[#A69C8A] uppercase tracking-wider mb-3">
              Peso Promedio (kg)
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={datos.puntos} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 10, fill: '#A69C8A', fontWeight: 700 }}
                  tickFormatter={v => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#A69C8A', fontWeight: 700 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<TooltipMencho />} />
                <ReferenceLine y={0} stroke="#e5e7eb" />
                <Line
                  type="monotone"
                  dataKey="peso_promedio"
                  name="Peso prom."
                  stroke="#1D5E4D"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1D5E4D', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#E67E22', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Toggle tabla */}
          <button
            onClick={() => setMostrarTabla(v => !v)}
            className="w-full bg-white rounded-2xl px-5 py-3.5 shadow-sm flex items-center justify-between mb-3 active:scale-[0.98] transition-all"
          >
            <span className="text-sm font-black text-[#1D5E4D]">
              Ver detalle de pesajes
            </span>
            <ChevronRight
              size={18}
              className={`text-[#A69C8A] transition-transform duration-200 ${mostrarTabla ? 'rotate-90' : ''}`}
            />
          </button>

          {/* Tabla detallada */}
          {mostrarTabla && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
              {/* Header tabla */}
              <div className="grid grid-cols-4 px-4 py-2.5 bg-[#EAF4F0]">
                {['Fecha', 'Peso prom.', 'Pesajes', 'GDP'].map(h => (
                  <p key={h} className="text-[10px] font-black text-[#1D5E4D] uppercase tracking-wider">{h}</p>
                ))}
              </div>
              {/* Filas */}
              {datos.puntos.map((p, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-4 px-4 py-3 border-b border-gray-50 last:border-0 ${i % 2 === 1 ? 'bg-[#fafaf9]' : ''}`}
                >
                  <p className="text-xs font-bold text-[#2F3E3B]">{p.fecha.slice(5)}</p>
                  <p className="text-xs font-black text-[#1D5E4D]">{p.peso_promedio} kg</p>
                  <p className="text-xs font-semibold text-[#A69C8A]">{p.cantidad_pesajes}</p>
                  <div className="text-xs"><ChipGDP valor={p.gdp} /></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportesPage;