import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getDashboardMetrics } from '../../services/api';
import { LayoutDashboard, Users, UserCheck, CalendarX, Clock, UserX, AlertTriangle, AlertCircle, Receipt, TrendingUp } from 'lucide-react';
import MetricCardAlt from '../common/MetricCardAlt';

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
  // Deltas para emular variaciones como en la imagen
  const [deltas, setDeltas] = useState({
    empleadosActivos: '+5%',
    inasistenciasMes: '-2%',
    tardanzasMes: '+8%',
    sinPresentismo: '-1%',
    apercibimientos: '+3%',
    sancionesActivas: '+1%',
    recibosPendientes: '+2%',
    totalHistorico: '+4%'
  });

  useEffect(() => {
    const controller = new AbortController();
    const fetchStats = async () => {
      try {
        const metrics = await getDashboardMetrics({ signal: controller.signal });
        setStats({
          ...metrics,
          loading: false
        });
      } catch (error) {
        // Ignorar cancelaciones explícitas para evitar ruido en consola
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
          return;
        }
        console.error('Error al cargar estadísticas:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
    return () => {
      controller.abort();
    };
  }, []);

  const renderMetricCard = (title, value, icon, color, delta) => (
    <MetricCardAlt title={title} value={value} icon={icon} color={color} loading={stats.loading} delta={delta} />
  );

  return (
    <Container fluid className="px-4 md:px-6">
      <div className="dashboard-header mb-5">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 inline-flex items-center gap-2">
          <LayoutDashboard size={22} />
          <span>Dashboard de Gestión</span>
        </h1>
        <p className="mt-1 text-slate-600">Panel de control y métricas del sistema</p>
      </div>
      
      {/* Métricas principales */}
      <div className="section-box mb-5">
        <div className="section-band" />
        <div className="p-3 p-md-4">
          <h2 className="section-title font-semibold text-slate-700 inline-flex items-center gap-2">
            <Users size={20} className="me-2" />
            Métricas de Personal
          </h2>
          <Row className="gy-4">
            {renderMetricCard('Empleados Activos', stats.empleadosActivos, <UserCheck />, '#059669', deltas.empleadosActivos)}
            {renderMetricCard('Inasistencias (Mes)', stats.inasistenciasMes, <CalendarX />, '#dc3545', deltas.inasistenciasMes)}
            {renderMetricCard('Tardanzas (Mes)', stats.tardanzasMes, <Clock />, '#f59e0b', deltas.tardanzasMes)}
            {renderMetricCard('Sin Presentismo', stats.sinPresentismo, <UserX />, '#64748b', deltas.sinPresentismo)}
          </Row>
        </div>
      </div>

      {/* Métricas disciplinarias y administrativas */}
      <div className="section-box mb-5">
        <div className="section-band" />
        <div className="p-3 p-md-4">
          <h2 className="section-title font-semibold text-slate-700 inline-flex items-center gap-2">
            <AlertTriangle size={20} className="me-2" />
            Gestión Disciplinaria y Administrativa
          </h2>
          <Row className="gy-4">
            {renderMetricCard('Apercibimientos', stats.apercibimientos, <AlertTriangle />, '#ea580c', deltas.apercibimientos)}
            {renderMetricCard('Sanciones Activas', stats.sancionesActivas, <AlertCircle />, '#ec4899', deltas.sancionesActivas)}
            {renderMetricCard('Recibos Pendientes', stats.recibosPendientes, <Receipt />, '#10b981', deltas.recibosPendientes)}
            {renderMetricCard('Total Histórico', stats.totalHistorico, <TrendingUp />, '#0891b2', deltas.totalHistorico)}
          </Row>
        </div>
      </div>

      {/* Acciones rápidas */}
      <Card className="quick-actions-card shadow-sm border border-slate-200/70 rounded-xl">
        <Card.Header className="bg-white rounded-t-xl">
          <h3 className="mb-0 font-semibold text-slate-700 inline-flex items-center gap-2">
            <Users size={20} />
            <span>Acciones Rápidas</span>
          </h3>
        </Card.Header>
        <Card.Body className="space-y-2">
          <Row className="gy-3">
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/employees/new" variant="primary" className="w-100 py-3 rounded-md shadow-sm">
                <UserCheck size={20} className="me-2" />
                Nuevo Empleado
              </Button>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/attendance" variant="success" className="w-100 py-3 rounded-md shadow-sm">
                <Clock size={20} className="me-2" />
                Registrar Asistencia
              </Button>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/disciplinary/new" variant="warning" className="w-100 py-3 rounded-md shadow-sm">
                <AlertTriangle size={20} className="me-2" />
                Nueva Medida Disciplinaria
              </Button>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/payroll/new" variant="info" className="w-100 py-3 rounded-md shadow-sm bg-gradient-to-br from-cyan-600 to-cyan-700 text-white border-0">
                <Receipt size={20} className="me-2" />
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