/* src/pages/ventas/VentaDetalleModal.jsx
 * RF18.2 — Consulta de detalle de venta + Anulación con motivo obligatorio
 * Restituye automáticamente el stock de los productos vendidos
 */
import { useState } from 'react'
import { toast } from 'sonner'
import { anularVenta } from '../../services/ventasService'
import { useAuth } from '../../contexts/AuthContext'
import { formatPrecio, formatFechaHora } from '../../utils/format'
import { Backdrop, ModalBox, ModalHeader, ModalFooter, btnPrimary, btnSecondary } from '../catalogo/ProductoFormModal'

const fieldStyle = {
  width: '100%', background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', padding: '0.5rem 0.75rem', outline: 'none',
}

export default function VentaDetalleModal({ venta, onClose, onAnulada }) {
  const { user, esAdmin } = useAuth()
  const [modoAnular, setModoAnular] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!venta) return null

  const esAnulada = venta.estado === 'ANULADA'

  const handleAnular = async (e) => {
    e.preventDefault()
    if (!motivo.trim()) {
      toast.error('El motivo de anulación es obligatorio (RF18.2).')
      return
    }

    setSubmitting(true)
    try {
      await anularVenta(venta.id_venta, {
        motivo: motivo.trim(),
        id_usuario: user?.id_usuario || 1,
      })
      toast.success(`Venta N° ${venta.numero_comprobante} anulada. Existencias restituidas en stock.`)
      onAnulada?.()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Error al anular la venta.')
    } finally {
      setSubmitting(false)
    }
  }

  const clienteNombre = venta.cliente
    ? `${venta.cliente.persona?.nombre || ''} ${venta.cliente.persona?.apellido || ''}`.trim()
    : 'Consumidor Final'

  return (
    <Backdrop onClick={onClose}>
      <ModalBox id="venta-detalle-modal" wide>
        <ModalHeader
          title={`Detalle de Venta N° ${venta.numero_comprobante}`}
          sub={`Comprobante emitido el ${formatFechaHora(venta.fecha_venta)}`}
          onClose={onClose}
        />

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: 'calc(100dvh - 12rem)', overflowY: 'auto' }}>
          
          {/* Badge de Estado */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: esAnulada ? 'var(--color-danger-muted)' : 'var(--color-success-muted)', borderRadius: 'var(--radius-lg)', border: `1px solid ${esAnulada ? 'var(--color-danger)' : 'var(--color-success)'}` }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, uppercase: 'uppercase', color: esAnulada ? 'var(--color-danger)' : 'var(--color-success)', display: 'block' }}>Estado Transaccional</span>
              <strong style={{ fontSize: 'var(--text-base)', color: esAnulada ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {esAnulada ? '🔴 ANULADA' : '🟢 CONFIRMADA'}
              </strong>
            </div>
            {esAnulada && (
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                <span>Motivo: <strong>{venta.motivo_anulacion}</strong></span>
              </div>
            )}
          </div>

          {/* Ficha Resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', padding: '1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)', fontSize: 'var(--text-xs)' }}>
            <div>
              <span style={{ color: 'var(--color-text-tertiary)', display: 'block' }}>Cliente</span>
              <strong style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>{clienteNombre}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-tertiary)', display: 'block' }}>Lista Aplicada</span>
              <span style={{ color: 'var(--color-accent)', fontWeight: 700, textTransform: 'capitalize' }}>{venta.lista_precio_aplicada || 'Minorista'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-tertiary)', display: 'block' }}>Medio de Pago</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{venta.pago?.medio_pago?.nombre_medio || 'Efectivo'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-tertiary)', display: 'block' }}>Modalidad Entrega</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{venta.modalidad_entrega === 'ENVIO_DOMICILIO' ? '🚚 Domicilio' : '🏪 Retiro Local'}</strong>
            </div>
          </div>

          {/* Tabla de Productos Comprados */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-tertiary)', uppercase: 'uppercase', letterSpacing: 'var(--tracking-widest)', marginBottom: '0.5rem' }}>
              Productos en Comprobante ({venta.detalles?.length || 0})
            </h4>
            <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', fontWeight: 700, uppercase: 'uppercase' }}>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Producto</th>
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'center' }}>Cantidad</th>
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'right' }}>Precio Unit.</th>
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--color-text-primary)' }}>
                  {venta.detalles?.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '0.625rem 0.875rem' }}>
                        <p style={{ fontWeight: 700, margin: 0 }}>{d.producto?.denominacion || 'Producto'}</p>
                        <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{d.producto?.codigo_interno}</span>
                      </td>
                      <td style={{ padding: '0.625rem 0.875rem', textAlign: 'center', fontWeight: 800 }}>
                        {d.cantidad}
                      </td>
                      <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatPrecio(d.precio_unitario)}
                      </td>
                      <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right', fontWeight: 800, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatPrecio(d.precio_unitario * d.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              <span>Total Comprobante: <strong style={{ color: 'var(--color-accent)', marginLeft: 8 }}>{formatPrecio(venta.total)}</strong></span>
            </div>
          </div>

          {/* Formulario de Anulación (RF18.2) */}
          {modoAnular && !esAnulada && (
            <form onSubmit={handleAnular} style={{ padding: '1rem', background: 'var(--color-danger-muted)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-danger)', uppercase: 'uppercase' }}>
                ⚠️ Anulación Transaccional de Venta (RF18.2)
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Al anular esta venta, las unidades descontadas volverán a sumarse automáticamente al stock de cada producto.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '0.25rem' }}>
                  Motivo obligatorio de anulación *
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Ej. Devolución de producto / Error en el cobro / Cancelación cliente"
                  required
                  style={{ ...fieldStyle, border: '1px solid var(--color-danger)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setModoAnular(false)} style={btnSecondary}>Descartar</button>
                <button type="submit" disabled={submitting} style={{ ...btnPrimary, background: 'var(--color-danger)', color: 'var(--color-text-primary)' }}>
                  {submitting ? 'Anulando...' : 'Confirmar Anulación y Restituir Stock'}
                </button>
              </div>
            </form>
          )}

        </div>

        <ModalFooter>
          {!esAnulada && !modoAnular && (esAdmin || true) && (
            <button
              type="button"
              onClick={() => setModoAnular(true)}
              style={{ ...btnSecondary, color: 'var(--color-danger)', borderColor: 'var(--color-danger-muted)' }}
            >
              🚫 Anular Venta
            </button>
          )}
          <button type="button" onClick={onClose} style={btnPrimary}>
            Cerrar
          </button>
        </ModalFooter>

      </ModalBox>
    </Backdrop>
  )
}
