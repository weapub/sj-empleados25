import React, { useState, useEffect } from 'react';
import { Table, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { getEmployees, deleteEmployee } from '../../services/api';
import MobileCard from '../common/MobileCard';
import PageHeader from '../common/PageHeader';
import SectionCard from '../common/SectionCard';
import { Users, Plus } from 'lucide-react';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
      setError('');
    } catch (err) {
      setError('Error al cargar los empleados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
      try {
        await deleteEmployee(id);
        setEmployees(employees.filter(employee => employee._id !== id));
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

  return (
    <div className="container-fluid px-2 md:px-4 space-y-4">
      <PageHeader
        icon={<Users size={20} />}
        title="Empleados"
        subtitle="Gestione el registro y edición de empleados"
        actions={(
          <Link to="/employees/new">
            <Button variant="primary" className="shadow-sm">
              <Plus size={16} className="me-2" />
              Nuevo Empleado
            </Button>
          </Link>
        )}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {employees.length === 0 ? (
        <Alert variant="light" className="shadow-sm">No hay empleados registrados</Alert>
      ) : (
        <>
          {/* Vista de escritorio - Tabla */}
          <div className="desktop-view">
          <div className="section-box">
            <div className="section-band" />
            <div className="p-3 p-md-4">
              <SectionCard title="Listado" icon={<Users size={16} />}>
              <div className="table-responsive">
                <Table hover responsive className="employee-table mb-0 align-middle text-sm">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Puesto</th>
                      <th>Departamento</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(employee => (
                      <tr key={employee._id}>
                        <td>
                          <div className="fw-semibold text-truncate" title={`${employee.nombre} ${employee.apellido}`}>
                            {employee.nombre} {employee.apellido}
                          </div>
                          <small className="text-muted">Legajo: {employee.legajo || '-'}</small>
                        </td>
                        <td>{employee.email}</td>
                        <td>{employee.puesto}</td>
                        <td>{employee.departamento}</td>
                        <td>
                          <Link to={`/employees/${employee._id}`}>
                            <Button variant="success" size="sm" className="me-2 shadow-sm">Ver</Button>
                          </Link>
                          <Link to={`/employees/edit/${employee._id}`}>
                            <Button variant="warning" size="sm" className="me-2 shadow-sm">Editar</Button>
                          </Link>
                          <Button 
                            variant="danger" 
                            size="sm"
                            className="shadow-sm"
                            onClick={() => handleDelete(employee._id)}
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </SectionCard>
            </div>
          </div>
          </div>

          {/* Vista móvil - Tarjetas */}
          <div className="mobile-view">
            {employees.map(employee => (
              <MobileCard
                key={employee._id}
                title={`${employee.nombre} ${employee.apellido}`}
                subtitle={`Legajo: ${employee.legajo || '-'} | ${employee.email}`}
                fields={[
                  { label: 'Puesto', value: employee.puesto || 'No especificado' },
                  { label: 'Departamento', value: employee.departamento || 'No especificado' }
                ]}
                actions={[
                  {
                    text: 'Ver',
                    variant: 'info',
                    onClick: () => navigate(`/employees/${employee._id}`)
                  },
                  {
                    text: 'Editar',
                    variant: 'warning',
                    onClick: () => navigate(`/employees/edit/${employee._id}`)
                  },
                  {
                    text: 'Eliminar',
                    variant: 'danger',
                    onClick: () => handleDelete(employee._id)
                  }
                ]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeList;