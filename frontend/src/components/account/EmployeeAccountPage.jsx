import React, { useEffect, useState } from 'react';
import { Form, Button, Row, Col, Table, Alert, Spinner, Card, Container } from 'react-bootstrap';
import { FaUser, FaWallet, FaShoppingCart, FaMoneyBillWave, FaHistory, FaCog } from 'react-icons/fa';
import { getEmployees } from '../../services/api';
import { getEmployeeAccount, updateWeeklyDeduction, addAccountPurchase, addAccountPayment } from '../../services/api';
import MobileCard from '../common/MobileCard';
import PageHeader from '../common/PageHeader';
import SectionCard from '../common/SectionCard';
import { formatCurrency } from '../../utils/formatters';

const EmployeeAccountPage = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [weeklyDeductionAmount, setWeeklyDeductionAmount] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseDesc, setPurchaseDesc] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0,10));
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0,10));

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const resp = await getEmployees(); // { data, total, page, totalPages }
        const list = Array.isArray(resp?.data) ? resp.data : [];
        setEmployees(list);
        // Autoseleccionar el primer empleado para cargar la cuenta automáticamente
        if (list.length > 0 && !selectedEmployee) {
          const firstId = list[0]._id;
          setSelectedEmployee(firstId);
          // Cargar la cuenta del primer empleado
          try {
            await loadAccount(firstId);
          } catch (e) {
            // Mantener el error ya gestionado en loadAccount
          }
        }
      } catch (err) {
        setError('Error al cargar empleados');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  const loadAccount = async (employeeId) => {
    try {
      setLoading(true);
      const { account, transactions } = await getEmployeeAccount(employeeId);
      setAccount(account);
      setTransactions(transactions);
      setWeeklyDeductionAmount(account?.weeklyDeductionAmount ?? '');
      setError('');
    } catch (err) {
      setError('Error al cargar la cuenta del empleado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = async (e) => {
    const id = e.target.value;
    setSelectedEmployee(id);
    if (id) await loadAccount(id);
  };

  const handleUpdateWeeklyDeduction = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateWeeklyDeduction(selectedEmployee, Number(weeklyDeductionAmount) || 0);
      await loadAccount(selectedEmployee);
      setSuccess('Deducción semanal actualizada');
    } catch (err) {
      setError('Error al actualizar la deducción semanal');
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addAccountPurchase({ employeeId: selectedEmployee, amount: Number(purchaseAmount) || 0, description: purchaseDesc, date: purchaseDate });
      await loadAccount(selectedEmployee);
      setPurchaseAmount('');
      setPurchaseDesc('');
      setPurchaseDate(new Date().toISOString().slice(0,10));
      setSuccess('Compra registrada');
    } catch (err) {
      setError('Error al registrar compra');
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addAccountPayment({ employeeId: selectedEmployee, amount: Number(paymentAmount) || 0, description: paymentDesc, date: paymentDate });
      await loadAccount(selectedEmployee);
      setPaymentAmount('');
      setPaymentDesc('');
      setPaymentDate(new Date().toISOString().slice(0,10));
      setSuccess('Pago registrado');
    } catch (err) {
      setError('Error al registrar pago');
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  return (
    <Container fluid className="px-2 md:px-4 mt-4">
      <PageHeader
        icon={<FaWallet />}
        title="Cuenta Corriente del Empleado"
        subtitle="Gestión de adelantos, compras y pagos"
      />

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" />
          <p className="mt-2 text-muted">Cargando...</p>
        </div>
      )}

      {/* Selector de empleado */}
          <SectionCard title="Selección de Empleado" icon={<FaUser size={20} />} className="mb-4">
        <Form.Group controlId="employeeSelect">
          <Form.Label>Empleado</Form.Label>
          <Form.Select 
            value={selectedEmployee} 
            onChange={handleSelectEmployee}
            className="form-select-lg"
          >
            <option value="">Seleccione un empleado</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.nombre} {emp.apellido} — Legajo: {emp.legajo}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </SectionCard>

      {account && (
        <>
          {/* Resumen y configuración */}
              <SectionCard title="Resumen y Configuración" icon={<FaWallet size={20} />} className="mb-4">
            <Row>
              <Col lg={4} md={6} className="mb-3">
                <Card className="h-100 balance-card shadow-sm">
                  <Card.Body className="text-center">
                    <FaWallet size={40} className="text-white mb-3" />
                    <h5 className="card-title text-white">Saldo Actual</h5>
                    <h2 className="text-white fw-bold">
                      {formatCurrency(account?.balance)}
                    </h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={8} md={6} className="mb-3">
                <Card className="h-100 shadow-sm border border-slate-200/70">
                  <Card.Header>
                    <h5 className="mb-0 inline-flex items-center gap-2">
                      <FaCog />
                      <span>Configuración de Deducción Semanal</span>
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <strong>Deducción actual:</strong> {formatCurrency(account?.weeklyDeductionAmount)}
                    </div>
                    <Form onSubmit={handleUpdateWeeklyDeduction}>
                      <Row>
                        <Col md={8}>
                          <Form.Group>
                            <Form.Label>Nuevo monto de deducción semanal</Form.Label>
                            <Form.Control 
                              type="number" 
                              min="0" 
                              value={weeklyDeductionAmount} 
                              onChange={(e) => setWeeklyDeductionAmount(e.target.value)}
                              placeholder="Ingrese el monto"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4} className="d-flex align-items-end">
                          <Button type="submit" variant="primary" className="w-100 shadow-sm inline-flex items-center gap-2">
                            <FaCog />
                            <span>Actualizar</span>
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </SectionCard>

          {/* Formularios de transacciones */}
          <Row className="mb-4">
            <Col lg={6} className="mb-4">
              <SectionCard title="Registrar Compra" icon={<FaShoppingCart size={20} />}>
                <Form onSubmit={handleAddPurchase}>
                  <Form.Group className="mb-3">
                    <Form.Label>Monto</Form.Label>
                    <Form.Control 
                      type="number" 
                      min="0" 
                      step="0.01"
                      value={purchaseAmount} 
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Descripción</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={purchaseDesc} 
                      onChange={(e) => setPurchaseDesc(e.target.value)}
                      placeholder="Descripción de la compra"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={purchaseDate} 
                      onChange={(e) => setPurchaseDate(e.target.value)} 
                    />
                  </Form.Group>
                  <Button type="submit" variant="primary" className="w-100 shadow-sm inline-flex items-center gap-2">
                    <FaShoppingCart size={16} />
                    <span>Registrar Compra</span>
                  </Button>
                </Form>
              </SectionCard>
            </Col>
            <Col lg={6} className="mb-4">
              <SectionCard title="Registrar Pago" icon={<FaMoneyBillWave size={20} />}>
                <Form onSubmit={handleAddPayment}>
                  <Form.Group className="mb-3">
                    <Form.Label>Monto</Form.Label>
                    <Form.Control 
                      type="number" 
                      min="0" 
                      step="0.01"
                      value={paymentAmount} 
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Descripción</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={paymentDesc} 
                      onChange={(e) => setPaymentDesc(e.target.value)}
                      placeholder="Descripción del pago"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={paymentDate} 
                      onChange={(e) => setPaymentDate(e.target.value)} 
                    />
                  </Form.Group>
                  <Button type="submit" variant="primary" className="w-100 shadow-sm inline-flex items-center gap-2">
                    <FaMoneyBillWave size={16} />
                    <span>Realizar Pago</span>
                  </Button>
                </Form>
              </SectionCard>
            </Col>
          </Row>

          {/* Historial de transacciones */}
              <SectionCard title="Historial de Transacciones" icon={<FaHistory size={20} />}>
            {transactions.length === 0 ? (
              <Alert variant="light" className="text-center mb-0">
                <FaHistory size={30} className="text-muted mb-2" />
                <div>No hay transacciones registradas</div>
              </Alert>
            ) : (
              <>
                {/* Vista de escritorio: tabla */}
                <div className="desktop-view">
                  <div className="table-responsive">
                    <Table striped hover className="mb-0 align-middle text-sm">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Monto</th>
                          <th>Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => (
                          <tr key={tx._id}>
                            <td>{new Date(tx.date).toLocaleString('es-AR')}</td>
                            <td>
                              <span className={`badge ${
                                tx.type === 'purchase' ? 'bg-danger' : 
                                tx.type === 'payment' ? 'bg-success' : 'bg-info'
                              }`}>
                                {tx.type === 'purchase' ? 'Compra' : 
                                 tx.type === 'payment' ? 'Pago' : 'Deducción Nómina'}
                              </span>
                            </td>
                            <td className={`fw-bold ${
                              tx.type === 'purchase' ? 'text-danger' : 'text-success'
                            }`}>
                              {tx.type === 'purchase' ? '-' : '+'}${tx.amount?.toLocaleString('es-AR')}
                            </td>
                            <td>{tx.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>

                {/* Vista móvil: tarjetas */}
                <div className="mobile-view">
                  {transactions.map(tx => {
                    const typeText = tx.type === 'purchase' ? 'Compra' : tx.type === 'payment' ? 'Pago' : 'Deducción Nómina';
                    const typeVariant = tx.type === 'purchase' ? 'danger' : tx.type === 'payment' ? 'success' : 'info';
                    const amountSign = tx.type === 'purchase' ? '-' : '+';
                    const amountClass = tx.type === 'purchase' ? 'text-danger' : 'text-success';
                    const amountNode = (
                      <span className={`amount-value ${amountClass}`}>{`${amountSign}$${tx.amount?.toLocaleString('es-AR')}`}</span>
                    );
                    return (
                      <MobileCard
                        key={tx._id}
                        title={typeText}
                        subtitle={new Date(tx.date).toLocaleString('es-AR')}
                        badges={[{ text: typeText, variant: typeVariant }]}
                        fields={[
                          { label: 'Monto', value: amountNode },
                          { label: 'Descripción', value: tx.description || '-' }
                        ]}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </SectionCard>
        </>
      )}
    </Container>
  );
};

export default EmployeeAccountPage;