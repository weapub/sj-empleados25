import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { login } from '../../services/api';
import { useDynamicViewportHeight } from '../../utils/useDynamicViewportHeight';

const Login = ({ login: loginUser }) => {
  useDynamicViewportHeight();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await login({ email, password });
      loginUser(data.token);
      // Prefetch del chunk de Dashboard y warm-up de métricas para render más rápido
      try {
        // Cargar el bundle de Dashboard en segundo plano
        import('../../components/dashboard/Dashboard');
        // Precargar métricas en segundo plano (cache backend + navegador)
        const api = await import('../../services/api');
        api.getDashboardMetrics().catch(() => {});
      } catch (_) {}
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-4 md:py-3 lg:py-2" style={{ minHeight: 'calc(var(--app-dvh) - 128px)' }}>
      <div className="w-full max-w-md px-3">
        <Card className="shadow-sm border border-slate-200">
          <Card.Header as="h5" className="text-center bg-white font-semibold text-slate-700">Iniciar Sesión</Card.Header>
          <Card.Body className="space-y-4">
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={onSubmit}>
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
                />
              </Form.Group>
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 py-2 rounded-md"
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Iniciar Sesión'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Login;