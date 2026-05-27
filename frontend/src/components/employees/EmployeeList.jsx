import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Avatar, Chip, IconButton, Tooltip, Typography, Button,
  CircularProgress, Alert, TextField, InputAdornment, ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PersonOff as PersonOffIcon,
  RestoreFromTrash as RestoreIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { getEmployees, deleteEmployee, restoreEmployee } from '../../services/api';
import Swal from 'sweetalert2';

const avatarColor = (name = '') => {
  const colors = ['#8C57FF','#16B1FF','#56CA00','#FFB400','#FF4C51','#A379FF'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const initials = (nombre = '', apellido = '') =>
  `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [page, setPage]             = useState(0);
  const [rowsPerPage]               = useState(25);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]         = useState('');
  const [filtroActivo, setFiltroActivo] = useState('true'); // 'true' | 'false' | 'all'

  const fetchEmployees = useCallback(async (targetPage = 0, activo = filtroActivo) => {
    try {
      setLoading(true);
      const resp = await getEmployees({ page: targetPage + 1, limit: rowsPerPage, activo });
      setEmployees(resp.data || []);
      setTotal(resp.total || 0);
      setTotalPages(resp.totalPages || 1);
      setError('');
    } catch {
      setError('Error al cargar los empleados');
    } finally {
      setLoading(false);
    }
  }, [rowsPerPage, filtroActivo]);

  useEffect(() => { fetchEmployees(0, filtroActivo); }, [filtroActivo]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
    fetchEmployees(newPage, filtroActivo);
  };

  const handleFiltroChange = (_, newFiltro) => {
    if (!newFiltro) return; // evitar deselección total
    setPage(0);
    setSearch('');
    setFiltroActivo(newFiltro);
  };

  // Dar de baja (soft-delete) con motivo
  const handleDelete = async (id, nombre) => {
    const { value: motivoBaja, isConfirmed } = await Swal.fire({
      title: `Dar de baja a ${nombre}`,
      html: `
        <p style="margin-bottom:12px;color:#666;font-size:0.9rem">
          El empleado quedará inactivo y podrá ser restaurado en cualquier momento.
        </p>
        <textarea id="swal-motivo" class="swal2-textarea" placeholder="Motivo de baja (opcional)…" rows="3"
          style="width:100%;resize:none;font-size:0.9rem"></textarea>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF4C51',
      cancelButtonColor: '#8A8D93',
      confirmButtonText: 'Dar de baja',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return document.getElementById('swal-motivo')?.value?.trim() || '';
      },
    });
    if (!isConfirmed) return;
    try {
      await deleteEmployee(id, motivoBaja);
      fetchEmployees(page, filtroActivo);
      Swal.fire({ icon: 'success', title: 'Dado de baja', text: motivoBaja || undefined, timer: 1800, showConfirmButton: false });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al dar de baja';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    }
  };

  // Restaurar empleado dado de baja
  const handleRestore = async (id, nombre) => {
    const result = await Swal.fire({
      title: `¿Restaurar a ${nombre}?`,
      text: 'El empleado volverá a estar activo en el sistema.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#56CA00',
      cancelButtonColor: '#8A8D93',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await restoreEmployee(id);
      fetchEmployees(page, filtroActivo);
      Swal.fire({ icon: 'success', title: 'Empleado restaurado', timer: 1500, showConfirmButton: false });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al restaurar';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    }
  };

  const filtered = employees.filter(e =>
    `${e.nombre} ${e.apellido} ${e.puesto} ${e.departamento} ${e.email}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon sx={{ fontSize: 22 }} />
            Empleados
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Gestión del registro de empleados
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Actualizar lista">
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              onClick={() => fetchEmployees(page, filtroActivo)}
              disabled={loading}
              sx={{ borderRadius: 2.5 }}
            >
              Actualizar
            </Button>
          </Tooltip>
          <Button
            component={Link}
            to="/employees/new"
            variant="contained"
            startIcon={<PersonAddIcon />}
            sx={{ borderRadius: 2.5 }}
          >
            Nuevo Empleado
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden', borderColor: 'divider' }}>
        {/* Search + filtros */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Buscar por nombre, puesto, departamento…"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 300 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <ToggleButtonGroup
            value={filtroActivo}
            exclusive
            onChange={handleFiltroChange}
            size="small"
            sx={{ height: 40 }}
          >
            <ToggleButton value="true" sx={{ px: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
              Activos
            </ToggleButton>
            <ToggleButton value="false" sx={{ px: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
              <PersonOffIcon sx={{ fontSize: 16, mr: 0.6 }} />
              Dados de baja
            </ToggleButton>
            <ToggleButton value="all" sx={{ px: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
              Todos
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              {search ? 'Sin resultados para la búsqueda' : 'No hay empleados en esta categoría'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', bgcolor: 'action.hover', py: 1.5, whiteSpace: 'nowrap' } }}>
                  <TableCell>Empleado</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Puesto</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Departamento</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((emp) => {
                  const color = avatarColor(`${emp.nombre}${emp.apellido}`);
                  const isInactive = emp.activo === false;
                  return (
                    <TableRow
                      key={emp._id}
                      hover
                      sx={{
                        '&:last-child td': { border: 0 },
                        cursor: 'pointer',
                        opacity: isInactive ? 0.65 : 1,
                        bgcolor: isInactive ? 'rgba(255,76,81,0.04)' : 'inherit',
                        borderLeft: isInactive ? '3px solid #FF4C51' : '3px solid transparent',
                      }}
                      onClick={() => navigate(`/employees/${emp._id}`)}
                    >
                      <TableCell sx={{ maxWidth: { xs: 120, sm: 200, md: 'none' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                          <Avatar sx={{
                            display: { xs: 'none', sm: 'flex' },
                            width: 36, height: 36, fontSize: 13, fontWeight: 700, flexShrink: 0,
                            bgcolor: isInactive ? '#8A8D93' : color,
                          }}>
                            {initials(emp.nombre, emp.apellido)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} lineHeight={1.3} noWrap
                              sx={{ textDecoration: isInactive ? 'line-through' : 'none', color: isInactive ? 'text.secondary' : 'text.primary' }}>
                              {emp.nombre} {emp.apellido}
                            </Typography>
                            {emp.legajo && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                Leg. {emp.legajo}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" color="text.secondary">{emp.email || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" color={isInactive ? 'text.secondary' : 'text.primary'}>{emp.puesto || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {emp.departamento ? (
                          <Chip label={emp.departamento} size="small" variant="outlined" sx={{ borderRadius: 1.5, fontSize: '0.72rem' }} />
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {!isInactive ? (
                          <Chip label="Activo" size="small" sx={{ borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 600, bgcolor: 'rgba(86,202,0,0.12)', color: '#4DB600' }} />
                        ) : (
                          <Tooltip title={emp.motivoBaja || 'Sin motivo registrado'} arrow>
                            <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0.25 }}>
                              <Chip label="Baja" size="small" sx={{ borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 600, bgcolor: 'rgba(255,76,81,0.12)', color: '#FF4C51' }} />
                              {emp.motivoBaja && (
                                <Typography variant="caption" color="error" sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                  {emp.motivoBaja}
                                </Typography>
                              )}
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: { xs: 88, md: 'auto' } }} onClick={e => e.stopPropagation()}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => navigate(`/employees/${emp._id}`)} sx={{ color: 'info.main' }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!isInactive ? (
                          <>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => navigate(`/employees/edit/${emp._id}`)} sx={{ color: 'warning.main' }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Dar de baja">
                              <IconButton size="small" onClick={() => handleDelete(emp._id, `${emp.nombre} ${emp.apellido}`)} sx={{ color: 'error.main' }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Tooltip title="Restaurar empleado">
                            <IconButton size="small" onClick={() => handleRestore(emp._id, `${emp.nombre} ${emp.apellido}`)} sx={{ color: 'success.main' }}>
                              <RestoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Paper>
    </Box>
  );
};

export default EmployeeList;
