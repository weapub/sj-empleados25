import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import DocumentViewerModal from '../common/DocumentViewerModal';
import { getEmployees, createAttendance, getAttendances, updateAttendance } from '../../services/api';

const AttendanceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentDocUrl, setCurrentDocUrl] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'inasistencia',
    justified: false,
    lostPresentismo: true,
    comments: '',
    justificationDocument: null,
    scheduledEntry: '',
    actualEntry: '',
    certificateExpiry: '',
    vacationsStart: '',
    vacationsEnd: '',
    suspensionDays: '',
    returnToWorkDate: ''
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        // getEmployees puede devolver { data, total, page, totalPages } o un array
        const employeesArray = Array.isArray(data)
          ? data
          : (data && Array.isArray(data.data))
            ? data.data
            : [];
        setEmployees(employeesArray);
        // No marcar loading false aún si estamos en edición; esperemos a cargar el registro
        if (!isEdit) setLoading(false);
      } catch (err) {
        setError('Error al cargar los empleados');
        setLoading(false);
      }
    };

    loadEmployees();
  }, [isEdit]);

  useEffect(() => {
    const toYMD = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');
    const loadAttendance = async () => {
      if (!isEdit) return;
      try {
        const all = await getAttendances();
        const att = all.find((a) => a._id === id);
        if (!att) {
          setError('Registro de asistencia no encontrado');
          setLoading(false);
          return;
        }
        setFormData({
          employeeId: att.employee?._id || '',
          date: toYMD(att.date) || new Date().toISOString().split('T')[0],
          type: att.type || 'inasistencia',
          justified: !!att.justified,
          lostPresentismo: !!att.lostPresentismo,
          comments: att.comments || '',
          justificationDocument: null,
          scheduledEntry: att.scheduledEntry || '',
          actualEntry: att.actualEntry || '',
          certificateExpiry: toYMD(att.certificateExpiry),
          vacationsStart: toYMD(att.vacationsStart),
          vacationsEnd: toYMD(att.vacationsEnd),
          suspensionDays: att.suspensionDays ?? '',
          returnToWorkDate: toYMD(att.returnToWorkDate)
        });
        setCurrentDocUrl(att.justificationDocument || '');
      } catch (err) {
        setError('Error al cargar el registro de asistencia');
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, [id, isEdit]);

  // Limpiar campos que no aplican al cambiar el tipo
  useEffect(() => {
    setFormData(prev => {
      const next = { ...prev };
      if (prev.type !== 'tardanza') {
        next.scheduledEntry = '';
        next.actualEntry = '';
      }
      if (prev.type !== 'licencia medica') {
        next.certificateExpiry = '';
      }
      if (prev.type !== 'vacaciones') {
        next.vacationsStart = '';
        next.vacationsEnd = '';
      }
      if (prev.type !== 'sancion recibida') {
        next.suspensionDays = '';
        // Mantener returnToWorkDate si viene de licencia; si no aplica, limpiarlo
        next.returnToWorkDate = '';
      }
      return next;
    });
  }, [formData.type]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setFormData({
        ...formData,
        [name]: files[0]
      });
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Crear FormData para enviar archivos
      const submitData = new FormData();
      submitData.append('employeeId', formData.employeeId);
      submitData.append('date', formData.date);
      submitData.append('type', formData.type);
      submitData.append('justified', formData.justified);
      submitData.append('lostPresentismo', formData.lostPresentismo);
      submitData.append('comments', formData.comments);
      if (formData.scheduledEntry) submitData.append('scheduledEntry', formData.scheduledEntry);
      if (formData.actualEntry) submitData.append('actualEntry', formData.actualEntry);
      if (formData.certificateExpiry) submitData.append('certificateExpiry', formData.certificateExpiry);
      if (formData.vacationsStart) submitData.append('vacationsStart', formData.vacationsStart);
      if (formData.vacationsEnd) submitData.append('vacationsEnd', formData.vacationsEnd);
      if (formData.suspensionDays) submitData.append('suspensionDays', formData.suspensionDays);
      if (formData.returnToWorkDate) submitData.append('returnToWorkDate', formData.returnToWorkDate);
      
      if (formData.justificationDocument) {
        submitData.append('justificationDocument', formData.justificationDocument);
      }
      
      if (isEdit) {
        await updateAttendance(id, submitData);
        setSuccess('Registro de asistencia actualizado correctamente');
      } else {
        await createAttendance(submitData);
        setSuccess('Registro de asistencia creado correctamente');
      }
      
      // Resetear formulario
      setFormData({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        type: 'inasistencia',
        justified: false,
        lostPresentismo: true,
        comments: '',
        justificationDocument: null,
        scheduledEntry: '',
        actualEntry: '',
        certificateExpiry: '',
        vacationsStart: '',
        vacationsEnd: '',
        suspensionDays: '',
        returnToWorkDate: ''
      });
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/attendance');
      }, 2000);
      
    } catch (err) {
      const serverMsg = err?.response?.data?.msg || err?.message;
      setError(serverMsg || (isEdit ? 'Error al actualizar el registro de asistencia' : 'Error al crear el registro de asistencia'));
    }
  };

  if (loading) return <div className="p-3">Cargando...</div>;

  return (
    <div className="container-fluid px-2 md:px-4 space-y-4">
      <Card className="shadow-sm border border-slate-200/70">
        <Card.Header>
          <h4 className="mb-0 text-xl font-semibold tracking-tight">{isEdit ? 'Editar Inasistencia/Tardanza' : 'Registrar Inasistencia/Tardanza'}</h4>
        </Card.Header>
        <Card.Body className="pt-3">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Empleado</Form.Label>
                <Form.Select 
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar Empleado</option>
                  {(Array.isArray(employees) ? employees : []).map(employee => (
                    <option key={employee._id} value={employee._id}>
                      {employee.nombre} {employee.apellido} - Legajo: {employee.legajo}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo</Form.Label>
                <Form.Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="inasistencia">Inasistencia</option>
                  <option value="tardanza">Tardanza</option>
                  <option value="licencia medica">Licencia Médica</option>
                  <option value="vacaciones">Vacaciones</option>
                  <option value="sancion recibida">Sanción Recibida</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Certificado Médico</Form.Label>
                <Form.Control
                  type="file"
                  name="justificationDocument"
                  onChange={handleChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                <Form.Text className="text-muted">
                  Formatos permitidos: JPG, PNG, PDF (máx. 5MB)
                </Form.Text>
                {currentDocUrl && (
                  <div className="mt-2">
                    <Button variant="outline-secondary" size="sm" className="shadow-sm" onClick={() => setViewerOpen(true)}>
                      Ver certificado actual
                    </Button>
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          {formData.type === 'tardanza' && (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hora de entrada establecida</Form.Label>
                  <Form.Control
                    type="time"
                    name="scheduledEntry"
                    value={formData.scheduledEntry}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hora de entrada registrada</Form.Label>
                  <Form.Control
                    type="time"
                    name="actualEntry"
                    value={formData.actualEntry}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          )}

          {formData.type === 'licencia medica' && (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vencimiento del certificado</Form.Label>
                  <Form.Control
                    type="date"
                    name="certificateExpiry"
                    value={formData.certificateExpiry}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de reincorporación</Form.Label>
                  <Form.Control
                    type="date"
                    name="returnToWorkDate"
                    value={formData.returnToWorkDate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}

          {formData.type === 'vacaciones' && (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Inicio de vacaciones</Form.Label>
                  <Form.Control
                    type="date"
                    name="vacationsStart"
                    value={formData.vacationsStart}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fin de vacaciones</Form.Label>
                  <Form.Control
                    type="date"
                    name="vacationsEnd"
                    value={formData.vacationsEnd}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}

          {formData.type === 'sancion recibida' && (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Días de suspensión</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="suspensionDays"
                    value={formData.suspensionDays}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de reincorporación</Form.Label>
                  <Form.Control
                    type="date"
                    name="returnToWorkDate"
                    value={formData.returnToWorkDate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Justificado"
                  name="justified"
                  checked={formData.justified}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Pierde Presentismo"
                  name="lostPresentismo"
                  checked={formData.lostPresentismo}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Comentarios</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="comments"
              value={formData.comments}
              onChange={handleChange}
            />
          </Form.Group>
          
          <div className="d-flex justify-content-end mt-2">
            <Button variant="secondary" className="me-2" onClick={() => navigate('/attendance')}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar
            </Button>
          </div>
        </Form>
        </Card.Body>
        {currentDocUrl && (
          <DocumentViewerModal
            show={viewerOpen}
            onHide={() => setViewerOpen(false)}
            url={currentDocUrl}
            title="Certificado médico"
          />
        )}
      </Card>
    </div>
  );
};

export default AttendanceForm;