import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaChartLine, FaUsers, FaExclamationTriangle, FaClock, FaFileInvoiceDollar, FaWallet, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { BRAND_NAME, BRAND_LOGO_PATH, BRAND_SUBTITLE } from '../../config/branding';
import { getCurrentUser } from '../../services/api';

const Sidebar = ({ isAuthenticated, logout }) => {
  const [logoOk, setLogoOk] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    if (isAuthenticated) {
      getCurrentUser().then((data) => {
        if (mounted) setCurrentUser(data);
      }).catch(() => {
        // Ignorar errores; se mostrará información genérica
      });
    }
    return () => { mounted = false; };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <aside className="app-sidebar bg-white border-r border-slate-200/70 shadow-sm min-h-[calc(100vh-56px)] w-64 flex flex-col">
      <div className="sidebar-brand flex items-center gap-3 px-4 py-4 text-slate-700 border-b border-slate-100/80">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md">
          {logoOk ? (
            <img
              src={BRAND_LOGO_PATH}
              alt={BRAND_NAME}
              className="w-5 h-5 object-contain"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span className="text-white/90 text-lg font-semibold">SJ</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="brand-name font-semibold tracking-tight text-slate-900">{BRAND_NAME}</span>
          {BRAND_SUBTITLE && (
            <span className="text-xs text-slate-500">{BRAND_SUBTITLE}</span>
          )}
        </div>
      </div>

      <nav className="sidebar-nav grid gap-2 px-3 py-3 flex-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `inline-flex items-center gap-4 px-4 py-2 text-sm rounded-full transition-colors ${isActive ? 'text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`
          }
          style={({ isActive }) => (isActive ? { backgroundColor: 'var(--leaflet-accent)' } : undefined)}
        >
          {({ isActive }) => (
            <>
              <span className="mr-2" style={isActive ? { color: 'rgba(255,255,255,0.92)' } : undefined}>
                <FaChartLine size={isActive ? 18 : 16} />
              </span>
              <span style={isActive ? { color: '#ffffff' } : undefined}>Dashboard</span>
              <span className={`ml-auto w-2 h-2 rounded-full ${isActive ? 'bg-white/70' : 'opacity-0'}`} />
            </>
          )}
        </NavLink>

        <NavLink
          to="/employees"
          className={({ isActive }) =>
            `inline-flex items-center gap-4 px-4 py-2 text-sm rounded-full transition-colors ${isActive ? 'text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`
          }
          style={({ isActive }) => (isActive ? { backgroundColor: 'var(--leaflet-accent)' } : undefined)}
        >
          {({ isActive }) => (
            <>
              <span className="mr-2" style={isActive ? { color: 'rgba(255,255,255,0.92)' } : undefined}>
                <FaUsers size={isActive ? 18 : 16} />
              </span>
              <span style={isActive ? { color: '#ffffff' } : undefined}>Empleados</span>
              <span className={`ml-auto w-2 h-2 rounded-full ${isActive ? 'bg-white/70' : 'opacity-0'}`} />
            </>
          )}
        </NavLink>

        <NavLink
          to="/disciplinary"
          className={({ isActive }) =>
            `inline-flex items-center gap-4 px-4 py-2 text-sm rounded-full transition-colors ${isActive ? 'text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`
          }
          style={({ isActive }) => (isActive ? { backgroundColor: 'var(--leaflet-accent)' } : undefined)}
        >
          {({ isActive }) => (
            <>
              <span className="mr-2" style={isActive ? { color: 'rgba(255,255,255,0.92)' } : undefined}>
                <FaExclamationTriangle size={isActive ? 18 : 16} />
              </span>
              <span style={isActive ? { color: '#ffffff' } : undefined}>Disciplinarias</span>
              <span className={`ml-auto w-2 h-2 rounded-full ${isActive ? 'bg-white/70' : 'opacity-0'}`} />
            </>
          )}
        </NavLink>

        <NavLink
          to="/attendance"
          className={({ isActive }) =>
            `inline-flex items-center gap-4 px-4 py-2 text-sm rounded-full transition-colors ${isActive ? 'text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50 hover:text-white'}`
          }
          style={({ isActive }) => (isActive ? { backgroundColor: 'var(--leaflet-accent)' } : undefined)}
        >
          {({ isActive }) => (
            <>
              <span className="mr-2" style={isActive ? { color: 'rgba(255,255,255,0.92)' } : undefined}>
                <FaClock size={isActive ? 18 : 16} />
              </span>
              <span style={isActive ? { color: '#ffffff' } : undefined}>Asistencias</span>
              <span className={`ml-auto w-2 h-2 rounded-full ${isActive ? 'bg-white/70' : 'opacity-0'}`} />
            </>
          )}
        </NavLink>

        <NavLink
          to="/payroll"
          className={({ isActive }) =>
            `inline-flex items-center gap-4 px-4 py-2 text-sm rounded-full transition-colors ${isActive ? 'text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50 hover:text-white'}`
          }
          style={({ isActive }) => (isActive ? { backgroundColor: 'var(--leaflet-accent)' } : undefined)}
        >
          {({ isActive }) => (
            <>
              <span className="mr-2" style={isActive ? { color: 'rgba(255,255,255,0.92)' } : undefined}>
                <FaFileInvoiceDollar size={isActive ? 18 : 16} />
              </span>
              <span style={isActive ? { color: '#ffffff' } : undefined}>Recibos</span>
              <span className={`ml-auto w-2 h-2 rounded-full ${isActive ? 'bg-white/70' : 'opacity-0'}`} />
            </>
          )}
        </NavLink>

        <NavLink
          to="/employee-account"
          className={({ isActive }) =>
            `inline-flex items-center gap-4 px-4 py-2 text-sm rounded-full transition-colors ${isActive ? 'text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`
          }
          style={({ isActive }) => (isActive ? { backgroundColor: 'var(--leaflet-accent)' } : undefined)}
        >
          {({ isActive }) => (
            <>
              <span className="mr-2" style={isActive ? { color: 'rgba(255,255,255,0.92)' } : undefined}>
                <FaWallet size={isActive ? 18 : 16} />
              </span>
              <span style={isActive ? { color: '#ffffff' } : undefined}>Cuenta Corriente</span>
              <span className={`ml-auto w-2 h-2 rounded-full ${isActive ? 'bg-white/70' : 'opacity-0'}`} />
            </>
          )}
        </NavLink>
      </nav>

      <div className="sidebar-footer mt-auto px-3 py-4 border-t border-slate-100/80">
        <div className="rounded-xl bg-slate-50 shadow-sm p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
              <FaUser />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900">{currentUser?.nombre || currentUser?.email || 'Usuario'}</span>
              <span className="text-xs text-slate-500">{currentUser?.role || 'Administrador'}</span>
            </div>
          </div>
          <button onClick={logout} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-2">
            <FaSignOutAlt />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;