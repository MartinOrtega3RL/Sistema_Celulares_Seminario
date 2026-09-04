/* src/pages/ventas/VentaTicketModal.jsx
 * RF17.1 — Comprobante no fiscal de venta imprimible
 * RF17.2 — Modal posterior a la venta con opción de impresión directa
 * Estilizado en el sistema de diseño dark-first de Impeccable + pliego térmico de impresión
 */
import { formatPrecio, formatFechaHora } from '../../utils/format'
import { Backdrop, ModalHeader, btnPrimary, btnSecondary } from '../catalogo/ProductoFormModal'

export default function VentaTicketModal({ venta, onClose }) {
  if (!venta) return null

  const handlePrint = () => {
    window.print()
  }

  const clienteNombre = venta.cliente
    ? `${venta.cliente.persona?.nombre || ''} ${venta.cliente.persona?.apellido || ''}`.trim()
    : 'Consumidor Final'

  return (
    <Backdrop onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, maxHeight: '92vh',
          background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
      >
        
        {/* Header (Oculto al imprimir) */}
        <div className="print:hidden">
          <ModalHeader
            title="¡Venta Confirmada con Éxito!"
            sub={`Comprobante N° ${venta.numero_comprobante}`}
            onClose={onClose}
          />
        </div>

        {/* Ticket Container */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }} className="print:p-0">
          
          {/* Ticket de Papel Imprimible */}
          <div
            style={{
              background: '#FFFFFF', color: '#0F172A', padding: '1.5rem',
              borderRadius: 'var(--radius-md)', border: '1px border #CBD5E1',
              fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', boxShadow: 'var(--shadow-sm)'
            }}
            className="print:border-0 print:shadow-none print:p-0"
          >
            {/* Header del Ticket */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #94A3B8', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                EL GRINGO CELULARES
              </h2>
              <p style={{ fontSize: '0.7rem', color: '#475569', margin: '2px 0 0' }}>
                Accesorios, Servicio Técnico y Telefonía
              </p>
              <p style={{ fontSize: '0.65rem', color: '#64748B', margin: '2px 0 0' }}>
                Posadas, Misiones — WhatsApp: 3764-123456
              </p>
              
              <div style={{ marginTop: '0.75rem', padding: '0.25rem 0.5rem', background: '#F1F5F9', borderRadius: 4, display: 'inline-block' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369A1' }}>
                  COMPROBANTE NO FISCAL N° {venta.numero_comprobante}
                </span>
              </div>
            </div>

            {/* Metadatos de la Venta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '1rem', borderBottom: '1px dashed #94A3B8', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.65rem' }}>FECHA Y HORA</span>
                <strong style={{ color: '#0F172A' }}>{formatFechaHora(venta.fecha_venta)}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.65rem' }}>CLIENTE</span>
                <strong style={{ color: '#0F172A' }}>{clienteNombre}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.65rem' }}>FORMA DE PAGO</span>
                <strong style={{ color: '#0F172A' }}>
                  {venta.pago?.medio_pago?.nombre_medio || 'Efectivo'} ({venta.modalidad_pago})
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.65rem' }}>ENTREGA</span>
                <strong style={{ color: '#0F172A' }}>
                  {venta.modalidad_entrega === 'ENVIO_DOMICILIO' ? '🚚 Domicilio' : '🏪 Retiro Local'}
                </strong>
              </div>
            </div>

            {/* Detalle de Productos */}
            <div style={{ marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #CBD5E1', color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.375rem 0' }}>Cant. x Producto</th>
                    <th style={{ padding: '0.375rem 0', textAlign: 'right' }}>P.Unit</th>
                    <th style={{ padding: '0.375rem 0', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.detalles?.map((d, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px border #F1F5F9' }}>
                      <td style={{ padding: '0.5rem 0', color: '#0F172A', fontWeight: 600 }}>
                        {d.cantidad} x {d.producto?.denominacion || 'Producto'}
                        <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B' }}>
                          [{d.producto?.codigo_interno}]
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', color: '#475569' }}>
                        {formatPrecio(d.precio_unitario)}
                      </td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                        {formatPrecio(d.precio_unitario * d.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total acumulado */}
            <div style={{ borderTop: '2px solid #0F172A', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>TOTAL PAGADO</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0369A1' }}>
                {formatPrecio(venta.total)}
              </span>
            </div>

            {/* Pie de Garantía y Términos */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px dashed #94A3B8', fontSize: '0.65rem', color: '#64748B' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#334155' }}>Garantía oficial de 30 días con este ticket.</p>
              <p style={{ margin: '2px 0 0' }}>¡Muchas gracias por su compra en El Gringo Celulares!</p>
            </div>
          </div>

        </div>

        {/* Footer Acciones (Oculto al imprimir) */}
        <div style={{ padding: '1rem 1.25rem', background: 'var(--color-bg-elevated)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="print:hidden">
          <button
            type="button"
            onClick={onClose}
            style={btnSecondary}
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{ ...btnPrimary, background: 'var(--color-accent)', color: 'var(--color-text-inverse)' }}
          >
            🖨️ Imprimir Ticket No Fiscal
          </button>
        </div>

      </div>
    </Backdrop>
  )
}
