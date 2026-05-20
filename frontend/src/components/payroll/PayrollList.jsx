import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, Typography, Button, CircularProgress, Alert,
  TextField, MenuItem,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ArrowUpward as AscIcon,
  ArrowDownward as DescIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getAllPayrollReceipts, deletePayrollReceipt } from '../../services/api';

const daysInMonth = (period) => {
  try {
    const [y, m] = period.split('-');
    return new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
  } catch (_) {
    return 30;
  }
};

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('es-AR')}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—';
const formatPeriod = (period) => {
  if (!period || !period.includes('-')) return period || '—';
  const [y, m] = period.split('-');
  return `${m}-${y}`;
};

const chipSx = { borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 600 };

const SORT_OPTIONS = [
  { value: 'employee',    label: 'Empleado' },
  { value: 'period',      label: 'Período' },
  { value: 'paymentDate', label: 'Fecha pago' },
  { value: 'status',      label: 'Estado' },
  { value: 'extra',       label: 'Horas extras' },
  { value: 'other',       label: 'Otros' },
  { value: 'discounts',   label: 'Descuentos' },
  { value: 'advance',     label: 'Adelanto' },
  { value: 'net',         label: 'Neto' },
  { value: 'weekly',      label: 'Semanal' },
];

const PayrollList = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [sortBy, setSortBy] = useState('paymentDate');
  const [sortDir, setSortDir] = useState('desc');

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await getAllPayrollReceipts();
      setReceipts(Array.isArray(data) ? data : []);
    } catch (_) {
      setError('Error al cargar los recibos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReceipts(); }, []);

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF4C51',
      cancelButtonColor: '#8A8D93',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await deletePayrollReceipt(id);
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
        loadReceipts();
      } catch (_) {
        Swal.fire({ icon: 'error', title: 'Error al eliminar' });
      }
    });
  };

  const filteredReceipts = receipts.filter(r => {
    const matchEmployee = filterEmployee ? (r.employee && r.employee._id === filterEmployee) : true;
    const matchPeriod = filterPeriod ? (r.period === filterPeriod) : true;
    return matchEmployee && matchPeriod;
  });

  const parsePeriod = (period) => {
    if (!period) return new Date(0);
    const [y, m] = period.split('-');
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  };

  const sortedReceipts = [...filteredReceipts].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'employee') {
      const an = a.employee ? `${a.employee.nombre} ${a.employee.apellido}`.toLowerCase() : '';
      const bn = b.employee ? `${b.employee.nombre} ${b.employee.apellido}`.toLowerCase() : '';
      return an.localeCompare(bn) * dir;
    }
    if (sortBy === 'period')      return (parsePeriod(a.period) - parsePeriod(b.period)) * dir;
    if (sortBy === 'paymentDate') return ((a.paymentDate ? new Date(a.paymentDate).getTime() : 0) - (b.paymentDate ? new Date(b.paymentDate).getTime() : 0)) * dir;
    if (sortBy === 'extra')       return (Number(a.extraHours || 0) - Number(b.extraHours || 0)) * dir;
    if (sortBy === 'other')       return (Number(a.otherAdditions || 0) - Number(b.otherAdditions || 0)) * dir;
    if (sortBy === 'discounts')   return (Number(a.discounts || 0) - Number(b.discounts || 0)) * dir;
    if (sortBy === 'advance')     return ((a.advanceRequested ? Number(a.advanceAmount) || 0 : 0) - (b.advanceRequested ? Number(b.advanceAmount) || 0 : 0)) * dir;
    if (sortBy === 'net')         return (Number(a.netAmount || 0) - Number(b.netAmount || 0)) * dir;
    if (sortBy === 'weekly') {
      const wA = Math.round(((Number(a.netAmount) || 0) / daysInMonth(a.period) * 7) - (a.advanceRequested ? Number(a.advanceAmount) || 0 : 0));
      const wB = Math.round(((Number(b.netAmount) || 0) / daysInMonth(b.period) * 7) - (b.advanceRequested ? Number(b.advanceAmount) || 0 : 0));
      return (wA - wB) * dir;
    }
    if (sortBy === 'status') {
      const score = (x) => (x.signed ? 2 : 0) + (x.hasPresentismo ? 1 : 0);
      return (score(a) - score(b)) * dir;
    }
    return 0;
  });

  const toggleSortDir = () => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');

  const handlePrint = () => {
    const rows = sortedReceipts.map(r => {
      const dim = daysInMonth(r.period);
      const netToPay = Number(r.netAmount) || 0;
      const advance = r.advanceRequested ? (Number(r.advanceAmount) || 0) : 0;
      const weekly = Math.round(((netToPay / dim) * 7) - advance);
      const name = r.employee ? `${r.employee.apellido}, ${r.employee.nombre}` : '—';
      const legajo = r.employee?.legajo || '—';
      const extras = Number(r.extraHours) || 0;
      const descuentos = Number(r.discounts) || 0;
      return `<tr>
        <td>${name}</td>
        <td>${legajo}</td>
        <td style="text-align:center">${formatPeriod(r.period)}</td>
        <td style="text-align:right">${formatCurrency(netToPay)}</td>
        <td style="text-align:right;font-weight:700;color:#16a34a">${formatCurrency(weekly)}</td>
        <td style="text-align:right;color:${descuentos > 0 ? '#dc2626' : '#888'}">${descuentos > 0 ? formatCurrency(descuentos) : '—'}</td>
        <td style="text-align:right;color:${extras > 0 ? '#2563eb' : '#888'}">${extras > 0 ? formatCurrency(extras) : '—'}</td>
        <td style="text-align:right">${r.advanceRequested ? formatCurrency(r.advanceAmount) : '—'}</td>
      </tr>`;
    }).join('');

    const totalWeekly   = sortedReceipts.reduce((s, r) => { const dim = daysInMonth(r.period); const net = Number(r.netAmount) || 0; const adv = r.advanceRequested ? (Number(r.advanceAmount) || 0) : 0; return s + Math.round(((net / dim) * 7) - adv); }, 0);
    const totalDesc     = sortedReceipts.reduce((s, r) => s + (Number(r.discounts) || 0), 0);
    const totalExtras   = sortedReceipts.reduce((s, r) => s + (Number(r.extraHours) || 0), 0);
    const totalAdelantos= sortedReceipts.reduce((s, r) => s + (r.advanceRequested ? (Number(r.advanceAmount) || 0) : 0), 0);

    const period    = filterPeriod ? formatPeriod(filterPeriod) : 'Todos los períodos';
    const printDate = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte Semanal de Haberes</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #111; padding-bottom: 10px; }
  .header h1 { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
  .header .meta { font-size: 10px; color: #555; margin-top: 3px; }
  .badge { display: inline-block; background: #111; color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 0.06em; padding: 2px 7px; border-radius: 3px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  thead tr { background: #111; color: #fff; }
  th { padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
  th.r { text-align: right; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e5e5; vertical-align: middle; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .foot td { font-weight: 700; border-top: 2px solid #111; background: #f0f0f0; font-size: 11px; }
  @media print { body { padding: 12px; } @page { margin: 12mm; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="badge">San Jorge Fiambres</div>
    <h1 style="margin-top:6px">Reporte Semanal de Haberes</h1>
    <div class="meta">Período: <strong>${period}</strong> &nbsp;·&nbsp; Emitido: ${printDate} &nbsp;·&nbsp; ${sortedReceipts.length} registro${sortedReceipts.length !== 1 ? 's' : ''}</div>
  </div>
</div>
<table>
  <thead>
    <tr>
      <th>Empleado</th>
      <th>Legajo</th>
      <th style="text-align:center">Período</th>
      <th class="r">Neto mensual</th>
      <th class="r">Cobro semanal</th>
      <th class="r">Descuentos</th>
      <th class="r">Horas extras</th>
      <th class="r">Adelanto</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    <tr class="foot">
      <td colspan="4">TOTALES — ${sortedReceipts.length} empleados</td>
      <td style="text-align:right;color:#16a34a">${formatCurrency(totalWeekly)}</td>
      <td style="text-align:right;color:#dc2626">${totalDesc > 0 ? formatCurrency(totalDesc) : '—'}</td>
      <td style="text-align:right;color:#2563eb">${totalExtras > 0 ? formatCurrency(totalExtras) : '—'}</td>
      <td style="text-align:right">${totalAdelantos > 0 ? formatCurrency(totalAdelantos) : '—'}</td>
    </tr>
  </tbody>
</table>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=650');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  };

  const uniqueEmployees = receipts
    .map(r => r.employee)
    .filter(Boolean)
    .reduce((acc, emp) => {
      if (!acc.find(x => x._id === emp._id)) acc.push(emp);
      return acc;
    }, []);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon sx={{ fontSize: 22 }} />
            Recibos de Sueldo
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Gestione, filtre y ordene los recibos emitidos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={sortedReceipts.length === 0 ? 'No hay datos para imprimir' : 'Imprimir reporte semanal'}>
            <span>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                disabled={sortedReceipts.length === 0}
                sx={{ borderRadius: 2.5 }}
              >
                Reporte Semanal
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2.5 }}
            onClick={() => navigate('/payroll/new')}
          >
            Nuevo Recibo
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filtros */}
      <Paper variant="outlined" sx={{ borderRadius: 4, borderColor: 'divider', mb: 2.5 }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={700}>Filtros</Typography>
        </Box>
        <Box sx={{ px: 2.5, py: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            select
            size="small"
            label="Empleado"
            value={filterEmployee}
            onChange={e => setFilterEmployee(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {uniqueEmployees.map(emp => (
              <MenuItem key={emp._id} value={emp._id}>
                {emp.nombre} {emp.apellido} ({emp.legajo})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="Período (MM-YYYY)"
            type="month"
            value={filterPeriod}
            onChange={e => setFilterPeriod(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Button
            variant="outlined"
            size="small"
            onClick={() => { setSortBy('paymentDate'); setSortDir('desc'); }}
          >
            Reset orden
          </Button>
        </Box>
      </Paper>

      {/* Tabla */}
      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden', borderColor: 'divider' }}>
        {/* Barra de ordenamiento */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">Ordenar por:</Typography>
          <TextField
            select
            size="small"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {SORT_OPTIONS.map(o => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            size="small"
            onClick={toggleSortDir}
            startIcon={sortDir === 'asc' ? <AscIcon /> : <DescIcon />}
          >
            {sortDir === 'asc' ? 'Ascendente' : 'Descendente'}
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', bgcolor: 'action.hover', py: 1.5 } }}>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Período</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Pago</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Estado</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Horas Extras</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Otros</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Descuentos</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Adelanto</TableCell>
                  <TableCell>Neto</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Semanal</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No hay recibos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedReceipts.map((r) => {
                    const dim = daysInMonth(r.period);
                    const netToPay = Number(r.netAmount) || 0;
                    const advance = r.advanceRequested ? (Number(r.advanceAmount) || 0) : 0;
                    const weekly = Math.round(((netToPay / dim) * 7) - advance);

                    return (
                      <TableRow key={r._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ maxWidth: { xs: 120, sm: 200, md: 'none' } }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {r.employee ? `${r.employee.nombre} ${r.employee.apellido}` : '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                              Leg. {r.employee?.legajo || '—'}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{formatPeriod(r.period)}</Typography>
                          <Typography variant="caption" color="text.secondary">Días: {dim}</Typography>
                        </TableCell>

                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatDate(r.paymentDate)}</TableCell>

                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              label={r.hasPresentismo ? 'Con Presentismo' : 'Sin Presentismo'}
                              size="small"
                              sx={{
                                ...chipSx,
                                ...(r.hasPresentismo
                                  ? { bgcolor: 'rgba(86,202,0,0.12)', color: '#4DB600' }
                                  : { bgcolor: 'rgba(255,76,81,0.12)', color: '#FF4C51' }),
                              }}
                            />
                            <Chip
                              label={r.signed ? 'Firmado' : 'Sin Firmar'}
                              size="small"
                              sx={{
                                ...chipSx,
                                ...(r.signed
                                  ? { bgcolor: 'rgba(22,177,255,0.12)', color: '#16B1FF' }
                                  : { bgcolor: 'rgba(255,180,0,0.12)', color: '#E6A200' }),
                              }}
                            />
                          </Box>
                        </TableCell>

                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{formatCurrency(r.extraHours)}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{formatCurrency(r.otherAdditions)}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{formatCurrency(r.discounts)}</TableCell>

                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              label={r.advanceRequested ? 'Con Adelanto' : 'Sin Adelanto'}
                              size="small"
                              sx={{
                                ...chipSx,
                                ...(r.advanceRequested
                                  ? { bgcolor: 'rgba(255,180,0,0.12)', color: '#E6A200' }
                                  : { bgcolor: 'rgba(22,177,255,0.12)', color: '#16B1FF' }),
                              }}
                            />
                            <Typography variant="caption">{formatCurrency(r.advanceAmount)}</Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="success.main">
                            {formatCurrency(netToPay)}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="body2">{formatCurrency(weekly)}</Typography>
                        </TableCell>

                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: { xs: 112, md: 'auto' } }}>
                          <Tooltip title="Ver detalle">
                            <IconButton
                              size="small"
                              sx={{ color: 'success.main' }}
                              onClick={() => navigate(`/payroll/${r._id}`)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              sx={{ color: 'warning.main' }}
                              onClick={() => navigate(`/payroll/edit/${r._id}`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              sx={{ color: 'error.main' }}
                              onClick={() => handleDelete(r._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default PayrollList;
