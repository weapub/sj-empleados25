import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, Button, Card, Badge, Row, Col, Form } from 'react-bootstrap';
import DocumentViewerModal from '../common/DocumentViewerModal';
import MobileCard from '../common/MobileCard';
import { getAttendances, getEmployees, deleteAttendance } from '../../services/api';
import PageHeader from '../common/PageHeader';
import SectionCard from '../common/SectionCard';
import { Clock, Plus } from 'lucide-react';
import { List } from 'react-window';

const AttendanceList = () => {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    employeeId: '',
    type: '',
    justified: ''
  });
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attendancesData, employeesData] = await Promise.all([
          getAttendances(),
          getEmployees()
        ]);
        setAttendances(attendancesData);
        setEmployees(employeesData);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value
    });
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este registro?')) {
      try {
        await deleteAttendance(id);
        setAttendances(attendances.filter(attendance => attendance._id !== id));
      } catch (err) {
        setError('Error al eliminar el registro');
      }
    }
  };

  const filteredAttendances = attendances.filter(attendance => {
    return (
      (filter.employeeId === '' || attendance.employee._id === filter.employeeId) &&
      (filter.type === '' || attendance.type === filter.type) &&
      (filter.justified === '' || 
        (filter.justified === 'true' && attendance.justified) || 
        (filter.justified === 'false' && !attendance.justified))
    );
  });

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    return employee ? `${employee.nombre} ${employee.apellido}` : 'Desconocido';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  };

  const typePriority = (type) => {
    // Define an order: inasistencia > tardanza > licencia medica > vacaciones > otros
    const order = {
      'inasistencia': 4,
      'tardanza': 3,
      'licencia medica': 2,
      'vacaciones': 1
    };
    return order[type] ?? 0;
  };

  const statusScore = (a) => {
    // Higher score means more "favorable" status
    // Justificado (2) + Presentismo conservado (1)
    const justifiedScore = a.justified ? 2 : 0;
    const presentismoScore = a.lostPresentismo ? 0 : 1;
    return justifiedScore + presentismoScore;
  };

  const typeAbbrev = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'inasistencia': return 'INAS';
      case 'tardanza': return 'TARD';
      case 'licencia medica': return 'LIC MED';
      case 'vacaciones': return 'VAC';
      default: return (type || '').toUpperCase();
    }
  };

  const handleSort = (e, key) => {
    if (e && e.altKey) {
      setSortBy('date');
      setSortDir('desc');
      setPage(1);
      return;
    }
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const renderSort = (key) => {
    if (sortBy !== key) return null;
    return sortDir === 'asc' ? <ChevronUp size={16} className="ms-1" /> : <ChevronDown size={16} className="ms-1" />;
  };

  const getName = (att) => att.employee ? `${att.employee.nombre} ${att.employee.apellido}` : 'Desconocido';

  const sortedAttendances = [...filteredAttendances].sort((a, b) => {
    let va = 0, vb = 0;
    switch (sortBy) {
      case 'employee':
        va = getName(a).toLowerCase();
        vb = getName(b).toLowerCase();
        break;
      case 'date':
        va = new Date(a.date).getTime();
        vb = new Date(b.date).getTime();
        break;
      case 'type':
        va = typePriority(a.type);
        vb = typePriority(b.type);
        break;
      case 'justified':
        va = a.justified ? 1 : 0;
        vb = b.justified ? 1 : 0;
        break;
      case 'presentismo':
        // 1 si conserva presentismo, 0 si lo pierde
        va = a.lostPresentismo ? 0 : 1;
        vb = b.lostPresentismo ? 0 : 1;
        break;
      case 'status':
        va = statusScore(a);
        vb = statusScore(b);
        break;
      case 'late':
        va = a.lateMinutes ?? 0;
        vb = b.lateMinutes ?? 0;
        break;
      default:
        va = new Date(a.date).getTime();
        vb = new Date(b.date).getTime();
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginación en cliente
  const totalCount = sortedAttendances.length;
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagedAttendances = sortedAttendances.slice(start, end);
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const goPrev = () => { if (canPrev) setPage(page - 1); };
  const goNext = () => { if (canNext) setPage(page + 1); };

  const openViewer = (url) => {
    setViewerUrl(url);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerUrl(null);
  };

  const isPdfUrl = (url) => {
    if (!url) return false;
    return /\.pdf($|\?)/i.test(url);
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png)($|\?)/i.test(url);
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="container-fluid px-2 md:px-4 space-y-4">
      <PageHeader
        icon={<Clock size={20} />}
        title="Inasistencias y Tardanzas"
        subtitle="Filtre, ordene y gestione los registros de asistencia"
        actions={(
          <Link to="/attendance/new">
            <Button variant="primary" className="shadow-sm">
              <Plus size={16} className="me-2" />
              Registrar Nueva
            </Button>
          </Link>
        )}
      />
      <div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="section-box mb-4">
        <div className="section-band" />
        <div className="p-3 p-md-4">
        <SectionCard title="Filtros" icon={<Clock size={20} />}>
        <Row className="mb-3 align-items-end">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Filtrar por Empleado</Form.Label>
              <Form.Select
                name="employeeId"
                value={filter.employeeId}
                onChange={handleFilterChange}
              >
                <option value="">Todos los empleados</option>
                {employees.map(employee => (
                  <option key={employee._id} value={employee._id}>
                    {employee.nombre} {employee.apellido}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Tipo</Form.Label>
              <Form.Select
                name="type"
                value={filter.type}
                onChange={handleFilterChange}
              >
                <option value="">Todos</option>
                <option value="inasistencia">Inasistencia</option>
                <option value="tardanza">Tardanza</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Justificado</Form.Label>
              <Form.Select
                name="justified"
                value={filter.justified}
                onChange={handleFilterChange}
              >
                <option value="">Todos</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={1} className="d-flex justify-content-end">
            <Button
              variant="outline-secondary"
              className="mt-2 shadow-sm"
              onClick={() => { setSortBy('date'); setSortDir('desc'); }}
            >
              Reset orden
            </Button>
          </Col>
        </Row>
        </SectionCard>
        </div>
        </div>
        
        {/* Vista de escritorio - Tabla con columna de Estado (tipo/justificado/presentismo) */}
        <div className="desktop-view">
          <div className="section-box">
          <div className="section-band" />
          <div className="p-3 p-md-4">
          <SectionCard title="Listado" icon={<Clock size={20} />}>
          <div className="table-responsive">
          <Table hover responsive className="attendance-table mb-0 align-middle text-sm">
            <thead>
              <tr>
                <th role="button" onClick={(e) => handleSort(e, 'employee')}>
                  Empleado {renderSort('employee')}
                </th>
                <th role="button" onClick={(e) => handleSort(e, 'date')}>
                  Fecha {renderSort('date')}
                </th>
                <th role="button" onClick={(e) => handleSort(e, 'status')}>
                  Estado {renderSort('status')}
                </th>
                <th role="button" onClick={(e) => handleSort(e, 'late')}>
                  Horario y tardanza {renderSort('late')}
                </th>
                <th>Vence cert.</th>
                <th>Inicio vacaciones</th>
                <th>Fin vacaciones</th>
                <th>Reincorporación</th>
                <th>Certificado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagedAttendances.length > 0 ? (
                pagedAttendances.map(attendance => (
                  <tr key={attendance._id}>
                    <td>
                      <div className="fw-semibold text-truncate" title={getName(attendance)}>
                        {getName(attendance)}
                      </div>
                      <small className="text-muted">Legajo: {attendance.employee?.legajo || '-'}</small>
                    </td>
                    <td>{formatDate(attendance.date)}</td>
                    <td>
                      <div
                        className="d-flex flex-wrap align-items-center"
                        title={`${attendance.type}: ${attendance.justified ? 'Justificado' : 'No justificado'} / ${attendance.lostPresentismo ? 'Sin presentismo' : 'Con presentismo'}`}
                      >
                        <span
                          className={`badge badge-soft ${attendance.type === 'inasistencia' ? 'badge-soft-danger' : attendance.type === 'tardanza' ? 'badge-soft-warning' : attendance.type === 'licencia medica' ? 'badge-soft-info' : 'badge-soft-primary'} me-1 mb-1`}
                        >
                          <span className="dot"></span>
                          {typeAbbrev(attendance.type)}
                        </span>
                        <span
                          className={`badge badge-soft ${attendance.justified ? 'badge-soft-success' : 'badge-soft-danger'} me-1 mb-1`}
                        >
                          <span className="dot"></span>
                          {attendance.justified ? 'JUST' : 'NO JUST'}
                        </span>
                        <span
                          className={`badge badge-soft ${attendance.lostPresentismo ? 'badge-soft-danger' : 'badge-soft-success'} mb-1`}
                        >
                          <span className="dot"></span>
                          {attendance.lostPresentismo ? 'SIN PRES' : 'CON PRES'}
                        </span>
                      </div>
                    </td>
                    <td title={`Hora establecida: ${attendance.scheduledEntry || '-'} / Hora registrada: ${attendance.actualEntry || '-'} / Tardanza: ${attendance.lateMinutes ?? 0} min`}>
                      {(() => {
                        const estab = attendance.scheduledEntry || '-';
                        const reg = attendance.actualEntry || '-';
                        const late = attendance.lateMinutes ?? 0;
                        const hasData = attendance.scheduledEntry || attendance.actualEntry || (late > 0);
                        return hasData ? `${estab} → ${reg} (${late} min)` : '-';
                      })()}
                    </td>
                    <td>{attendance.certificateExpiry ? formatDate(attendance.certificateExpiry) : '-'}</td>
                    <td>{attendance.vacationsStart ? formatDate(attendance.vacationsStart) : '-'}</td>
                    <td>{attendance.vacationsEnd ? formatDate(attendance.vacationsEnd) : '-'}</td>
                    <td>{attendance.returnToWorkDate ? formatDate(attendance.returnToWorkDate) : '-'}</td>
                    <td>
                      {attendance.justificationDocument ? (
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          className="me-2 shadow-sm"
                          onClick={() => openViewer(attendance.justificationDocument)}
                        >
                          Ver certificado
                        </Button>
                      ) : '-'}
                    </td>
                    <td>
                      <Link to={`/attendance/edit/${attendance._id}`} className="btn btn-sm btn-primary me-2 shadow-sm">
                        Editar
                      </Link>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        className="shadow-sm"
                        onClick={() => handleDelete(attendance._id)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center">No hay registros que coincidan con los filtros</td>
                </tr>
              )}
            </tbody>
          </Table>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">Total: {totalCount} — Página {page} de {totalPages}</small>
            <div>
              <Button variant="outline-secondary" size="sm" className="me-2" disabled={!canPrev} onClick={goPrev}>Anterior</Button>
              <Button variant="outline-secondary" size="sm" disabled={!canNext} onClick={goNext}>Siguiente</Button>
            </div>
          </div>
          </SectionCard>
          </div>
          </div>
        </div>

        {/* Vista móvil - Tarjetas */}
        <div className="mobile-view">
          {pagedAttendances.length > 0 ? (
            <List height={600} itemCount={pagedAttendances.length} itemSize={170} width={"100%"}>
              {({ index, style }) => {
                const attendance = pagedAttendances[index];
                // Preparar campos dinámicos según el tipo
                const fields = [
                  { label: 'Fecha', value: formatDate(attendance.date) }
                ];

              // Agregar campos específicos según el tipo
              if (attendance.type === 'tardanza') {
                const estab = attendance.scheduledEntry || '-';
                const reg = attendance.actualEntry || '-';
                const late = attendance.lateMinutes ?? 0;
                const hasData = attendance.scheduledEntry || attendance.actualEntry || (late > 0);
                if (hasData) {
                  fields.push({
                    label: 'Horario y tardanza',
                    value: `${estab} → ${reg} (${late} min)`
                  });
                }
              }

              if (attendance.type === 'licencia medica' && attendance.certificateExpiry) {
                fields.push({ label: 'Vence certificado', value: formatDate(attendance.certificateExpiry) });
              }

              if (attendance.type === 'vacaciones') {
                if (attendance.vacationsStart) fields.push({ label: 'Inicio vacaciones', value: formatDate(attendance.vacationsStart) });
                if (attendance.vacationsEnd) fields.push({ label: 'Fin vacaciones', value: formatDate(attendance.vacationsEnd) });
              }

              if (attendance.returnToWorkDate) {
                fields.push({ label: 'Reincorporación', value: formatDate(attendance.returnToWorkDate) });
              }

              // Preparar badges
              const badges = [
                {
                  text: attendance.type,
                  soft: true,
                  variant: attendance.type === 'inasistencia' ? 'danger' :
                          attendance.type === 'tardanza' ? 'warning' :
                          attendance.type === 'licencia medica' ? 'info' :
                          attendance.type === 'vacaciones' ? 'primary' : 'primary'
                },
                {
                  text: attendance.justified ? 'Justificado' : 'No justificado',
                  soft: true,
                  variant: attendance.justified ? 'success' : 'danger'
                },
                {
                  text: attendance.lostPresentismo ? 'Sin presentismo' : 'Con presentismo',
                  soft: true,
                  variant: attendance.lostPresentismo ? 'danger' : 'success'
                }
              ];

              // Preparar acciones
              const actions = [
                {
                  text: 'Editar',
                  variant: 'primary',
                  onClick: () => window.location.href = `/attendance/edit/${attendance._id}`
                },
                {
                  text: 'Eliminar',
                  variant: 'danger',
                  onClick: () => handleDelete(attendance._id)
                }
              ];

              // Agregar acción de ver certificado si existe
              if (attendance.justificationDocument) {
                actions.unshift({
                  text: 'Ver certificado',
                  variant: 'outline-secondary',
                  onClick: () => openViewer(attendance.justificationDocument)
                });
              }

              return (
                <div style={style}>
                  <MobileCard
                    key={attendance._id}
                    title={attendance.employee ? `${attendance.employee.nombre} ${attendance.employee.apellido}` : 'Empleado desconocido'}
                    subtitle={`Legajo: ${attendance.employee?.legajo || '-'}`}
                    fields={fields}
                    badges={badges}
                    actions={actions}
                  />
                </div>
              );
              }}
            </List>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">No hay registros que coincidan con los filtros</p>
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">Total: {totalCount} — Página {page} de {totalPages}</small>
            <div>
              <Button variant="outline-secondary" size="sm" className="me-2" disabled={!canPrev} onClick={goPrev}>Anterior</Button>
              <Button variant="outline-secondary" size="sm" disabled={!canNext} onClick={goNext}>Siguiente</Button>
            </div>
          </div>
        </div>
      </div>
      <DocumentViewerModal 
        show={viewerOpen}
        onHide={closeViewer}
        url={viewerUrl}
        title="Documento de asistencia"
      />
    </div>
  );
};

export default AttendanceList;