import React, { useState } from 'react';
import { Menu, Bell, Search, Home, Users, ClipboardList, Wallet, Settings } from 'lucide-react';

const Stat = ({ title, value, trend, color = 'emerald' }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="text-xs text-slate-500">{title}</div>
    <div className="mt-1 flex items-end justify-between">
      <div className="text-2xl font-semibold text-slate-800">{value}</div>
      {trend && (
        <div className={`text-xs ${trend.startsWith('+') ? `text-${color}-600` : 'text-rose-600'}`}>{trend}</div>
      )}
    </div>
  </div>
);

const Card = ({ title, children, actions }) => (
  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {actions}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const NavItem = ({ icon, label, active }) => (
  <button
    className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors ${
      active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const TemplatePreview = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="-mx-4 md:-mx-6">
      {/* Topbar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="px-4 md:px-6">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-2 text-slate-700 hover:bg-slate-50" onClick={() => setOpen(!open)}>
                <Menu size={18} />
              </button>
              <h1 className="text-sm font-semibold text-slate-800">TailAdmin Preview</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-2 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar…"
                  className="w-40 md:w-64 rounded-md border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>
              <button className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-2 text-slate-700 hover:bg-slate-50">
                <Bell size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-4 px-4 md:px-6 mt-4">
        {/* Sidebar */}
        <aside className={`lg:block ${open ? 'block' : 'hidden'} lg:relative lg:top-0 lg:bg-transparent`}>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3">
            <div className="text-xs font-semibold text-slate-500 px-1 mb-2">Navegación</div>
            <nav className="space-y-1">
              <NavItem icon={<Home size={16} />} label="Dashboard" active />
              <NavItem icon={<Users size={16} />} label="Empleados" />
              <NavItem icon={<ClipboardList size={16} />} label="Asistencias" />
              <NavItem icon={<Wallet size={16} />} label="Pagos" />
              <NavItem icon={<Settings size={16} />} label="Ajustes" />
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="space-y-4">
          {/* Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Stat title="Empleados" value="128" trend="+2.1%" color="emerald" />
            <Stat title="Asistencias" value="1,246" trend="+0.4%" color="sky" />
            <Stat title="Recibos" value="312" trend="+1.0%" color="indigo" />
            <Stat title="Disciplinarias" value="8" trend="-12%" color="rose" />
          </div>

          {/* Contenido */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div className="xl:col-span-2">
              <Card title="Actividad reciente">
                <ul className="divide-y divide-slate-200 text-sm">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <li key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-700">Evento #{i + 1}</span>
                      </div>
                      <span className="text-xs text-slate-500">Hace {i + 1} h</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <div>
              <Card title="Atajos" actions={(
                <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-50">Editar</button>
              )}>
                <div className="grid grid-cols-2 gap-2">
                  {['Empleados', 'Asistencias', 'Recibos', 'Cuenta'].map((t) => (
                    <button key={t} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">
                      {t}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TemplatePreview;