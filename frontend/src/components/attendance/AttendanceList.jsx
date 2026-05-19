import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, IconButton, Tooltip, Typography, Button,
  CircularProgress, Alert, TextField, MenuItem, InputAdornment,
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as AscIcon,
  ArrowDownward as DescIcon,
  Description as DocIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAttendances, getEmployees, deleteAttendance } from '../../services/api';
import DocumentViewerModal from '../common/DocumentViewerModal';
import Swal from 'sweetalert2';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

const typeChipSx = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'inasistencia':   return { bgcolor: 'rgba(255,76,81,0.12)',  color: '#FF4C51' };
    case 'tardanza':       return { bgcolor: 'rgba(255,180,0,0.12)',  color: '#E6A200' };
    case 'licencia medica':return { bgcolor: 'rgba(22,177,255,0.12)', color: '#16B1FF' };
    case 'vacaciones':     return { bgcolor: 'rgba(140,87,255,0.12)', color: '#8C57FF' };
    default:               return { bgcolor: 'rgba(138,141,147,0.12)',color: '#8A8D93' };
  }
};

const typeLabel = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'inasistencia':    return 'Inasistencia';
    case 'tardanza':        return 'Tardanza';
    case 'licencia medica': return 'Lic. Médica';
    case 'vacaciones':      return 'Vacaciones';
    default:                return type || '—';
  }
};

const chipSx = { borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 600 };

const AttendanceList = () => {
  const navigate = useNavigate();
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ employeeId: '', type: '', justified: '' });
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(50);
  const [serverTotal, setServerTotal] = useState(0);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setEmployees(arr);
      } catch (_) {}
    };
    loadEmployees();
  }, []);

  useEffect(() => {
    const loadAttendances = async () => {
      try {
        setLoading(true);
        const params = {
          page: page + 1,
          limit: rowsPerPage,
          employeeId: filter.employeeId || undefined,
          type: filter.type || undefined,
          justified: filter.justified || undefined,
          sortBy,
          sortDir,
        };
        const resp = await getAttendances(params);
        if (Array.isArray(resp)) {
          setAttendances(resp);
          setServerTotal(resp.length);
        } else {
          setAttendances(Array.isArray(resp.data) ? resp.data : []);
          setServerTotal(resp.total || 0);
        }
      } catch (_) {
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    loadAttendances();
  }, [page, rowsPerPage, filter.employeeId, filter.type, filter.justified, sortBy, sortDir]);

  const handleFilterChange = (e) => {
    setFilter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(0);
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortDir === 'asc'
      ? <AscIcon sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle' }} />
      : <DescIcon sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle' }} />;
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar registro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF4C51',
      cancelButtonColor: '#8A8D93',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteAttendance(id);
      setAttendances(prev => prev.filter(a => a._id !== id));
      setServerTotal(prev => Math.max(prev - 1, 0));
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
    } catch (_) {
      Swal.fire({ icon: 'error', title: 'Error al eliminar' });
    }
  };

  const getName = (att) => att.employee
    ? `${att.employee.nombre} ${att.employee.apellido}`
    : 'Desconocido';

  const headCell = (label, field) => (
    <TableCell
      onClick={() => handleSort(field)}
      sx={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      {label}<SortIcon field={field} />
    </TableCell>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ClockIcon sx={{ fontSize: 22 }} />
            Inasistencias y Tardanzas
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Filtre, ordene y gestione los registros de asistencia
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 2.5 }}
          onClick={() => navigate('/attendance/new')}
        >
          Registrar Nueva
        </Button>
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
            name="employeeId"
            value={filter.employeeId}
            onChange={handleFilterChange}
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
          >
            <MenuItem value="">Todos los empleados</MenuItem>
            {employees.map(emp => (
              <MenuItem key={emp._id} value={emp._id}>
                {emp.nombre} {emp.apellido}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Tipo"
            name="type"
            value={filter.type}
            onChange={handleFilterChange}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="inasistencia">Inasistencia</MenuItem>
            <MenuItem value="tardanza">Tardanza</MenuItem>
            <MenuItem value="licencia medica">Licencia Médica</MenuItem>
            <MenuItem value="vacaciones">Vacaciones</MenuItem>
            <MenuItem value="sancion recibida">Sanción Recibida</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Justificado"
            name="justified"
            value={filter.justified}
            onChange={handleFilterChange}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Sí</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            size="small"
            onClick={() => { setSortBy('date'); setSortDir('desc'); }}
          >
            Reset orden
          </Button>
        </Box>
      </Paper>

      {/* Tabla */}
      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden', borderColor: 'divider' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', bgcolor: 'action.hover', py: 1.5 } }}>
                  {headCell('Empleado', 'employee')}
                  {headCell('Fecha', 'date')}
                  {headCell('Estado', 'status')}
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Horario / Tardanza</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Vence cert.</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Inicio vac.</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Fin vac.</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Reincorporación</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Certificado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No hay registros que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  attendances.map((att) => {
                    const estab = att.scheduledEntry || '—';
                    const reg = att.actualEntry || '—';
                    const late = att.lateMinutes ?? 0;
                    const hasHorario = att.scheduledEntry || att.actualEntry || late > 0;

                    return (
                      <TableRow key={att._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ maxWidth: { xs: 120, sm: 200, md: 'none' } }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>{getName(att)}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                              Leg. {att.employee?.legajo || '—'}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{formatDate(att.date)}</Typography>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              label={typeLabel(att.type)}
                              size="small"
                              sx={{ ...chipSx, ...typeChipSx(att.type) }}
                            />
                            <Chip
                              label={att.justified ? 'Justificado' : 'No justificado'}
                              size="small"
                              sx={{
                                ...chipSx,
                                ...(att.justified
                                  ? { bgcolor: 'rgba(86,202,0,0.12)', color: '#4DB600' }
                                  : { bgcolor: 'rgba(255,76,81,0.12)', color: '#FF4C51' }),
                              }}
                            />
                            <Chip
                              label={att.lostPresentismo ? 'Sin presentismo' : 'Con presentismo'}
                              size="small"
                              sx={{
                                ...chipSx,
                                ...(att.lostPresentismo
                                  ? { bgcolor: 'rgba(255,76,81,0.12)', color: '#FF4C51' }
                                  : { bgcolor: 'rgba(86,202,0,0.12)', color: '#4DB600' }),
                              }}
                            />
                          </Box>
                        </TableCell>

                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="body2">
                            {hasHorario ? `${estab} → ${reg} (${late} min)` : '—'}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{formatDate(att.certificateExpiry)}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{formatDate(att.vacationsStart)}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{formatDate(att.vacationsEnd)}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatDate(att.returnToWorkDate)}</TableCell>

                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {att.justificationDocument ? (
                            <Tooltip title="Ver certificado">
                              <IconButton
                                size="small"
                                onClick={() => { setViewerUrl(att.justificationDocument); setViewerOpen(true); }}
                                sx={{ color: 'info.main' }}
                              >
                                <DocIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : '—'}
                        </TableCell>

                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: { xs: 88, md: 'auto' } }}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              sx={{ color: 'warning.main' }}
                              onClick={() => navigate(`/attendance/edit/${att._id}`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              sx={{ color: 'error.main' }}
                              onClick={() => handleDelete(att._id)}
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

        <TablePagination
          component="div"
          count={serverTotal}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Paper>

      <DocumentViewerModal
        show={viewerOpen}
        onHide={() => { setViewerOpen(false); setViewerUrl(null); }}
        url={viewerUrl}
        title="Documento de asistencia"
      />
    </Box>
  );
};

export default AttendanceList;
