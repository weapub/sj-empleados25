import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getDashboardMetrics, sendPresentismoWhatsAppReport, previewPresentismoWhatsAppReport } from '../../services/api';
import { LayoutDashboard, Users, UserCheck, CalendarX, Clock, UserX, AlertTriangle, AlertCircle, Receipt, TrendingUp } from 'lucide-react';
import MetricCardAlt from '../common/MetricCardAlt';
import { isCanceledError } from '../../utils/http';
import Swal from 'sweetalert2';

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
    loading: true,
    error: false
  });
  // Deltas reales (calculados en backend); si no hay base, ocultar
  const [deltas, setDeltas] = useState({
    empleadosActivos: null,
    inasistenciasMes: null,
    tardanzasMes: null,
    sinPresentismo: null,
    apercibimientos: null,
    sancionesActivas: null,
    recibosPendientes: null,
    totalHistorico: null
  });

  const [sendingReport, setSendingReport] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const handleSendPresentismoReport = async () => {
    try {
      setSendingReport(true);
      // Primero obtener previsualización
      const preview = await previewPresentismoWhatsAppReport();
      setPreviewData(preview);
      setShowPreview(true);
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error al preparar informe',
        text: e?.response?.data?.msg || e.message || 'Error desconocido',
      });
    } finally {
      setSendingReport(false);
    }
  };

  const confirmSendReport = async () => {
    try {
      setSendingReport(true);
      const res = await sendPresentismoWhatsAppReport();
      setShowPreview(false);
      setPreviewData(null);
      Swal.fire({
        icon: 'success',
        title: 'Informe enviado',
        text: `Mes ${res.month}. Empleados: ${res.totalEmployees}. Destinos: ${res.destinations}.`,
      });
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error al enviar informe',
        text: e?.response?.data?.msg || e.message || 'Error desconocido',
      });
    } finally {
      setSendingReport(false);
    }
  };

  useEffect(() => {
    // Evitar solicitudes cuando no hay token (estado no autenticado)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setStats(prev => ({ ...prev, loading: false, error: false }));
      return; // No solicitar métricas si no hay sesión
    }

    const controller = new AbortController();
    const fetchStats = async () => {
      try {
        const metrics = await getDashboardMetrics({ signal: controller.signal });
        setStats(prev => ({
          ...prev,
          ...metrics,
          loading: false,
          error: false
        }));
        if (metrics?.deltas) {
          setDeltas(prev => ({ ...prev, ...metrics.deltas }));
        }
      } catch (error) {
        // Ignorar cancelaciones explícitas para evitar ruido en consola
        if (isCanceledError(error)) {
          return;
        }
        console.error('Error al cargar estadísticas:', error);
        setStats(prev => ({ ...prev, loading: false, error: true }));
      }
    };

    fetchStats();
    return () => {
      controller.abort();
    };
  }, []);

  const renderMetricCard = (title, value, icon, color, delta, to = null) => (
    <MetricCardAlt
      title={title}
      value={value}
      icon={icon}
      color={color}
      loading={stats.loading}
      error={stats.error}
      delta={delta}
      to={to}
    />
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
            <Users size={20} />
            <span>Métricas de Personal</span>
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
            <AlertTriangle size={20} />
            <span>Gestión Disciplinaria y Administrativa</span>
          </h2>
          <Row className="gy-4">
            {renderMetricCard('Apercibimientos', stats.apercibimientos, <AlertTriangle />, '#ea580c', deltas.apercibimientos, '/disciplinary')}
            {renderMetricCard('Sanciones Activas', stats.sancionesActivas, <AlertCircle />, '#ec4899', deltas.sancionesActivas, '/disciplinary')}
            {renderMetricCard('Recibos Pendientes', stats.recibosPendientes, <Receipt />, '#10b981', deltas.recibosPendientes, '/payroll')}
            {renderMetricCard('Total Histórico', stats.totalHistorico, <TrendingUp />, '#0891b2', deltas.totalHistorico, '/disciplinary')}
          </Row>
        </div>
      </div>

      {/* Acciones rápidas */}
      <Card className="quick-actions-card leaflet-panel" style={{ ['--leaflet-accent']: '#0891b2' }}>
        <Card.Header className="leaflet-header">
          <h3 className="mb-0 font-semibold text-slate-700 inline-flex items-center gap-2">
            <Users size={20} />
            <span>Acciones Rápidas</span>
          </h3>
        </Card.Header>
        <Card.Body className="leaflet-body space-y-2">
          <Row className="gy-3">
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/employees/new" variant="primary" className="w-100 py-3 rounded-md shadow-sm">
                <UserCheck size={20} /> <span>Nuevo Empleado</span>
              </Button>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/attendance" variant="success" className="w-100 py-3 rounded-md shadow-sm">
                <Clock size={20} /> <span>Registrar Asistencia</span>
              </Button>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/disciplinary/new" variant="warning" className="w-100 py-3 rounded-md shadow-sm">
                <AlertTriangle size={20} /> <span>Nueva Medida Disciplinaria</span>
              </Button>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/payroll/new" variant="info" className="w-100 py-3 rounded-md shadow-sm bg-gradient-to-br from-cyan-600 to-cyan-700 text-white border-0">
                <Receipt size={20} /> <span>Nuevo Recibo</span>
              </Button>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Button variant="secondary" className="w-100 py-2 rounded-md shadow-sm" disabled={sendingReport} onClick={handleSendPresentismoReport}>
                <Users size={20} /> <span>{sendingReport ? 'Enviando...' : 'Enviar informe Presentismo (WhatsApp)'}</span>
              </Button>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Button as={Link} to="/admin/presentismo/recipients" variant="outline-secondary" className="w-100 py-2 rounded-md shadow-sm">
                <Users size={20} /> <span>Configurar destinatarios Presentismo</span>
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Modal de previsualización del informe de Presentismo */}
      {showPreview && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.35)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title">Previsualización informe de Presentismo</h5>
                <button type="button" className="btn-close" onClick={() => setShowPreview(false)}></button>
              </div>
              <div className="modal-body">
                {previewData ? (
                  <div>
                    <p className="text-muted">Mes: {previewData.month}</p>
                    <p className="mb-2">Empleados sin presentismo: {previewData.totalEmployees}</p>
                    {Array.isArray(previewData.employees) && previewData.employees.length > 0 ? (
                      <ul className="list-group mb-3">
                        {previewData.employees.map((e, idx) => (
                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>{e.apellido} {e.nombre}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-600">No se registran pérdidas de presentismo por inasistencia en el período.</p>
                    )}
                    <div className="p-3 bg-light rounded border">
                      <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{previewData.message}</pre>
                    </div>
                  </div>
                ) : (
                  <p>Cargando previsualización...</p>
                )}
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowPreview(false)}>Cancelar</Button>
                <Button variant="primary" onClick={confirmSendReport} disabled={sendingReport}>
                  {sendingReport ? 'Enviando...' : 'Enviar por WhatsApp'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Dashboard;