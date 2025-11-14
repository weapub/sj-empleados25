import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Modal, Button, ButtonGroup } from 'react-bootstrap';
import { Download, Printer, ZoomIn, ZoomOut, RotateCcw, RefreshCcw, ExternalLink, X } from 'lucide-react';
// Usar la versión ESM de PDF.js y un worker de Vite para evitar eval
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// Configurar worker de PDF.js desde CDN para evitar bundling del worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const isPdfUrl = (url) => {
  if (!url) return false;
  // Sólo considerar PDF si la URL incluye explícitamente la extensión .pdf
  const hasPdfExt = /\.pdf($|\?)/i.test(url);
  return hasPdfExt;
};

const isImageUrl = (url) => {
  if (!url) return false;
  return /\.(jpg|jpeg|png)($|\?)/i.test(url);
};

const DocumentViewerModal = ({ show, onHide, url, title = 'Documento' }) => {
  const [detectedPdf, setDetectedPdf] = useState(false);
  const [streamDetectedPdf, setStreamDetectedPdf] = useState(false);
  const pdf = useMemo(() => isPdfUrl(url) || detectedPdf, [url, detectedPdf]);
  const image = useMemo(() => isImageUrl(url), [url]);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef(null);
  const [pdfScale, setPdfScale] = useState(1.1);

  useEffect(() => {
    let cancelled = false;
    setDetectedPdf(false);
    setStreamDetectedPdf(false);
    const detect = async () => {
      if (!url || isPdfUrl(url)) return;
      try {
        // Intentamos detectar content-type del recurso para habilitar embed si es PDF
        const res = await fetch(url, { method: 'HEAD' });
        const ct = res.headers.get('content-type');
        if (!cancelled && ct && ct.toLowerCase().startsWith('application/pdf')) {
          setDetectedPdf(true);
        }
      } catch (e) {
        // Si falla (CORS o HEAD no permitido), ignoramos y mantenemos heurística por extensión
      }
      // Intento ligero: leer el primer chunk para detectar marca %PDF-
      try {
        if (cancelled || isPdfUrl(url) || image) return;
        const res = await fetch(url, { method: 'GET' });
        if (res && res.body) {
          const reader = res.body.getReader();
          const { value } = await reader.read();
          reader.cancel();
          if (value && value.length >= 5) {
            const b = new Uint8Array(value);
            const isPdfMagic = b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2D; // %PDF-
            if (!cancelled && isPdfMagic) {
              setStreamDetectedPdf(true);
            }
          }
        }
      } catch {}
    };
    detect();
    return () => { cancelled = true; };
  }, [url]);

  // Render PDF con PDF.js si fue detectado por stream y no tiene extensión
  useEffect(() => {
    let cancelled = false;
    const renderPdf = async () => {
      if (!url || image) return;
      if (!(streamDetectedPdf && !isPdfUrl(url))) return;
      try {
        const loadingTask = pdfjsLib.getDocument({ url });
        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: pdfScale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err) {
        // Si falla, mantenemos fallback de no embebible
      }
    };
    renderPdf();
    return () => { cancelled = true; };
  }, [url, streamDetectedPdf, pdfScale, image]);

  const handleDownload = async () => {
    if (!url) return;
    const baseNameFromTitle = (title || 'documento')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_\-]/g, '') || 'documento';

    const filename = (pdf || streamDetectedPdf)
      ? `${baseNameFromTitle}.pdf`
      : (image ? `${baseNameFromTitle}.jpg` : `${baseNameFromTitle}`);

    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error('network');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        a.remove();
      }, 200);
    } catch (e) {
      // Fallback: abrir en nueva pestaña si no se puede descargar por CORS
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    }
  };

  const handleOpenNewTab = async () => {
    if (!url) return;
    // Si es imagen, abrimos directamente
    if (image) {
      const win = window.open(url, '_blank', 'noopener');
      if (win) win.focus();
      return;
    }
    // Si detectamos PDF, intentamos abrir via blob para forzar viewer
    if (isPdfUrl(url) || detectedPdf || streamDetectedPdf) {
      try {
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) throw new Error('network');
        const ab = await res.arrayBuffer();
        const blob = new Blob([ab], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(blob);
        const win = window.open(objectUrl, '_blank', 'noopener');
        if (win) win.focus();
        return;
      } catch (e) {
        // Fallback a abrir URL original
        const win = window.open(url, '_blank', 'noopener');
        if (win) win.focus();
        return;
      }
    }
    // Para tipos no embebibles, usamos Google Docs Viewer como fallback
    const viewer = `https://docs.google.com/viewer?embedded=1&url=${encodeURIComponent(url)}`;
    const win = window.open(viewer, '_blank', 'noopener');
    if (win) win.focus();
  };

  const handlePrint = () => {
    if (!url) return;
    // Abrimos en nueva pestaña para que el visor del navegador gestione la impresión del PDF/imagen
    const win = window.open(url, '_blank', 'noopener');
    if (win) {
      win.focus();
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Toolbar */}
        {url && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <ButtonGroup>
                <Button variant="outline-primary" onClick={handleDownload} className="inline-flex items-center gap-2">
                  <Download size={16} />
                  <span>Descargar</span>
                </Button>
                <Button variant="outline-secondary" onClick={handlePrint} className="inline-flex items-center gap-2">
                  <Printer size={16} />
                  <span>Imprimir</span>
                </Button>
              </ButtonGroup>
            </div>
            {image && (
              <div>
                <ButtonGroup>
                  <Button variant="outline-dark" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} className="inline-flex items-center gap-2">
                    <ZoomIn size={16} />
                    <span>Zoom +</span>
                  </Button>
                  <Button variant="outline-dark" onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))} className="inline-flex items-center gap-2">
                    <ZoomOut size={16} />
                    <span>Zoom -</span>
                  </Button>
                  <Button variant="outline-dark" onClick={() => setRotation((r) => (r + 90) % 360)} className="inline-flex items-center gap-2">
                    <RotateCcw size={16} />
                    <span>Rotar 90°</span>
                  </Button>
                  <Button variant="outline-dark" onClick={() => { setZoom(1); setRotation(0); }} className="inline-flex items-center gap-2">
                    <RefreshCcw size={16} />
                    <span>Reset</span>
                  </Button>
                </ButtonGroup>
              </div>
            )}
          </div>
        )}
        {!url && (
          <div className="alert alert-warning">No hay documento disponible.</div>
        )}

        {url && pdf && (
          <object
            data={url}
            type="application/pdf"
            style={{ width: '100%', height: '75vh', border: '1px solid #e5e7eb', borderRadius: 8 }}
          >
            <p>
              No se pudo incrustar el PDF. Puedes abrirlo en una pestaña nueva:
              {' '}
              <a href={url} target="_blank" rel="noopener noreferrer">Abrir PDF</a>
            </p>
          </object>
        )}

        {url && !pdf && image && (
          <div className="text-center" style={{ overflow: 'auto' }}>
            <img
              src={url}
              alt="Documento"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                maxWidth: '100%',
                maxHeight: '75vh',
                borderRadius: 8,
                border: '1px solid #e5e7eb'
              }}
            />
          </div>
        )}

        {url && !pdf && !image && streamDetectedPdf && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <ButtonGroup>
                <Button variant="outline-dark" onClick={() => setPdfScale((s) => Math.min(2.5, s + 0.1))} className="inline-flex items-center gap-2">
                  <ZoomIn size={16} />
                  <span>Zoom +</span>
                </Button>
                <Button variant="outline-dark" onClick={() => setPdfScale((s) => Math.max(0.5, s - 0.1))} className="inline-flex items-center gap-2">
                  <ZoomOut size={16} />
                  <span>Zoom -</span>
                </Button>
                <Button variant="outline-dark" onClick={() => setPdfScale(1.1)} className="inline-flex items-center gap-2">
                  <RefreshCcw size={16} />
                  <span>Reset</span>
                </Button>
              </ButtonGroup>
            </div>
            <div style={{ width: '100%', height: '75vh', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
            </div>
          </div>
        )}

        {url && !pdf && !image && !streamDetectedPdf && (
          <div className="alert alert-info">
            Tipo de documento no embebible. Puedes descargarlo o abrirlo en otra pestaña.
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {url && (
          <Button variant="primary" onClick={handleOpenNewTab} className="inline-flex items-center gap-2">
            <ExternalLink size={16} />
            <span>Abrir en pestaña nueva</span>
          </Button>
        )}
        <Button variant="secondary" onClick={onHide} className="inline-flex items-center gap-2">
          <X size={16} />
          <span>Cerrar</span>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentViewerModal;