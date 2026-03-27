import React, { useState } from 'react';
import { login } from '../api/authService';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [verPass, setVerPass]   = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email, password);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1ED] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-[#1D5E4D] italic tracking-tight">
            Mencho<span className="text-[#E67E22]">.</span>
          </h1>
          <p className="text-[12px] text-[#A69C8A] font-medium uppercase tracking-widest mt-1">
            Gestión de Hacienda
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm p-7 space-y-5">
          <div>
            <h2 className="text-xl font-black text-[#2F3E3B]">Iniciar sesión</h2>
            <p className="text-xs text-[#A69C8A] mt-0.5">Ingresá tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-bold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none font-semibold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A69C8A] uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={verPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#1D5E4D] outline-none font-semibold text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setVerPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A69C8A]"
                >
                  {verPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#1D5E4D] hover:bg-[#154639] disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mt-2"
            >
              {cargando
                ? <span className="animate-pulse">Ingresando…</span>
                : <><LogIn size={18} strokeWidth={3}/> Ingresar</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[#C4B8AA] mt-6 uppercase tracking-widest">
          Mencho · Gestión Ganadera
        </p>
      </div>
    </div>
  );
};

export default LoginPage;