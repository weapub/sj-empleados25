import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, ListGroup, Form, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEmployeeById, deleteEmployee, getEmployeeEvents, createEmployeeEvent } from '../../services/api';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [newEventType, setNewEventType] = useState('general');
  const [newEventMessage, setNewEventMessage] = useState('');

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const data = await getEmployeeById(id);
        setEmployee(data);
      } catch (err) {
        setError('Error al cargar los datos del empleado');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const evs = await getEmployeeEvents(id);
        setEvents(evs);
      } catch (err) {
        console.error('Error al cargar eventos del empleado', err);
      }
    };
    fetchEvents();
  }, [id]);

  const openWhatsApp = (text) => {
    if (!employee || !employee.telefono) return;
    const phone = String(employee.telefono).replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const createEvent = async () => {
    if (!newEventMessage.trim()) return;
    try {
      await createEmployeeEvent({ employeeId: id, type: newEventType, message: newEventMessage });
      const evs = await getEmployeeEvents(id);
      setEvents(evs);
      setNewEventMessage('');
    } catch (err) {
      console.error('Error al crear evento', err);
    }
  };

  const templateMessage = (kind) => {
    const nombre = employee ? `${employee.nombre} ${employee.apellido}` : 'Empleado';
    const hoy = new Date().toLocaleDateString('es-AR');
    switch (kind) {
      case 'recibo_disponible':
        return `Hola ${nombre}, tu recibo de sueldo ya está disponible. Fecha ${hoy}.`;
      case 'recibo_firmado':
        return `Hola ${nombre}, confirmamos que tu recibo está firmado.`;
      case 'apercibimiento':
        return `Hola ${nombre}, se emitió un apercibimiento en tu legajo. Por favor revisa el detalle.`;
      case 'suspension': {
        const dias = prompt('¿Cuántos días dura la suspensión?');
        const retorno = prompt('¿Fecha de reincorporación (YYYY-MM-DD)?');
        return `Hola ${nombre}, se te ha aplicado una suspensión de ${dias} días. Debes presentarte a trabajar el ${retorno}.`;
      }
      case 'certificado_medico_vencido': {
        const fecha = prompt('¿Fecha de vencimiento (YYYY-MM-DD)?');
        return `Hola ${nombre}, venció el plazo para presentar tu certificado médico el ${fecha}.`;
      }
      case 'presentarse_trabajar': {
        const fecha = prompt('¿Fecha y hora de presentación?');
        return `Hola ${nombre}, debés presentarte a trabajar el ${fecha}.`;
      }
      case 'vacaciones': {
        const dias = prompt('¿Cuántos días de vacaciones?');
        const inicio = prompt('¿Fecha de inicio (YYYY-MM-DD)?');
        const fin = prompt('¿Fecha de fin (YYYY-MM-DD)?');
        return `Hola ${nombre}, tus vacaciones son de ${dias} días, desde ${inicio} hasta ${fin}.`;
      }
      default:
        return '';
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
      try {
        await deleteEmployee(id);
        navigate('/employees');
      } catch (err) {
        setError('Error al eliminar el empleado');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!employee) {
    return <Alert variant="warning">No se encontró el empleado</Alert>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Detalles del Empleado</h1>
        <div>
          <Link to="/employees" className="btn btn-secondary me-2">
            Volver
          </Link>
          <Link to={`/employees/edit/${id}`} className="btn btn-warning me-2">
            Editar
          </Link>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
          {events.length > 0 && (
            <Button
              className="ms-2"
              variant="success"
              disabled={!employee?.telefono}
              onClick={() => openWhatsApp(`Aviso: tu legajo fue actualizado. ${events[0]?.message}`)}
            >
              WhatsApp último evento
            </Button>
          )}
        </div>
      </div>

      <Card>
        <Card.Header as="h5">{employee.nombre} {employee.apellido}</Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <strong>Legajo:</strong> {employee.legajo || (employee.dni ? `SJ-${String(employee.dni).replace(/\D/g,'')}` : 'No especificado')}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>DNI:</strong> {employee.dni || 'No especificado'}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Email:</strong> {employee.email}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Teléfono:</strong> {employee.telefono || 'No especificado'}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Puesto:</strong> {employee.puesto}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Departamento:</strong> {employee.departamento}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Salario:</strong> ${employee.salario.toLocaleString()}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Fecha de Contratación:</strong> {
                employee.fechaContratacion 
                  ? new Date(employee.fechaContratacion).toLocaleDateString() 
                  : 'No especificada'
              }
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Estado:</strong> {employee.activo ? 'Activo' : 'Inactivo'}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>CUIT:</strong> {employee.cuit || 'No especificado'}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Fecha de Ingreso:</strong> {
                employee.fechaIngreso 
                  ? new Date(employee.fechaIngreso).toLocaleDateString() 
                  : 'No especificada'
              }
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Fecha de Registro en ARCA:</strong> {
                employee.fechaRegistroARCA 
                  ? new Date(employee.fechaRegistroARCA).toLocaleDateString() 
                  : 'No especificada'
              }
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Fecha de Nacimiento:</strong> {
                employee.fechaNacimiento 
                  ? new Date(employee.fechaNacimiento).toLocaleDateString() 
                  : 'No especificada'
              }
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Lugar de Nacimiento:</strong> {employee.lugarNacimiento || 'No especificado'}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Domicilio:</strong> {employee.domicilio || 'No especificado'}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Sucursal:</strong> {employee.sucursal || 'No especificada'}
            </ListGroup.Item>
          </ListGroup>
      </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header as="h5">Eventos del Legajo</Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label>Mensaje de evento</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={newEventMessage}
                  onChange={(e) => setNewEventMessage(e.target.value)}
                  placeholder="Escribe un mensaje para registrar y enviar por WhatsApp"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Tipo</Form.Label>
                <Form.Select value={newEventType} onChange={(e) => setNewEventType(e.target.value)}>
                  <option value="general">General</option>
                  <option value="recibo">Recibo</option>
                  <option value="disciplinario">Disciplinario</option>
                  <option value="certificado_medico">Certificado Médico</option>
                  <option value="vacaciones">Vacaciones</option>
                  <option value="presentacion">Presentación</option>
                  <option value="suspension">Suspensión</option>
                </Form.Select>
              </Form.Group>
              <div className="d-flex gap-2">
                <Button variant="primary" onClick={createEvent}>Registrar evento</Button>
                <Button
                  variant="success"
                  disabled={!employee?.telefono || !newEventMessage.trim()}
                  onClick={() => openWhatsApp(newEventMessage)}
                >
                  Enviar WhatsApp
                </Button>
              </div>
            </Col>
          </Row>

          <div className="mb-3">
            <strong>Plantillas rápidas:</strong>
            <div className="d-flex flex-wrap gap-2 mt-2">
              <Button size="sm" variant="outline-secondary" onClick={() => setNewEventMessage(templateMessage('recibo_disponible'))}>Recibo disponible</Button>
              <Button size="sm" variant="outline-secondary" onClick={() => setNewEventMessage(templateMessage('recibo_firmado'))}>Recibo firmado</Button>
              <Button size="sm" variant="outline-secondary" onClick={() => setNewEventMessage(templateMessage('apercibimiento'))}>Apercibimiento</Button>
              <Button size="sm" variant="outline-secondary" onClick={() => setNewEventMessage(templateMessage('suspension'))}>Suspensión</Button>
              <Button size="sm" variant="outline-secondary" onClick={() => setNewEventMessage(templateMessage('certificado_medico_vencido'))}>Certificado médico vencido</Button>
              <Button size="sm" variant="outline-secondary" onClick={() => setNewEventMessage(templateMessage('presentarse_trabajar'))}>Presentarse a trabajar</Button>
              <Button size="sm" variant="outline-secondary" onClick={() => setNewEventMessage(templateMessage('vacaciones'))}>Vacaciones</Button>
            </div>
          </div>

          {events.length === 0 ? (
            <Alert variant="info">No hay eventos registrados para este empleado.</Alert>
          ) : (
            <ListGroup>
              {events.map((ev) => (
                <ListGroup.Item key={ev._id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <div><strong>{new Date(ev.createdAt).toLocaleString('es-AR')}</strong></div>
                    <div>{ev.message}</div>
                  </div>
                  <div>
                    <Button
                      variant="success"
                      disabled={!employee?.telefono}
                      onClick={() => openWhatsApp(`Aviso de San Jorge Fiambres &amp; Quesos: ${ev.message}`)}
                    >
                      Enviar por WhatsApp
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default EmployeeDetail;
