import React from 'react';
import TemplateLayout from './TemplateLayout';

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

const TemplateDashboard = () => {
  return (
    <TemplateLayout title="Dashboard (TailAdmin)">
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
    </TemplateLayout>
  );
};

export default TemplateDashboard;