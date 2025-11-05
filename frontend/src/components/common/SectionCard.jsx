import React from 'react';
import { Card } from 'react-bootstrap';

// Tarjeta de sección unificada con título, icono y acciones en el header
const SectionCard = ({ title, icon = null, headerRight = null, children, className = '' }) => {
  return (
    <Card className={`section-card shadow-sm border border-slate-200/70 rounded-xl ${className}`}>
      {(title || icon || headerRight) && (
        <Card.Header className="section-card-header bg-white rounded-top">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              {icon && <span className="text-slate-700">{icon}</span>}
              {title && <h5 className="mb-0 fw-semibold text-slate-700">{title}</h5>}
            </div>
            {headerRight && (
              <div className="d-flex align-items-center gap-2">
                {headerRight}
              </div>
            )}
          </div>
        </Card.Header>
      )}
      <Card.Body>{children}</Card.Body>
    </Card>
  );
};

export default SectionCard;