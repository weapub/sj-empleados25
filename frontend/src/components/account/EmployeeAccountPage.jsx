import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Grid, Typography, TextField, Button, MenuItem,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Divider,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Payments as PaymentsIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { getEmployees, getEmployeeAccount, updateWeeklyDeduction, addAccountPurchase, addAccountPayment } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const SectionBlock = ({ title, icon, children }) => (
  <Paper variant="outlined" sx={{ borderRadius: 4, borderColor: 'divider', overflow: 'hidden' }}>
    <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={700} fontSize="0.9375rem">{title}</Typography>
    </Box>
    <Box sx={{ p: 2.5 }}>{children}</Box>
  </Paper>
);

const txChip = (type) => {
  if (type === 'purchase') return { label: 'Compra',           bgcolor: 'rgba(255,76,81,0.12)',  color: '#FF4C51' };
  if (type === 'payment')  return { label: 'Pago',             bgcolor: 'rgba(86,202,0,0.12)',   color: '#4DB600' };
  return                          { label: 'Deducción Nómina', bgcolor: 'rgba(22,177,255,0.12)', color: '#0E9FE5' };
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const EmployeeAccountPage = () => {
  const theme = useTheme();

  const [employees, setEmployees]                 = useState([]);
  const [selectedEmployee, setSelectedEmployee]   = useState('');
  const [account, setAccount]                     = useState(null);
  const [transactions, setTransactions]           = useState([]);
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState('');
  const [success, setSuccess]                     = useState('');

  const [weeklyDeductionAmount, setWeeklyDeductionAmount] = useState('');
  const [purchaseAmount, setPurchaseAmount]               = useState('');
  const [purchaseDesc, setPurchaseDesc]                   = useState('');
  const [purchaseDate, setPurchaseDate]                   = useState(todayISO);
  const [paymentAmount, setPaymentAmount]                 = useState('');
  const [paymentDesc, setPaymentDesc]                     = useState('');
  const [paymentDate, setPaymentDate]                     = useState(todayISO);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const resp = await getEmployees();
        const list = Array.isArray(resp?.data) ? resp.data : [];
        setEmployees(list);
        if (list.length > 0) {
          const firstId = list[0]._id;
          setSelectedEmployee(firstId);
          try { await loadAccount(firstId); } catch {}
        }
      } catch {
        setError('Error al cargar empleados');
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
    } catch {
      setError('Error al cargar la cuenta del empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = async (e) => {
    const id = e.target.value;
    setSelectedEmployee(id);
    if (id) await loadAccount(id);
  };

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500); };

  const handleUpdateWeeklyDeduction = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateWeeklyDeduction(selectedEmployee, Number(weeklyDeductionAmount) || 0);
      await loadAccount(selectedEmployee);
      flash('Deducción semanal actualizada');
    } catch {
      setError('Error al actualizar la deducción semanal');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addAccountPurchase({ employeeId: selectedEmployee, amount: Number(purchaseAmount) || 0, description: purchaseDesc, date: purchaseDate });
      await loadAccount(selectedEmployee);
      setPurchaseAmount(''); setPurchaseDesc(''); setPurchaseDate(todayISO());
      flash('Compra registrada');
    } catch {
      setError('Error al registrar compra');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addAccountPayment({ employeeId: selectedEmployee, amount: Number(paymentAmount) || 0, description: paymentDesc, date: paymentDate });
      await loadAccount(selectedEmployee);
      setPaymentAmount(''); setPaymentDesc(''); setPaymentDate(todayISO());
      flash('Pago registrado');
    } catch {
      setError('Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  const balance = account?.balance ?? 0;
  const balanceColor = balance < 0 ? theme.palette.error.main : theme.palette.success.main;

  const selectedEmp = employees.find(e => e._id === selectedEmployee);
  const empName = selectedEmp ? `${selectedEmp.nombre} ${selectedEmp.apellido}` : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WalletIcon sx={{ fontSize: 22 }} />
            {empName ? `Cuenta — ${empName}` : 'Cuenta Corriente'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {account
              ? `Saldo actual: ${formatCurrency(balance)} · ${transactions.length} transacciones`
              : 'Seleccioná un empleado para ver su cuenta'}
          </Typography>
        </Box>
        {loading && <CircularProgress size={24} />}
      </Box>

      {error   && <Alert severity="error"   onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Employee selector */}
      <SectionBlock title="Selección de Empleado" icon={<PersonIcon fontSize="small" />}>
        <TextField
          select
          label="Empleado"
          value={selectedEmployee}
          onChange={handleSelectEmployee}
          fullWidth
          size="small"
        >
          <MenuItem value=""><em>Seleccione un empleado</em></MenuItem>
          {employees.map(emp => (
            <MenuItem key={emp._id} value={emp._id}>
              {emp.nombre} {emp.apellido}{emp.legajo ? ` — Leg. ${emp.legajo}` : ''}
            </MenuItem>
          ))}
        </TextField>
      </SectionBlock>

      {account && (
        <>
          {/* Balance + weekly deduction */}
          <SectionBlock title="Resumen y Configuración" icon={<SettingsIcon fontSize="small" />}>
            <Grid container spacing={2.5} alignItems="stretch">

              {/* Balance card — full width */}
              <Grid xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2.5,
                    bgcolor: alpha(balanceColor, 0.1),
                    border: `1.5px solid ${alpha(balanceColor, 0.35)}`,
                  }}
                >
                  <Box sx={{ width: 52, height: 52, borderRadius: 2.5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(balanceColor, 0.18), color: balanceColor }}>
                    <WalletIcon sx={{ fontSize: 26 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing="0.07em" color="text.secondary">
                      Saldo Actual
                    </Typography>
                    <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ color: balanceColor, lineHeight: 1.2 }}>
                      {formatCurrency(balance)}
                    </Typography>
                    {account?.weeklyDeductionAmount > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Deducción semanal: {formatCurrency(account.weeklyDeductionAmount)}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Weekly deduction form */}
              <Grid xs={12}>
                <Box component="form" onSubmit={handleUpdateWeeklyDeduction} sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Configurá el monto que se descuenta automáticamente cada semana de la nómina.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                    <TextField
                      label="Deducción semanal"
                      type="number"
                      value={weeklyDeductionAmount}
                      onChange={e => setWeeklyDeductionAmount(e.target.value)}
                      size="small"
                      fullWidth
                      slotProps={{ input: { inputProps: { min: 0 } } }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      sx={{ whiteSpace: 'nowrap', borderRadius: 2.5 }}
                      disabled={loading}
                    >
                      Actualizar
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </SectionBlock>

          {/* Purchase + Payment forms */}
          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <SectionBlock title="Registrar Compra" icon={<ShoppingCartIcon fontSize="small" />}>
                <Box component="form" onSubmit={handleAddPurchase} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Monto"
                    type="number"
                    value={purchaseAmount}
                    onChange={e => setPurchaseAmount(e.target.value)}
                    size="small"
                    fullWidth
                    slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
                    placeholder="0.00"
                  />
                  <TextField
                    label="Descripción"
                    value={purchaseDesc}
                    onChange={e => setPurchaseDesc(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="Descripción de la compra"
                  />
                  <TextField
                    label="Fecha"
                    type="date"
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    size="small"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<ShoppingCartIcon />}
                    disabled={loading}
                    sx={{ borderRadius: 2.5, bgcolor: '#FF4C51', '&:hover': { bgcolor: '#d63b3f' } }}
                  >
                    Registrar Compra
                  </Button>
                </Box>
              </SectionBlock>
            </Grid>

            <Grid xs={12} md={6}>
              <SectionBlock title="Registrar Pago" icon={<PaymentsIcon fontSize="small" />}>
                <Box component="form" onSubmit={handleAddPayment} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Monto"
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    size="small"
                    fullWidth
                    slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
                    placeholder="0.00"
                  />
                  <TextField
                    label="Descripción"
                    value={paymentDesc}
                    onChange={e => setPaymentDesc(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="Descripción del pago"
                  />
                  <TextField
                    label="Fecha"
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    size="small"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<PaymentsIcon />}
                    disabled={loading}
                    sx={{ borderRadius: 2.5, bgcolor: '#56CA00', '&:hover': { bgcolor: '#3d9200' } }}
                  >
                    Registrar Pago
                  </Button>
                </Box>
              </SectionBlock>
            </Grid>
          </Grid>

          {/* Transaction history */}
          <SectionBlock title="Historial de Transacciones" icon={<HistoryIcon fontSize="small" />}>
            {transactions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">No hay transacciones registradas</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', bgcolor: 'action.hover', py: 1.5 } }}>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Descripción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map(tx => {
                      const chip = txChip(tx.type);
                      const isDebit = tx.type === 'purchase';
                      return (
                        <TableRow key={tx._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(tx.date).toLocaleDateString('es-AR')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={chip.label}
                              size="small"
                              sx={{ borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 600, bgcolor: chip.bgcolor, color: chip.color }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} sx={{ color: isDebit ? 'error.main' : 'success.main' }}>
                              {isDebit ? '-' : '+'}{formatCurrency(tx.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{tx.description || '—'}</Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SectionBlock>
        </>
      )}
    </Box>
  );
};

export default EmployeeAccountPage;
