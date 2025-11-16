import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { register } from '../../services/api';
import { useDynamicViewportHeight } from '../../utils/useDynamicViewportHeight';

const Register = ({ login: loginUser }) => {
  useDynamicViewportHeight();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    password2: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { nombre, email, password, password2 } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (password !== password2) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    
    try {
      const data = await register({ nombre, email, password });
      loginUser(data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-4 md:py-3 lg:py-2" style={{ minHeight: 'calc(var(--app-dvh) - 128px)' }}>
      <div className="w-full max-w-md px-3">
        <Card className="shadow-sm border border-slate-200">
          <Card.Header as="h5" className="text-center">Registrarse</Card.Header>
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={onSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={nombre}
                  onChange={onChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  required
                  minLength="6"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirmar Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  name="password2"
                  value={password2}
                  onChange={onChange}
                  required
                  minLength="6"
                />
              </Form.Group>
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100"
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Registrarse'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Register;