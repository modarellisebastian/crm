/**
 * Genera propuesta comercial Axano — multi-página, con opciones de pago y firma.
 * Abre ventana nueva → el usuario hace Cmd+P → Guardar como PDF.
 */

// ─── Config Axano ────────────────────────────────────────────────────────────
const AXANO = {
  nombre:    'Axano',
  subtitulo: 'Studio digital',
  contacto:  'Modarelli Sebastian',
  email:     'hola@axano.tech',
  web:       'axano.tech',
  // Recargos por cuotas
  recargo2:  0.10,   // +10% en 2 pagos
  recargo3:  0.15,   // +15% en 3 pagos
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n, moneda = 'ars') {
  const v = Number(n)
  if (moneda === 'usd') return `U$D ${v.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
  return v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
}

function fmtFecha(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const M = ['enero','febrero','marzo','abril','mayo','junio',
             'julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${parseInt(d)} de ${M[parseInt(m)-1]} de ${y}`
}

function renderNotas(notas) {
  if (!notas?.trim()) return ''
  return notas.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const esTitulo = l.endsWith(':') || (l === l.toUpperCase() && l.length < 60)
    return esTitulo
      ? `<p class="scope-titulo">${l}</p>`
      : `<p class="scope-item"><span>—</span>${l}</p>`
  }).join('')
}

export function generarPdfPropuesta(p) {
  const monto   = Number(p.monto) || 0
  const mon     = p.moneda || 'ars'
  const m2      = monto * (1 + AXANO.recargo2)
  const m3      = monto * (1 + AXANO.recargo3)
  const cuota2  = m2 / 2
  const cuota3  = m3 / 3

  const html = /* html */`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Propuesta ${p.numero || ''}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Inter',sans-serif;
  font-size:10px;
  color:#1a1a1f;
  background:#fff;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}

/* ── PAGE ── */
.page{
  width:210mm;
  margin:0 auto;
  padding:0 36px 0 36px;
}

/* ── HEADER ── */
.header{
  padding:24px 0 18px;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  border-bottom:2px solid #111;
  margin-bottom:20px;
}
.brand h1{font-size:22px;font-weight:800;letter-spacing:-0.8px;line-height:1}
.brand p{font-size:9px;color:#888;margin-top:4px;letter-spacing:1px;text-transform:uppercase}
.badge{
  background:#111;
  color:#fff;
  font-size:10px;
  font-weight:700;
  letter-spacing:2px;
  text-transform:uppercase;
  padding:6px 14px;
  border-radius:4px;
  align-self:center;
}

/* ── INFO BOXES ── */
.info-row{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
  margin-bottom:22px;
}
.info-box{
  border:1px solid #e5e5e8;
  border-radius:8px;
  padding:14px 16px;
}
.info-box-title{
  font-size:8px;
  font-weight:700;
  letter-spacing:1.5px;
  text-transform:uppercase;
  color:#0a0a0a;
  margin-bottom:10px;
}
.info-row-item{
  display:flex;
  gap:8px;
  margin-bottom:5px;
  font-size:9.5px;
}
.info-row-item .lbl{color:#999;min-width:78px;flex-shrink:0}
.info-row-item .val{font-weight:600;color:#111}

/* ── SECTION TITLE ── */
.section-title{
  font-size:13px;
  font-weight:700;
  color:#111;
  letter-spacing:-0.3px;
  margin-bottom:12px;
  padding-left:12px;
  border-left:3px solid #111;
}

/* ── SCOPE ── */
.scope-box{
  background:#f8f8fa;
  border-radius:8px;
  padding:14px 16px;
  margin-bottom:20px;
  font-size:9.5px;
  line-height:1.65;
  color:#333;
}
.scope-titulo{font-weight:700;color:#111;margin-top:10px;margin-bottom:4px;font-size:9px;letter-spacing:0.5px;text-transform:uppercase}
.scope-titulo:first-child{margin-top:0}
.scope-item{display:flex;gap:8px;margin-bottom:3px}
.scope-item span{color:#bbb;flex-shrink:0}

/* ── PAGOS TABLE ── */
.pagos-table{width:100%;border-collapse:collapse;margin-bottom:22px;font-size:9.5px}
.pagos-table thead tr{background:#111;color:#fff}
.pagos-table thead th{padding:8px 12px;text-align:left;font-weight:600;letter-spacing:0.5px;font-size:8.5px;text-transform:uppercase}
.pagos-table tbody tr{border-bottom:1px solid #ebebeb}
.pagos-table tbody tr:last-child{border-bottom:none}
.pagos-table tbody tr.highlight{background:#f0f4ff}
.pagos-table td{padding:10px 12px;vertical-align:top}
.pagos-table td.tag-cell{width:120px}
.tag{display:inline-block;font-size:8px;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase}
.tag-contado{background:#f5f5f5;color:#1a9e5f}
.tag-2p{background:#f5f5f5;color:#4050cc}
.tag-3p{background:#fff4e6;color:#cc7700}
.plan-desc{font-weight:600;color:#111;margin-bottom:2px}
.plan-sub{color:#888;font-size:8.5px}
.plan-total{font-size:13px;font-weight:800;color:#111;white-space:nowrap}
.plan-cuota{font-size:8.5px;color:#888;margin-top:2px}
.plan-recomendado{
  font-size:8px;font-weight:700;color:#1a9e5f;
  letter-spacing:0.5px;text-transform:uppercase;
  margin-top:4px;
}

/* ── CONDICIONES ── */
.cond-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
.cond-box{border:1px solid #e5e5e8;border-radius:8px;padding:14px 16px}
.cond-box-title{font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#0a0a0a;margin-bottom:10px}
.cond-item{display:flex;gap:7px;margin-bottom:6px;font-size:9px;line-height:1.5;color:#444}
.cond-item strong{color:#111}
.cond-dot{color:#bbb;flex-shrink:0;margin-top:1px}

/* ── NOTA DESTACADA ── */
.nota-box{
  background:#fffbec;
  border:1px solid #f0e0a0;
  border-radius:8px;
  padding:12px 14px;
  font-size:9px;
  color:#665500;
  line-height:1.6;
  margin-bottom:22px;
}
.nota-box strong{color:#443300}

/* ── FIRMAS ── */
.firmas{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e8}
.firma-bloque{text-align:center}
.firma-linea{border-bottom:1px solid #333;margin-bottom:8px;height:36px}
.firma-nombre{font-size:10px;font-weight:700;color:#111}
.firma-rol{font-size:8.5px;color:#888;margin-top:2px}

/* ── FOOTER ── */
.footer{
  margin-top:28px;
  padding:10px 0;
  border-top:1px solid #ebebeb;
  display:flex;
  justify-content:space-between;
  font-size:8px;
  color:#bbb;
}
.footer strong{color:#888}

/* ── PAGE BREAK ── */
.page-break{page-break-before:always;padding-top:24px}

/* ── PRINT ── */
@media print{
  body{background:#fff}
  .page{width:100%;padding:0 28px}
  @page{margin:10mm 0;size:A4}
}
</style>
</head>
<body>
<div class="page">

<!-- HEADER -->
<div class="header">
  <div class="brand">
    <h1>${AXANO.nombre}</h1>
    <p>${AXANO.subtitulo}</p>
  </div>
  <div class="badge">Propuesta Comercial</div>
</div>

<!-- INFO BOXES -->
<div class="info-row">
  <div class="info-box">
    <div class="info-box-title">Información del proveedor</div>
    <div class="info-row-item"><span class="lbl">Empresa</span><span class="val">${AXANO.nombre}</span></div>
    <div class="info-row-item"><span class="lbl">Contacto</span><span class="val">${AXANO.contacto}</span></div>
    <div class="info-row-item"><span class="lbl">Email</span><span class="val">${AXANO.email}</span></div>
    <div class="info-row-item"><span class="lbl">Web</span><span class="val">${AXANO.web}</span></div>
  </div>
  <div class="info-box">
    <div class="info-box-title">Detalles de la propuesta</div>
    <div class="info-row-item"><span class="lbl">N° Propuesta</span><span class="val">${p.numero || '—'}</span></div>
    <div class="info-row-item"><span class="lbl">Fecha emisión</span><span class="val">${fmtFecha(p.fecha)}</span></div>
    <div class="info-row-item"><span class="lbl">Validez</span><span class="val">15 días corridos</span></div>
    <div class="info-row-item"><span class="lbl">Cliente</span><span class="val">${p.cliente_nombre || '—'}</span></div>
  </div>
</div>

<!-- ALCANCE -->
<div class="section-title">1. Alcance del Proyecto</div>
<div class="scope-box">
  <p style="margin-bottom:${p.notas?.trim() ? 10 : 0}px;font-weight:600;color:#111">${p.asunto || ''}</p>
  ${renderNotas(p.notas)}
</div>

<!-- OPCIONES DE PAGO -->
<div class="section-title">2. Opciones de Pago</div>
<table class="pagos-table">
  <thead>
    <tr>
      <th>Opción</th>
      <th>Descripción</th>
      <th style="text-align:right">Total</th>
    </tr>
  </thead>
  <tbody>
    <tr class="highlight">
      <td class="tag-cell"><span class="tag tag-contado">Contado</span></td>
      <td>
        <div class="plan-desc">Pago único al inicio</div>
        <div class="plan-sub">Se abona el 100% al firmar la propuesta.</div>
        <div class="plan-recomendado">★ Opción recomendada</div>
      </td>
      <td style="text-align:right">
        <div class="plan-total">${fmt(monto, mon)}</div>
      </td>
    </tr>
    <tr>
      <td class="tag-cell"><span class="tag tag-2p">2 Pagos</span></td>
      <td>
        <div class="plan-desc">50% al inicio · 50% al entregar</div>
        <div class="plan-sub">Recargo del ${Math.round(AXANO.recargo2 * 100)}% por financiamiento.</div>
      </td>
      <td style="text-align:right">
        <div class="plan-total">${fmt(m2, mon)}</div>
        <div class="plan-cuota">2 × ${fmt(cuota2, mon)}</div>
      </td>
    </tr>
    <tr>
      <td class="tag-cell"><span class="tag tag-3p">3 Pagos</span></td>
      <td>
        <div class="plan-desc">Al inicio, a mitad y al entregar</div>
        <div class="plan-sub">Recargo del ${Math.round(AXANO.recargo3 * 100)}% por financiamiento.</div>
      </td>
      <td style="text-align:right">
        <div class="plan-total">${fmt(m3, mon)}</div>
        <div class="plan-cuota">3 × ${fmt(cuota3, mon)}</div>
      </td>
    </tr>
  </tbody>
</table>

<!-- PAGE 2 -->
<div class="page-break"></div>

<!-- CONDICIONES -->
<div class="section-title">3. Condiciones Comerciales</div>
<div class="cond-row">
  <div class="cond-box">
    <div class="cond-box-title">Medios de pago</div>
    <div class="cond-item"><span class="cond-dot">•</span><span>Transferencia bancaria (CVU / CBU)</span></div>
    <div class="cond-item"><span class="cond-dot">•</span><span>Mercado Pago</span></div>
  </div>
  <div class="cond-box">
    <div class="cond-box-title">Tiempos y garantía</div>
    <div class="cond-item"><span class="cond-dot">•</span><span><strong>Inicio:</strong> una vez recibido el anticipo y el material del cliente.</span></div>
    <div class="cond-item"><span class="cond-dot">•</span><span><strong>Revisiones incluidas:</strong> hasta 2 rondas de cambios sin costo adicional.</span></div>
    <div class="cond-item"><span class="cond-dot">•</span><span><strong>Soporte post-entrega:</strong> 15 días para corrección de errores.</span></div>
  </div>
</div>

<div class="cond-row">
  <div class="cond-box">
    <div class="cond-box-title">No incluye</div>
    <div class="cond-item"><span class="cond-dot">•</span><span>Redacción o traducción de contenidos</span></div>
    <div class="cond-item"><span class="cond-dot">•</span><span>Fotografía o producción audiovisual</span></div>
    <div class="cond-item"><span class="cond-dot">•</span><span>Licencias de software o plugins premium de terceros</span></div>
    <div class="cond-item"><span class="cond-dot">•</span><span>Dominio y hosting (salvo que se indique lo contrario)</span></div>
  </div>
  <div class="cond-box">
    <div class="cond-box-title">Consideraciones generales</div>
    <div class="cond-item"><span class="cond-dot">•</span><span>Los cambios fuera del alcance acordado se presupuestan por separado.</span></div>
    <div class="cond-item"><span class="cond-dot">•</span><span>Esta propuesta tiene validez de <strong>15 días corridos</strong> desde su emisión.</span></div>
    <div class="cond-item"><span class="cond-dot">•</span><span>Los valores en USD se facturan al <strong>tipo de cambio oficial del día</strong> de la transacción.</span></div>
  </div>
</div>

<div class="nota-box">
  <strong>💡 Nota:</strong> Los valores indicados son netos. El inicio del proyecto queda condicionado a la recepción del primer pago y aprobación de esta propuesta.
</div>

<!-- FIRMAS -->
<div class="firmas">
  <div class="firma-bloque">
    <div class="firma-linea"></div>
    <div class="firma-nombre">${AXANO.contacto}</div>
    <div class="firma-rol">${AXANO.nombre} · ${AXANO.subtitulo}</div>
  </div>
  <div class="firma-bloque">
    <div class="firma-linea"></div>
    <div class="firma-nombre">Aceptado por el Cliente</div>
    <div class="firma-rol">Firma, aclaración y fecha</div>
  </div>
</div>

<!-- FOOTER -->
<div class="footer">
  <span>Propuesta generada el ${fmtFecha(p.fecha)} · Validez 15 días corridos.</span>
  <strong>${AXANO.web}</strong>
</div>

</div><!-- /page -->
<script>
  document.fonts.ready.then(() => setTimeout(() => window.print(), 500))
</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=900,height=750')
  if (!w) { alert('Permitir popups para generar el PDF'); return }
  w.document.write(html)
  w.document.close()
}
