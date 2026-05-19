import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip, CircularProgress, Grid,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  ArrowBack as BackIcon,
  PictureAsPdf as PdfIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { getPayrollReceiptById } from '../../services/api';

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

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
    <Box
      sx={{
        display: 'inline-flex',
        alignSelf: 'flex-start',
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: 'primary.main',
        opacity: 0.85,
      }}
    >
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: '#fff', textTransform: 'uppercase', lineHeight: 1.6 }}>
        {label}
      </Typography>
    </Box>
    <Typography variant="body2" fontWeight={500} color="text.primary" sx={{ pl: 0.25 }}>
      {value || '—'}
    </Typography>
  </Box>
);

const SectionPaper = ({ title, children }) => (
  <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', overflow: 'hidden' }}>
    <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
        {title}
      </Typography>
    </Box>
    <Box sx={{ p: 2.5 }}>{children}</Box>
  </Paper>
);

const PayrollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await getPayrollReceiptById(id);
        setReceipt(r);
      } catch (_) {}
    };
    load();
  }, [id]);

  const exportPdf = () => {
    if (!receipt) return;
    const dim = daysInMonth(receipt.period);
    const netToPay = Number(receipt.netAmount) || 0;
    const advance = receipt.advanceRequested ? (Number(receipt.advanceAmount) || 0) : 0;
    const weekly = Math.round(((netToPay / dim) * 7) - advance);

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Recibo de Sueldo</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; }
            h2 { margin-bottom: 8px; }
            .section { margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .label { color: #555; }
            .value { font-weight: bold; }
            hr { margin: 16px 0; }
          </style>
        </head>
        <body>
          <h2>Recibo de Sueldo</h2>
          <div class="section grid">
            <div class="row"><span class="label">Empleado</span><span class="value">${receipt.employee ? `${receipt.employee.nombre} ${receipt.employee.apellido} (${receipt.employee.legajo})` : '-'}</span></div>
            <div class="row"><span class="label">Periodo</span><span class="value">${formatPeriod(receipt.period)}</span></div>
            <div class="row"><span class="label">Fecha de Pago</span><span class="value">${formatDate(receipt.paymentDate)}</span></div>
            <div class="row"><span class="label">Firmado</span><span class="value">${receipt.signed ? 'Sí' : 'No'}</span></div>
            <div class="row"><span class="label">Fecha Firma</span><span class="value">${formatDate(receipt.signedDate)}</span></div>
            <div class="row"><span class="label">Presentismo</span><span class="value">${receipt.hasPresentismo ? 'Sí' : 'No'}</span></div>
          </div>
          <hr/>
          <div class="section grid">
            <div class="row"><span class="label">Horas Extras</span><span class="value">${formatCurrency(receipt.extraHours)}</span></div>
            <div class="row"><span class="label">Otros Adicionales</span><span class="value">${formatCurrency(receipt.otherAdditions)}</span></div>
            <div class="row"><span class="label">Descuentos</span><span class="value">${formatCurrency(receipt.discounts)}</span></div>
            <div class="row"><span class="label">Adelanto Solicitado</span><span class="value">${receipt.advanceRequested ? 'Sí' : 'No'}</span></div>
            <div class="row"><span class="label">Fecha Adelanto</span><span class="value">${formatDate(receipt.advanceDate)}</span></div>
            <div class="row"><span class="label">Monto Adelanto</span><span class="value">${formatCurrency(receipt.advanceAmount)}</span></div>
          </div>
          <hr/>
          <div class="section grid">
            <div class="row"><span class="label">NETO A COBRAR</span><span class="value">${formatCurrency(netToPay)}</span></div>
            <div class="row"><span class="label">Monto Semanal (cálculo)</span><span class="value">${formatCurrency(weekly)}</span></div>
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `;
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  if (!receipt) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );

  const netToPay = Number(receipt.netAmount) || 0;
  const advance = receipt.advanceRequested ? (Number(receipt.advanceAmount) || 0) : 0;
  const weekly = Math.round(((netToPay / daysInMonth(receipt.period)) * 7) - advance);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon sx={{ fontSize: 22 }} />
            Detalle de Recibo
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {receipt.employee
              ? `${receipt.employee.nombre} ${receipt.employee.apellido} — Legajo ${receipt.employee.legajo}`
              : '—'
            }
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            size="small"
            onClick={() => navigate('/payroll')}
          >
            Volver
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<PdfIcon />}
            size="small"
            onClick={exportPdf}
          >
            Exportar PDF
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<EditIcon />}
            size="small"
            onClick={() => navigate(`/payroll/edit/${id}`)}
          >
            Editar
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* Empleado */}
        <SectionPaper title="Empleado">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <InfoRow
                label="Nombre"
                value={receipt.employee ? `${receipt.employee.nombre} ${receipt.employee.apellido}` : null}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InfoRow label="Legajo" value={receipt.employee?.legajo} />
            </Grid>
          </Grid>
        </SectionPaper>

        {/* Estado */}
        <SectionPaper title="Estado">
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={receipt.signed ? 'Firmado' : 'Sin Firmar'}
              size="small"
              sx={{
                ...chipSx,
                ...(receipt.signed
                  ? { bgcolor: 'rgba(22,177,255,0.12)', color: '#16B1FF' }
                  : { bgcolor: 'rgba(255,180,0,0.12)', color: '#E6A200' }),
              }}
            />
            <Chip
              label={receipt.hasPresentismo ? 'Con Presentismo' : 'Sin Presentismo'}
              size="small"
              sx={{
                ...chipSx,
                ...(receipt.hasPresentismo
                  ? { bgcolor: 'rgba(86,202,0,0.12)', color: '#4DB600' }
                  : { bgcolor: 'rgba(255,76,81,0.12)', color: '#FF4C51' }),
              }}
            />
            {receipt.advanceRequested && (
              <Chip
                label="Con Adelanto"
                size="small"
                sx={{ ...chipSx, bgcolor: 'rgba(255,180,0,0.12)', color: '#E6A200' }}
              />
            )}
          </Box>
        </SectionPaper>

        {/* Período y Fecha de Pago */}
        <SectionPaper title="Período y Fecha de Pago">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <InfoRow label="Período" value={formatPeriod(receipt.period)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <InfoRow label="Fecha de Pago" value={formatDate(receipt.paymentDate)} />
            </Grid>
            {receipt.signed && (
              <Grid item xs={12} sm={4}>
                <InfoRow label="Fecha de Firma" value={formatDate(receipt.signedDate)} />
              </Grid>
            )}
            {receipt.advanceRequested && (
              <Grid item xs={12} sm={4}>
                <InfoRow label="Fecha de Adelanto" value={formatDate(receipt.advanceDate)} />
              </Grid>
            )}
          </Grid>
        </SectionPaper>

        {/* Montos */}
        <SectionPaper title="Montos">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <InfoRow label="Horas Extras" value={formatCurrency(receipt.extraHours)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoRow label="Otros Adicionales" value={formatCurrency(receipt.otherAdditions)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoRow label="Descuentos" value={formatCurrency(receipt.discounts)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoRow label="Adelanto" value={formatCurrency(receipt.advanceAmount)} />
            </Grid>

            {/* NETO destacado */}
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: 'success.main',
                  bgcolor: 'rgba(86,202,0,0.06)',
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    NETO A COBRAR
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="success.main" lineHeight={1.1}>
                    {formatCurrency(netToPay)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Monto Semanal
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="text.primary" lineHeight={1.2}>
                    {formatCurrency(weekly)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </SectionPaper>

      </Box>
    </Box>
  );
};

export default PayrollDetail;
