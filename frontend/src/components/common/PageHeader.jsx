import React, { useEffect } from 'react';
import { Button } from 'react-bootstrap';

// Encabezado de página unificado con icono, título, subtítulo y acciones opcionales
const PageHeader = ({ icon = null, title, subtitle = '', actions = null, className = '', accentColor = '#64748b' }) => {
  // Propagar acento a nivel global para coherencia con Navbar y botones
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (root) {
        root.style.setProperty('--leaflet-accent', accentColor);
      }
    } catch (_) {}
  }, [accentColor]);

  return (
    <div className={`page-header mb-4 leaflet-panel ${className}`} style={{ ['--leaflet-accent']: accentColor }}>
      <div className="leaflet-header p-3 rounded-md">
        <div className="d-flex align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            {icon && (
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full text-white shadow-sm"
                   style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor} 100%)` }}>
                {icon}
              </div>
            )}
            <div>
              <h1 className="m-0 text-2xl md:text-3xl fw-bold tracking-tight text-slate-900">
                {title}
              </h1>
              {subtitle && (
                <p className="m-0 mt-1 text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="header-actions d-flex align-items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;