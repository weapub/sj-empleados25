import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Avatar, Chip, IconButton, Tooltip, Typography, Button,
  CircularProgress, Alert, TextField, InputAdornment,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { getEmployees, deleteEmployee } from '../../services/api';
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

  const fetchEmployees = async (targetPage = 0) => {
    try {
      setLoading(true);
      const resp = await getEmployees({ page: targetPage + 1, limit: rowsPerPage });
      setEmployees(resp.data || []);
      setTotal(resp.total || 0);
      setTotalPages(resp.totalPages || 1);
      setError('');
    } catch {
      setError('Error al cargar los empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(0); }, []);

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
    fetchEmployees(newPage);
  };

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Eliminar empleado?',
      text: `Esta acción eliminará a ${nombre} de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF4C51',
      cancelButtonColor: '#8A8D93',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteEmployee(id);
      fetchEmployees(page);
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Error al eliminar' });
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

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden', borderColor: 'divider' }}>
        {/* Search bar */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            placeholder="Buscar por nombre, puesto, departamento…"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 340 } }}
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
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              {search ? 'Sin resultados para la búsqueda' : 'No hay empleados registrados'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', bgcolor: 'action.hover', py: 1.5 } }}>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Puesto</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((emp) => {
                  const color = avatarColor(`${emp.nombre}${emp.apellido}`);
                  return (
                    <TableRow
                      key={emp._id}
                      hover
                      sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }}
                      onClick={() => navigate(`/employees/${emp._id}`)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: color, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                            {initials(emp.nombre, emp.apellido)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} lineHeight={1.3}>
                              {emp.nombre} {emp.apellido}
                            </Typography>
                            {emp.legajo && (
                              <Typography variant="caption" color="text.secondary">
                                Leg. {emp.legajo}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{emp.email || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{emp.puesto || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        {emp.departamento ? (
                          <Chip label={emp.departamento} size="small" variant="outlined" sx={{ borderRadius: 1.5, fontSize: '0.72rem' }} />
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emp.activo !== false ? 'Activo' : 'Inactivo'}
                          size="small"
                          sx={{
                            borderRadius: 1.5,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            bgcolor: emp.activo !== false ? 'rgba(86,202,0,0.12)' : 'rgba(255,76,81,0.12)',
                            color:   emp.activo !== false ? '#4DB600' : '#FF4C51',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" onClick={e => e.stopPropagation()}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => navigate(`/employees/${emp._id}`)} sx={{ color: 'info.main' }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => navigate(`/employees/edit/${emp._id}`)} sx={{ color: 'warning.main' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" onClick={() => handleDelete(emp._id, `${emp.nombre} ${emp.apellido}`)} sx={{ color: 'error.main' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
