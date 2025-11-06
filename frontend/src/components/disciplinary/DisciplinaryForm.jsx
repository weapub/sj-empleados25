import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { getEmployees, createDisciplinary, updateDisciplinary, getDisciplinaryById } from '../../services/api';
import Swal from 'sweetalert2';
import DocumentViewerModal from '../common/DocumentViewerModal';

const DisciplinaryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0,5),
    type: 'verbal',
    description: '',
    document: null,
    signed: false,
    signedDate: '',
    durationDays: '',
    returnToWorkDate: ''
  });
  const isEdit = Boolean(id);
  const [currentDocUrl, setCurrentDocUrl] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadDisciplinary(id);
    }
  }, [isEdit, id]);

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
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const loadDisciplinary = async (disciplinaryId) => {
    try {
      setLoading(true);
      const disciplinary = await getDisciplinaryById(disciplinaryId);
      setFormData({
        employeeId: disciplinary.employee?._id || '',
        date: new Date(disciplinary.date).toISOString().split('T')[0],
        time: disciplinary.time || '',
        type: disciplinary.type,
        description: disciplinary.description || '',
        document: null,
        signed: Boolean(disciplinary.signed),
        signedDate: disciplinary.signedDate ? new Date(disciplinary.signedDate).toISOString().split('T')[0] : '',
        durationDays: disciplinary.durationDays ?? '',
        returnToWorkDate: disciplinary.returnToWorkDate ? new Date(disciplinary.returnToWorkDate).toISOString().split('T')[0] : ''
      });
      setCurrentDocUrl(disciplinary.document || '');
    } catch (error) {
      console.error('Error al cargar la medida disciplinaria:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const openViewer = () => setViewerOpen(true);
  const closeViewer = () => setViewerOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.date || !formData.type) {
      Swal.fire('Error', 'Por favor complete los campos obligatorios', 'error');
      return;
    }

    if (!String(formData.description || '').trim()) {
      Swal.fire('Error', 'La descripción es obligatoria', 'error');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('employeeId', formData.employeeId);
      data.append('date', formData.date);
      if (formData.time) data.append('time', formData.time);
      data.append('type', formData.type);
      data.append('description', formData.description);
      data.append('signed', formData.signed);
      if (formData.signedDate) data.append('signedDate', formData.signedDate);
      if (formData.durationDays) data.append('durationDays', formData.durationDays);
      if (formData.returnToWorkDate) data.append('returnToWorkDate', formData.returnToWorkDate);
      if (formData.document) data.append('document', formData.document);

      if (isEdit) {
        await updateDisciplinary(id, data);
        Swal.fire('Actualizado', 'Medida disciplinaria actualizada correctamente', 'success');
      } else {
        await createDisciplinary(data);
        Swal.fire('Guardado', 'Medida disciplinaria registrada correctamente', 'success');
      }
      navigate('/disciplinary');
    } catch (error) {
      const backendMsg = error?.response?.data?.message || error?.response?.data?.msg;
      const displayMsg = backendMsg || 'No se pudo guardar la medida disciplinaria';
      console.error('Error al guardar:', error.response?.data || error.message);
      Swal.fire('Error', displayMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4 px-2 md:px-4">
      <Card className="shadow-sm border border-slate-200/70">
        <Card.Header as="h5" className="font-semibold">
          {isEdit ? 'Editar Medida Disciplinaria' : 'Registrar Nueva Medida Disciplinaria'}
        </Card.Header>
        <Card.Body className="pt-3">
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Empleado *</Form.Label>
                  <Form.Select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                    disabled={isEdit}
                  >
                    <option value="">Seleccione un empleado</option>
                    {(Array.isArray(employees) ? employees : []).map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.nombre} {employee.apellido} - Legajo: {employee.legajo}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha *</Form.Label>
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
                  <Form.Label>Hora *</Form.Label>
                  <Form.Control
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Días de suspensión</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="durationDays"
                    value={formData.durationDays}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
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

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Medida *</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="verbal">Verbal</option>
                    <option value="formal">Formal</option>
                    <option value="grave">Grave</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Documento (PDF, JPG, PNG)</Form.Label>
                  <Form.Control
                    type="file"
                    name="document"
                    onChange={handleChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <Form.Text className="text-muted">Tamaño máximo: 5MB</Form.Text>
                  {isEdit && currentDocUrl && (
                    <div className="mt-2">
                      <Button variant="outline-secondary" size="sm" className="shadow-sm" onClick={openViewer}>
                        Ver documento actual
                      </Button>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detalles de la medida disciplinaria"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Firmado por el empleado"
                    name="signed"
                    checked={formData.signed}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Firma</Form.Label>
                  <Form.Control
                    type="date"
                    name="signedDate"
                    value={formData.signedDate}
                    onChange={handleChange}
                    disabled={!formData.signed}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-between mt-4">
              <Button variant="secondary" className="shadow-sm" onClick={() => navigate('/disciplinary')}>
                <FaArrowLeft className="me-1" /> Volver
              </Button>
              <Button variant="primary" type="submit" disabled={loading} className="shadow-sm">
                <FaSave className="me-1" /> {isEdit ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      {isEdit && currentDocUrl && (
        <DocumentViewerModal
          show={viewerOpen}
          onHide={closeViewer}
          url={currentDocUrl}
          title="Documento actual de la medida"
        />
      )}
    </Container>
  );
};

export default DisciplinaryForm;