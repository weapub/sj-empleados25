import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, Badge } from 'react-bootstrap';
import { Users, Phone, Shield } from 'lucide-react';
import Swal from 'sweetalert2';
import {
  getPresentismoRecipients,
  createPresentismoRecipient,
  updatePresentismoRecipient,
  deletePresentismoRecipient,
  getCurrentUser,
} from '../../services/api';

const emptyNew = { name: '', roleLabel: '', phone: '', active: true };

const PresentismoRecipients = () => {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRec, setNewRec] = useState({ ...emptyNew });
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getCurrentUser();
      setIsAdmin(me?.role === 'admin');
      const list = await getPresentismoRecipients();
      setRecipients(list || []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403) {
        setError('Acceso denegado. Solo admin.');
      } else {
        setError(e?.response?.data?.msg || e.message || 'Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    try {
      const payload = { ...newRec };
      if (!payload.phone) {
        Swal.fire({ icon: 'warning', title: 'Teléfono requerido', text: 'Ingrese el número con prefijo país. Ej: +54911...' });
        return;
      }
      const created = await createPresentismoRecipient(payload);
      setRecipients((prev) => [created, ...prev]);
      setNewRec({ ...emptyNew });
      Swal.fire({ icon: 'success', title: 'Destinatario agregado' });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo crear', text: e?.response?.data?.msg || e.message });
    }
  };

  const handleUpdate = async (id, changes) => {
    try {
      const updated = await updatePresentismoRecipient(id, changes);
      setRecipients((prev) => prev.map((r) => (r._id === id ? updated : r)));
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: e?.response?.data?.msg || e.message });
    }
  };

  const handleDelete = async (id) => {
    const ok = await Swal.fire({ icon: 'question', title: 'Eliminar destinatario?', showCancelButton: true, confirmButtonText: 'Eliminar' });
    if (!ok.isConfirmed) return;
    try {
      await deletePresentismoRecipient(id);
      setRecipients((prev) => prev.filter((r) => r._id !== id));
      Swal.fire({ icon: 'success', title: 'Eliminado' });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: e?.response?.data?.msg || e.message });
    }
  };

  return (
    <Container fluid className="px-4 md:px-6">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 inline-flex items-center gap-2">
          <Shield size={22} />
          <span>Destinatarios Informe de Presentismo</span>
        </h1>
        <p className="mt-1 text-slate-600">Configure los números que recibirán el reporte por WhatsApp.</p>
      </div>

      {error && (
        <Card className="mb-4">
          <Card.Body>
            <p className="text-red-600">{error}</p>
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4 leaflet-panel" style={{ ['--leaflet-accent']: '#0891b2' }}>
        <Card.Header className="leaflet-header">
          <h3 className="mb-0 font-semibold text-slate-700 inline-flex items-center gap-2">
            <Users size={20} />
            <span>Agregar destinatario</span>
            {!isAdmin && <Badge bg="secondary" className="ms-2">Solo admins pueden editar</Badge>}
          </h3>
        </Card.Header>
        <Card.Body className="leaflet-body">
          <Row className="gy-3">
            <Col md={3}>
              <Form.Control
                placeholder="Nombre (opcional)"
                value={newRec.name}
                onChange={(e) => setNewRec({ ...newRec, name: e.target.value })}
                disabled={!isAdmin}
              />
            </Col>
            <Col md={3}>
              <Form.Control
                placeholder="Rol/Área (ej. Contador)"
                value={newRec.roleLabel}
                onChange={(e) => setNewRec({ ...newRec, roleLabel: e.target.value })}
                disabled={!isAdmin}
              />
            </Col>
            <Col md={3}>
              <Form.Control
                placeholder="Teléfono (ej. +54911...)"
                value={newRec.phone}
                onChange={(e) => setNewRec({ ...newRec, phone: e.target.value })}
                disabled={!isAdmin}
              />
            </Col>
            <Col md={2} className="d-flex align-items-center">
              <Form.Check
                type="switch"
                id="active-switch"
                label="Activo"
                checked={newRec.active}
                onChange={(e) => setNewRec({ ...newRec, active: e.target.checked })}
                disabled={!isAdmin}
              />
            </Col>
            <Col md={1} className="d-flex align-items-center">
              <Button variant="primary" className="w-100" onClick={handleCreate} disabled={!isAdmin}>
                <Phone size={18} /> Guardar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="leaflet-panel" style={{ ['--leaflet-accent']: '#64748b' }}>
        <Card.Header className="leaflet-header">
          <h3 className="mb-0 font-semibold text-slate-700">Listado de destinatarios</h3>
        </Card.Header>
        <Card.Body className="leaflet-body">
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <Table responsive hover size="sm">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rol/Área</th>
                  <th>Teléfono</th>
                  <th>Activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <Form.Control
                        value={r.name || ''}
                        onChange={(e) => setRecipients((prev) => prev.map((x) => (x._id === r._id ? { ...x, name: e.target.value } : x)))}
                        disabled={!isAdmin}
                      />
                    </td>
                    <td>
                      <Form.Control
                        value={r.roleLabel || ''}
                        onChange={(e) => setRecipients((prev) => prev.map((x) => (x._id === r._id ? { ...x, roleLabel: e.target.value } : x)))}
                        disabled={!isAdmin}
                      />
                    </td>
                    <td>
                      <Form.Control
                        value={r.phone || ''}
                        onChange={(e) => setRecipients((prev) => prev.map((x) => (x._id === r._id ? { ...x, phone: e.target.value } : x)))}
                        disabled={!isAdmin}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="switch"
                        checked={!!r.active}
                        onChange={(e) => setRecipients((prev) => prev.map((x) => (x._id === r._id ? { ...x, active: e.target.checked } : x)))}
                        disabled={!isAdmin}
                      />
                    </td>
                    <td className="text-nowrap">
                      <Button
                        variant="success"
                        size="sm"
                        className="me-2"
                        onClick={() => handleUpdate(r._id, { name: r.name, roleLabel: r.roleLabel, phone: r.phone, active: r.active })}
                        disabled={!isAdmin}
                      >
                        Guardar
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(r._id)} disabled={!isAdmin}>
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
                {recipients.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-500">Sin destinatarios cargados. Use el formulario para agregar.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PresentismoRecipients;