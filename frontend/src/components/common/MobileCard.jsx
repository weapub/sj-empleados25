import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';

const MobileCard = ({ 
  title, 
  subtitle, 
  fields = [], 
  badges = [], 
  actions = [], 
  className = '' 
}) => {
  return (
    <Card className={`mobile-card mb-3 ${className}`}>
      <Card.Body>
        {/* Header con título y subtítulo */}
        <div className="mobile-card-header mb-3">
          <h6 className="mobile-card-title mb-1">{title}</h6>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mobile-card-badges mb-3 d-flex flex-wrap gap-2">
            {badges.map((badge, index) => {
              const variantKey = (badge.variant || 'primary').toLowerCase();
              // Map "dark" to a neutral soft style; keep real "secondary" as its own
              const softClass = `badge-soft-${variantKey === 'dark' ? 'secondary' : variantKey}`;
              return badge.soft ? (
                <span
                  key={index}
                  className={`badge badge-soft ${badge.variantClass || softClass}`}
                >
                  <span className="dot"></span>
                  {badge.text}
                </span>
              ) : (
                <Badge 
                  key={index} 
                  bg={badge.variant || 'secondary'} 
                  className=""
                >
                  {badge.text}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Campos de información */}
        {fields.length > 0 && (
          <div className="mobile-card-fields mb-3">
            {fields.map((field, index) => (
              <div key={index} className="mobile-card-field">
                <span className="field-label">{field.label}:</span>
                <span className="field-value">{field.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Acciones */}
        {actions.length > 0 && (
          <div className="mobile-card-actions d-flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline-primary'}
                size="sm"
                className=""
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon && action.icon} <span>{action.text}</span>
              </Button>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MobileCard;