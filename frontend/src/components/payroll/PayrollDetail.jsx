import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Button } from 'react-bootstrap';
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
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('es-AR') : '-';
const formatPeriod = (period) => {
  if (!period || !period.includes('-')) return period || '-';
  const [y, m] = period.split('-');
  return `${m}-${y}`;
};

const PayrollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await getPayrollReceiptById(id);
        setReceipt(r);
      } catch (err) {
        console.error('Error cargando recibo:', err);
      }
    };
    load();
  }, [id]);

  const exportPdf = () => {
    if (!receipt) return;
    const dim = daysInMonth(receipt.period);
    const netToPay = Number(receipt.netAmount) || 0; // backend ya guarda neto final
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

  if (!receipt) {
    return (
      <Container className="mt-4 px-2 md:px-4">
        <p>Cargando...</p>
      </Container>
    );
  }

  const netToPay = Number(receipt.netAmount) || 0;
  const advance = receipt.advanceRequested ? (Number(receipt.advanceAmount) || 0) : 0;
  const weekly = Math.round(((netToPay / daysInMonth(receipt.period)) * 7) - advance);

  return (
    <Container className="mt-4 px-2 md:px-4 space-y-4">
      <Card className="shadow-sm border border-slate-200/70">
        <Card.Body className="pt-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="text-xl font-semibold tracking-tight">Detalle de Recibo</h3>
            <div>
              <Button variant="secondary" className="me-2 shadow-sm" onClick={() => navigate('/payroll')}>Volver</Button>
              <Button variant="primary" className="shadow-sm" onClick={exportPdf}>Exportar PDF</Button>
            </div>
          </div>

          <Row className="mb-3">
            <Col md={6}><strong>Empleado:</strong> {receipt.employee ? `${receipt.employee.nombre} ${receipt.employee.apellido} (${receipt.employee.legajo})` : '-'}</Col>
            <Col md={3}><strong>Periodo:</strong> {formatPeriod(receipt.period)}</Col>
            <Col md={3}><strong>Fecha de Pago:</strong> {formatDate(receipt.paymentDate)}</Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}><strong>Firmado:</strong> {receipt.signed ? 'Sí' : 'No'}</Col>
            <Col md={3}><strong>Fecha Firma:</strong> {formatDate(receipt.signedDate)}</Col>
            <Col md={3}><strong>Presentismo:</strong> {receipt.hasPresentismo ? 'Sí' : 'No'}</Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}><strong>Horas Extras:</strong> {formatCurrency(receipt.extraHours)}</Col>
            <Col md={3}><strong>Otros Adicionales:</strong> {formatCurrency(receipt.otherAdditions)}</Col>
            <Col md={3}><strong>Descuentos:</strong> {formatCurrency(receipt.discounts)}</Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}><strong>Adelanto:</strong> {receipt.advanceRequested ? 'Sí' : 'No'}</Col>
            <Col md={3}><strong>Fecha Adelanto:</strong> {formatDate(receipt.advanceDate)}</Col>
            <Col md={3}><strong>Monto Adelanto:</strong> {formatCurrency(receipt.advanceAmount)}</Col>
          </Row>
          <Row>
            <Col md={3}><strong>NETO A COBRAR:</strong> {formatCurrency(netToPay)}</Col>
            <Col md={3}><strong>Monto Semanal:</strong> {formatCurrency(weekly)}</Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PayrollDetail;