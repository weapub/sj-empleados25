import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Alert } from 'react-bootstrap';
import { Pencil, Trash2, Eye, Plus, Gavel } from 'lucide-react';
import { getAllDisciplinaries, deleteDisciplinary } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import DocumentViewerModal from '../common/DocumentViewerModal';
import PageHeader from '../common/PageHeader';
import SectionCard from '../common/SectionCard';
import MobileCard from '../common/MobileCard';

const DisciplinaryList = () => {
  const [disciplinaries, setDisciplinaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDisciplinaries();
  }, []);

  const loadDisciplinaries = async () => {
    try {
      setLoading(true);
      const response = await getAllDisciplinaries();
      setDisciplinaries(response);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar medidas disciplinarias:', error);
      const backendMsg = error?.response?.data?.message || error?.response?.data?.msg;
      setError(backendMsg || 'No se pudieron cargar las medidas disciplinarias');
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDisciplinary(id);
          Swal.fire('Eliminado', 'La medida disciplinaria ha sido eliminada', 'success');
          loadDisciplinaries();
        } catch (error) {
          console.error('Error al eliminar:', error);
          Swal.fire('Error', 'No se pudo eliminar la medida disciplinaria', 'error');
        }
      }
    });
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'verbal':
        return 'warning';
      case 'formal':
        return 'primary';
      case 'grave':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'verbal':
        return 'Verbal';
      case 'formal':
        return 'Formal';
      case 'grave':
        return 'Grave';
      default:
        return type;
    }
  };

  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const openViewer = (url) => {
    setViewerUrl(url);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerUrl(null);
  };

  return (
    <Container fluid className="mt-4 px-2 md:px-4">
      <PageHeader
        icon={<Gavel size={20} />}
        title="Medidas Disciplinarias"
        subtitle="Registre, consulte y gestione las medidas disciplinarias"
        accentColor="#ef4444"
        actions={(
          <Button 
            variant="primary"
            className="shadow-sm"
            onClick={() => navigate('/disciplinary/new')}
          >
            <Plus size={16} /> <span>Nueva Medida</span>
          </Button>
        )}
      />

      {error && (
        <Alert variant="danger" className="mb-3">{error}</Alert>
      )}

      {loading ? (
        <p className="p-3">Cargando...</p>
      ) : (
        <>
          {/* Vista de escritorio */}
          <div className="d-none d-md-block">
          <div className="section-box">
            <div className="section-band" />
            <div className="p-3 p-md-4">
<SectionCard title="Listado" icon={<Gavel size={20} />} accentColor="#ef4444"> 
              <div className="table-responsive">
                <Table hover responsive className="disciplinary-table mb-0 align-middle text-sm">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Tipo</th>
                      <th>Días suspensión</th>
                      <th>Reincorporación</th>
                      <th>Firmado</th>
                      <th>Fecha de Firma</th>
                      <th>Documento</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplinaries.length > 0 ? (
                      disciplinaries.map((disciplinary) => (
                        <tr key={disciplinary._id}>
                          <td>
                            {disciplinary.employee ? (
                              <>
                                <div className="fw-semibold text-truncate" title={`${disciplinary.employee.nombre} ${disciplinary.employee.apellido}`}>
                                  {disciplinary.employee.nombre} {disciplinary.employee.apellido}
                                </div>
                                <small className="text-muted">Legajo: {disciplinary.employee.legajo || '-'}</small>
                              </>
                            ) : 'Empleado no disponible'}
                          </td>
                          <td>{formatDate(disciplinary.date)}</td>
                          <td>{disciplinary.time || '-'}</td>
                          <td>
                            <span className={`badge badge-soft badge-soft-${getBadgeColor(disciplinary.type)}`}>
                              <span className="dot"></span>
                              {getTypeText(disciplinary.type)}
                            </span>
                          </td>
                          <td>{disciplinary.durationDays ?? '-'}</td>
                          <td>{disciplinary.returnToWorkDate ? formatDate(disciplinary.returnToWorkDate) : '-'}</td>
                          <td>{disciplinary.signed ? 'Sí' : 'No'}</td>
                          <td>{disciplinary.signedDate ? formatDate(disciplinary.signedDate) : '-'}</td>
                          <td>
                            {disciplinary.document ? (
                              <Button 
                                variant="success" 
                                size="sm"
                                className="shadow-sm"
                              onClick={() => openViewer(disciplinary.document)}
                              >
                                <Eye size={16} /> <span>Ver</span>
                              </Button>
                            ) : (
                              'No disponible'
                            )}
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="me-2 shadow-sm"
                              onClick={() => navigate(`/disciplinary/edit/${disciplinary._id}`)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="shadow-sm"
                              onClick={() => handleDelete(disciplinary._id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center">
                          {error ? 'Error al cargar datos' : 'No hay medidas disciplinarias registradas'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              </SectionCard>
            </div>
          </div>
          </div>

          {/* Vista móvil */}
          <div className="d-md-none">
            {disciplinaries.length > 0 ? (
              disciplinaries.map((d) => (
                <MobileCard
                  key={d._id}
                  title={d.employee ? `${d.employee.nombre} ${d.employee.apellido}` : 'Empleado no disponible'}
                  subtitle={`Legajo: ${d.employee?.legajo || '-'}`}
                  accentColor="#ef4444"
                  badges={[{ text: getTypeText(d.type) || 'N/A', variant: getBadgeColor(d.type) }]}
                  fields={[
                    { label: 'Fecha', value: formatDate(d.date) },
                    { label: 'Hora', value: d.time || '-' },
                    { label: 'Días suspensión', value: d.durationDays ?? '-' },
                    { label: 'Reincorporación', value: d.returnToWorkDate ? formatDate(d.returnToWorkDate) : '-' },
                    { label: 'Firmado', value: d.signed ? 'Sí' : 'No' },
                    { label: 'Fecha firma', value: d.signedDate ? formatDate(d.signedDate) : '-' },
                    { label: 'Documento', value: d.document ? 'Disponible' : 'No disponible' },
                  ]}
                  actions={[
                    d.document ? {
                      text: 'Ver Documento',
                      variant: 'success',
                      size: 'sm',
                      onClick: () => openViewer(d.document)
                    } : null,
                    {
                      text: <Pencil size={16} />, 
                      variant: 'outline-primary',
                      size: 'sm',
                      onClick: () => navigate(`/disciplinary/edit/${d._id}`)
                    },
                    {
                      text: <Trash2 size={16} />, 
                      variant: 'outline-danger',
                      size: 'sm',
                      onClick: () => handleDelete(d._id)
                    }
                  ].filter(Boolean)}
                />
              ))
            ) : (
              <div className="alert alert-light">No se encontraron medidas disciplinarias</div>
            )}
          </div>
        </>
      )}

      <DocumentViewerModal 
        show={viewerOpen}
        onHide={closeViewer}
        url={viewerUrl}
        title="Documento de medida disciplinaria"
      />
    </Container>
  );
};

export default DisciplinaryList;