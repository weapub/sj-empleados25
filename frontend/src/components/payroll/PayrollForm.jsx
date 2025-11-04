import React, { useEffect, useState } from 'react';
import { Container, Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { getEmployees, createPayrollReceipt, updatePayrollReceipt, getPayrollReceiptById } from '../../services/api';

const daysInMonth = (period) => {
  try {
    const [y, m] = period.split('-');
    return new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
  } catch (_) {
    return 30;
  }
};

const PayrollForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    period: new Date().toISOString().slice(0,7), // YYYY-MM
    paymentDate: new Date().toISOString().split('T')[0],
    signed: false,
    signedDate: '',
    hasPresentismo: false,
    extraHours: 0,
    otherAdditions: 0,
    discounts: 0,
    advanceRequested: false,
    advanceDate: '',
    advanceAmount: 0,
    netAmount: 0
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Error al cargar empleados:', err);
      }
    };
    loadEmployees();
  }, []);

  useEffect(() => {
    const loadReceipt = async () => {
      if (!isEdit) return;
      try {
        setLoading(true);
        const r = await getPayrollReceiptById(id);
        setFormData({
          employeeId: r.employee?._id || '',
          period: r.period,
          paymentDate: new Date(r.paymentDate).toISOString().split('T')[0],
          signed: Boolean(r.signed),
          signedDate: r.signedDate ? new Date(r.signedDate).toISOString().split('T')[0] : '',
          hasPresentismo: Boolean(r.hasPresentismo),
          extraHours: Number(r.extraHours) || 0,
          otherAdditions: Number(r.otherAdditions) || 0,
          discounts: Number(r.discounts) || 0,
          advanceRequested: Boolean(r.advanceRequested),
          advanceDate: r.advanceDate ? new Date(r.advanceDate).toISOString().split('T')[0] : '',
          advanceAmount: Number(r.advanceAmount) || 0,
          netAmount: Number(r.netAmount) || 0,
        });
      } catch (err) {
        console.error('Error al cargar recibo:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReceipt();
  }, [isEdit, id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'extraHours' || name === 'otherAdditions' || name === 'discounts' || name === 'advanceAmount' || name === 'netAmount') {
      setFormData({ ...formData, [name]: Number(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.period || !formData.paymentDate) {
      Swal.fire('Error', 'Complete los campos obligatorios', 'error');
      return;
    }
    try {
      setLoading(true);
      const payload = { ...formData };
      if (!formData.signed) payload.signedDate = '';
      if (!formData.advanceRequested) payload.advanceDate = '';
      if (isEdit) {
        await updatePayrollReceipt(id, payload);
        Swal.fire('Actualizado', 'Recibo actualizado correctamente', 'success');
      } else {
        await createPayrollReceipt(payload);
        Swal.fire('Guardado', 'Recibo creado correctamente', 'success');
      }
      navigate('/payroll');
    } catch (err) {
      console.error('Error al guardar recibo:', err);
      Swal.fire('Error', 'No se pudo guardar el recibo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const weeklyAmount = () => {
    const dim = daysInMonth(formData.period);
    const baseNet = Number(formData.netAmount) || 0;
    const advance = formData.advanceRequested ? (Number(formData.advanceAmount) || 0) : 0;
    return Math.round(((baseNet / dim) * 7) - advance);
  };

  return (
    <Container className="mt-4 px-2 md:px-4">
      <Card className="shadow-sm border border-slate-200/70">
        <Card.Body className="pt-3">
          <h3 className="text-xl font-semibold tracking-tight">{isEdit ? 'Editar Recibo' : 'Nuevo Recibo'}</h3>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Empleado</Form.Label>
                  <Form.Select name="employeeId" value={formData.employeeId} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {employees.map(e => (
                      <option key={e._id} value={e._id}>{e.nombre} {e.apellido} ({e.legajo})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Periodo (MM-YYYY)</Form.Label>
                  <Form.Control type="month" name="period" value={formData.period} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Pago</Form.Label>
                  <Form.Control type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} required />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Check type="checkbox" label="Firmado" name="signed" checked={formData.signed} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Firma</Form.Label>
                  <Form.Control type="date" name="signedDate" value={formData.signedDate} onChange={handleChange} disabled={!formData.signed} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Check type="checkbox" label="Presentismo" name="hasPresentismo" checked={formData.hasPresentismo} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Horas Extras (Monto)</Form.Label>
                  <Form.Control type="number" name="extraHours" value={formData.extraHours} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Otros Adicionales</Form.Label>
                  <Form.Control type="number" name="otherAdditions" value={formData.otherAdditions} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Descuentos</Form.Label>
                  <Form.Control type="number" name="discounts" value={formData.discounts} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>NETO A COBRAR (Mensual)</Form.Label>
                  <Form.Control type="number" name="netAmount" value={formData.netAmount} onChange={handleChange} required />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Check type="checkbox" label="Adelanto solicitado" name="advanceRequested" checked={formData.advanceRequested} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Adelanto</Form.Label>
                  <Form.Control type="date" name="advanceDate" value={formData.advanceDate} onChange={handleChange} disabled={!formData.advanceRequested} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Monto del Adelanto</Form.Label>
                  <Form.Control type="number" name="advanceAmount" value={formData.advanceAmount} onChange={handleChange} disabled={!formData.advanceRequested} />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-2">
                  <Form.Label>Monto semanal calculado</Form.Label>
                  <Form.Control type="text" readOnly value={`$${weeklyAmount().toLocaleString('es-AR')}`} />
                </Form.Group>
                <small className="text-muted">Fórmula: (NETO A COBRAR / días del mes × 7) - Adelanto</small>
              </Col>
            </Row>

            <div className="d-flex justify-content-between mt-4">
              <Button variant="secondary" onClick={() => navigate('/payroll')}>
                <FaArrowLeft className="me-1" /> Volver
              </Button>
              <Button variant="primary" type="submit" disabled={loading} className="shadow-sm">
                <FaSave className="me-1" /> {isEdit ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PayrollForm;