import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getDashboardMetrics } from '../../services/api';
import { FaUserCheck, FaCalendarTimes, FaClock, FaUserSlash, FaExclamationTriangle, FaExclamationCircle, FaFileInvoiceDollar, FaUsers, FaChartLine } from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState({
    empleadosActivos: 0,
    inasistenciasMes: 0,
    tardanzasMes: 0,
    sinPresentismo: 0,
    apercibimientos: 0,
    totalHistorico: 0,
    sancionesActivas: 0,
    recibosPendientes: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const metrics = await getDashboardMetrics();
        setStats({
          ...metrics,
          loading: false
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const renderMetricCard = (title, value, icon, color) => (
    <Col lg={3} md={6} sm={6} className="mb-4">
      <Card className="h-100 border-0 metric-card" style={{ borderLeft: `4px solid ${color}` }}>
        <Card.Body className="d-flex flex-column align-items-center position-relative">
          <div className="metric-icon-wrapper mb-3">
            {icon && React.cloneElement(icon, { size: 28, color })}
          </div>
          <Card.Title className="text-center mb-2 fs-6 fw-semibold">{title}</Card.Title>
          <Card.Text className="display-5 text-center fw-bold mb-0">
            {stats.loading ? '...' : value}
          </Card.Text>
          <div className="metric-overlay"></div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Container fluid>
      <div className="dashboard-header mb-5">
        <h1 className="page-title text-gradient">
          <FaChartLine className="me-3" />
          Dashboard de Gestión
        </h1>
        <p className="text-center text-muted fs-5">Panel de control y métricas del sistema</p>
      </div>
      
      {/* Métricas principales */}
      <div className="mb-5">
        <h2 className="section-title">
          <FaUsers className="me-2" />
          Métricas de Personal
        </h2>
        <Row>
          {renderMetricCard('Empleados Activos', stats.empleadosActivos, <FaUserCheck />, '#059669')}
          {renderMetricCard(
            'Inasistencias (Mes)', 
            stats.inasistenciasMes, 
            <FaCalendarTimes />, 
            '#dc3545',
            'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
          )}
          {renderMetricCard('Tardanzas (Mes)', stats.tardanzasMes, <FaClock />, '#f59e0b')}
          {renderMetricCard('Sin Presentismo', stats.sinPresentismo, <FaUserSlash />, '#64748b')}
        </Row>
      </div>

      {/* Métricas disciplinarias y administrativas */}
      <div className="mb-5">
        <h2 className="section-title">
          <FaExclamationTriangle className="me-2" />
          Gestión Disciplinaria y Administrativa
        </h2>
        <Row>
          {renderMetricCard('Apercibimientos', stats.apercibimientos, <FaExclamationTriangle />, '#ea580c')}
          {renderMetricCard('Sanciones Activas', stats.sancionesActivas, <FaExclamationCircle />, '#ec4899')}
          {renderMetricCard('Recibos Pendientes', stats.recibosPendientes, <FaFileInvoiceDollar />, '#10b981')}
          {renderMetricCard('Total Histórico', stats.totalHistorico, <FaChartLine />, '#0891b2')}
        </Row>
      </div>

      {/* Acciones rápidas */}
      <Card className="quick-actions-card">
        <Card.Header className="bg-white">
          <h3 className="mb-0">
            <FaUsers className="me-2" />
            Acciones Rápidas
          </h3>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/employees/new" variant="primary" className="w-100 py-3">
                <FaUserCheck className="me-2" />
                Nuevo Empleado
              </Button>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/attendance" variant="success" className="w-100 py-3">
                <FaClock className="me-2" />
                Registrar Asistencia
              </Button>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/disciplinary/new" variant="warning" className="w-100 py-3">
                <FaExclamationTriangle className="me-2" />
                Nueva Medida Disciplinaria
              </Button>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/payroll/new" variant="info" className="w-100 py-3" 
                     style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', border: 'none', color: '#fff' }}>
                <FaFileInvoiceDollar className="me-2" />
                Nuevo Recibo
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Dashboard;