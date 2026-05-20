import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, IconButton, Tooltip, Typography, Button,
  CircularProgress, Alert, TextField, MenuItem,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as AscIcon,
  ArrowDownward as DescIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  HourglassBottom as HourglassBottomIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAllDisciplinaries, deleteDisciplinary } from '../../services/api';
import DocumentViewerModal from '../common/DocumentViewerModal';
import Swal from 'sweetalert2';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

const chipSx = { borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 600 };

const typeChipSx = (type) => {
  switch (type) {
    case 'verbal': return { bgcolor: 'rgba(255,180,0,0.12)', color: '#E6A200' };
    case 'formal': return { bgcolor: 'rgba(22,177,255,0.12)', color: '#16B1FF' };
    case 'grave':  return { bgcolor: 'rgba(255,76,81,0.12)',  color: '#FF4C51' };
    default:       return { bgcolor: 'rgba(138,141,147,0.12)',color: '#8A8D93' };
  }
};

const typeLabel = (type) => {
  switch (type) {
    case 'verbal': return 'Verbal';
    case 'formal': return 'Formal';
    case 'grave':  return 'Grave';
    default:       return type || '—';
  }
};

const SORT_OPTIONS = [
  { value: 'date',             label: 'Fecha' },
  { value: 'employee',         label: 'Empleado' },
  { value: 'type',             label: 'Tipo' },
  { value: 'signed',           label: 'Firmado' },
  { value: 'durationDays',     label: 'Duración' },
  { value: 'returnToWorkDate', label: 'Fecha regreso' },
];

const DisciplinaryList = () => {
  const navigate = useNavigate();
  const [disciplinaries, setDisciplinaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(50);
  const [serverTotal, setServerTotal] = useState(0);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const loadDisciplinaries = async (targetPage = page) => {
    try {
      setLoading(true);
      const response = await getAllDisciplinaries({
        page: targetPage + 1,
        limit: rowsPerPage,
        sortBy,
        sortDir,
      });
      if (Array.isArray(response)) {
        setDisciplinaries(response);
        setServerTotal(response.length);
      } else {
        setDisciplinaries(Array.isArray(response.data) ? response.data : []);
        setServerTotal(response.total || 0);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.msg;
      setError(msg || 'No se pudieron cargar las medidas disciplinarias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisciplinaries(page);
  }, [page, sortBy, sortDir]);

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
        await deleteDisciplinary(id);
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
        loadDisciplinaries(page);
      } catch (_) {
        Swal.fire({ icon: 'error', title: 'Error al eliminar' });
      }
    });
  };

  const toggleSortDir = () => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GavelIcon sx={{ fontSize: 22 }} />
            Medidas Disciplinarias
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Registre, consulte y gestione las medidas disciplinarias
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 2.5 }}
          onClick={() => navigate('/disciplinary/new')}
        >
          Nueva Medida
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Tabla */}
      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden', borderColor: 'divider' }}>
        {/* Barra de ordenamiento */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">Ordenar por:</Typography>
          <TextField
            select
            size="small"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
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
            <Table size="small" sx={{ '& td, & th': { px: { xs: 1, md: 2 } } }}>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', bgcolor: 'action.hover', py: 1.5, whiteSpace: 'nowrap' } }}>
                  <TableCell>Empleado</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Fecha</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Hora</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Días susp.</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Reincorporación</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Firma</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Documento</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {disciplinaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No hay medidas disciplinarias registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  disciplinaries.map((d) => (
                    <TableRow key={d._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ maxWidth: { xs: 140, sm: 200, md: 'none' } }}>
                        {d.employee ? (
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {d.employee.nombre} {d.employee.apellido}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                              {formatDate(d.date)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                              Leg. {d.employee.legajo || '—'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" noWrap>Desconocido</Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatDate(d.date)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{d.time || '—'}</TableCell>

                      <TableCell>
                        <Chip
                          label={typeLabel(d.type)}
                          size="small"
                          sx={{ ...chipSx, ...typeChipSx(d.type) }}
                        />
                      </TableCell>

                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{d.durationDays ?? '—'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatDate(d.returnToWorkDate)}</TableCell>

                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Tooltip
                          title={d.signed
                            ? `Firmado${d.signedDate ? ': ' + formatDate(d.signedDate) : ''}`
                            : 'Pendiente de firma'}
                          arrow
                        >
                          {d.signed
                            ? <CheckCircleIcon sx={{ fontSize: 18, color: '#16B1FF' }} />
                            : <HourglassBottomIcon sx={{ fontSize: 18, color: '#E6A200' }} />
                          }
                        </Tooltip>
                      </TableCell>

                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {d.document ? (
                          <Tooltip title="Ver documento">
                            <IconButton
                              size="small"
                              sx={{ color: 'success.main' }}
                              onClick={() => { setViewerUrl(d.document); setViewerOpen(true); }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">No disponible</Typography>
                        )}
                      </TableCell>

                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: { xs: 88, md: 'auto' } }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            sx={{ color: 'warning.main' }}
                            onClick={() => navigate(`/disciplinary/edit/${d._id}`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            sx={{ color: 'error.main' }}
                            onClick={() => handleDelete(d._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
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

        {/* Leyenda de iconos */}
        <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.disabled" fontWeight={700} letterSpacing="0.06em" sx={{ textTransform: 'uppercase' }}>Leyenda</Typography>
          {[
            { icon: <CheckCircleIcon sx={{ fontSize: 14, color: '#16B1FF' }} />, label: 'Firmado' },
            { icon: <HourglassBottomIcon sx={{ fontSize: 14, color: '#E6A200' }} />, label: 'Pendiente de firma' },
          ].map(({ icon, label }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {icon}
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <DocumentViewerModal
        show={viewerOpen}
        onHide={() => { setViewerOpen(false); setViewerUrl(null); }}
        url={viewerUrl}
        title="Documento de medida disciplinaria"
      />
    </Box>
  );
};

export default DisciplinaryList;
