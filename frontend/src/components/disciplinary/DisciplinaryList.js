import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa';
import { getAllDisciplinaries, deleteDisciplinary } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import DocumentViewerModal from '../common/DocumentViewerModal';

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
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Medidas Disciplinarias</h2>
        <Button 
          variant="primary" 
          onClick={() => navigate('/disciplinary/new')}
        >
          <FaPlus className="me-1" /> Nueva Medida
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">{error}</Alert>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          {/* Vista escritorio - Tabla */}
          <div className="desktop-view">
            <Table striped bordered hover responsive className="disciplinary-table">
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
                        {disciplinary.employee ? 
                          `${disciplinary.employee.nombre} ${disciplinary.employee.apellido} (${disciplinary.employee.legajo})` : 
                          'Empleado no disponible'}
                      </td>
                      <td>{formatDate(disciplinary.date)}</td>
                      <td>{disciplinary.time || '-'}</td>
                      <td>
                        <Badge bg={getBadgeColor(disciplinary.type)}>
                          {getTypeText(disciplinary.type)}
                        </Badge>
                      </td>
                      <td>{disciplinary.durationDays ?? '-'}</td>
                      <td>{disciplinary.returnToWorkDate ? formatDate(disciplinary.returnToWorkDate) : '-'}</td>
                      <td>{disciplinary.signed ? 'Sí' : 'No'}</td>
                      <td>{disciplinary.signedDate ? formatDate(disciplinary.signedDate) : '-'}</td>
                      <td>
                        {disciplinary.document ? (
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => openViewer(disciplinary.document)}
                          >
                            <FaEye /> Ver
                          </Button>
                        ) : (
                          'No disponible'
                        )}
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => navigate(`/disciplinary/edit/${disciplinary._id}`)}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(disciplinary._id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      {error ? 'Error al cargar datos' : 'No hay medidas disciplinarias registradas'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Vista móvil - Tarjetas */}
          <div className="mobile-view">
            {disciplinaries.length > 0 ? (
              disciplinaries.map((d) => (
                <div className="mobile-card p-3 mb-3" key={d._id}>
                  <div className="mobile-card-header d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h5 className="mobile-card-title mb-1">
                        {d.employee ? `${d.employee.nombre} ${d.employee.apellido}` : 'Empleado no disponible'}
                      </h5>
                      <small className="text-muted">{d.employee?.legajo || '-'}</small>
                    </div>
                    <div className="mobile-card-badges">
                      <Badge bg={getBadgeColor(d.type)} className="text-capitalize">{getTypeText(d.type) || 'N/A'}</Badge>
                    </div>
                  </div>
                  <div className="mobile-card-fields">
                    <div className="mobile-card-field">
                      <span className="field-label">Fecha</span>
                      <span className="field-value">{formatDate(d.date)}</span>
                    </div>
                    <div className="mobile-card-field">
                      <span className="field-label">Hora</span>
                      <span className="field-value">{d.time || '-'}</span>
                    </div>
                    <div className="mobile-card-field">
                      <span className="field-label">Días suspensión</span>
                      <span className="field-value">{d.durationDays ?? '-'}</span>
                    </div>
                    <div className="mobile-card-field">
                      <span className="field-label">Reincorporación</span>
                      <span className="field-value">{d.returnToWorkDate ? formatDate(d.returnToWorkDate) : '-'}</span>
                    </div>
                    <div className="mobile-card-field">
                      <span className="field-label">Firmado</span>
                      <span className="field-value">{d.signed ? 'Sí' : 'No'}</span>
                    </div>
                    <div className="mobile-card-field">
                      <span className="field-label">Fecha firma</span>
                      <span className="field-value">{d.signedDate ? formatDate(d.signedDate) : '-'}</span>
                    </div>
                    <div className="mobile-card-field">
                      <span className="field-label">Documento</span>
                      <span className="field-value">
                        {d.document ? (
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            onClick={() => openViewer(d.document)}
                          >
                            <FaEye className="me-1" /> Ver
                          </Button>
                        ) : 'No disponible'}
                      </span>
                    </div>
                  </div>
                  <div className="mobile-card-actions d-flex justify-content-end">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="me-2" 
                      onClick={() => navigate(`/disciplinary/edit/${d._id}`)}
                    >
                      <FaEdit className="me-1" /> Editar
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleDelete(d._id)}
                    >
                      <FaTrash className="me-1" /> Eliminar
                    </Button>
                  </div>
                </div>
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