/* src/pages/ventas/HistorialVentasPage.jsx
 * RF18.1 — Historial de ventas filtrable por período y cliente
 * RF18.2 — Modal de detalle y anulación con motivo obligatorio
 * Estilizado en el sistema de diseño dark-first de Impeccable
 */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getVentas } from '../../services/ventasService'
import { getClientes } from '../../services/clientesService'
import { formatPrecio, formatFechaHora } from '../../utils/format'
import VentaDetalleModal from './VentaDetalleModal'
import VentaTicketModal from './VentaTicketModal'

export default function HistorialVentasPage() {
  const [ventas, setVentas] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [idCliente, setIdCliente] = useState('')
  const [searchComp, setSearchComp] = useState('')

  // Modales
  const [ventaDetalle, setVentaDetalle] = useState(null)
  const [ventaTicket, setVentaTicket] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [ventasRes, clientesRes] = await Promise.all([
        getVentas({ desde, hasta, id_cliente: idCliente }),
        getClientes({ limit: 9999 }),
      ])
      setVentas(ventasRes.data || [])
      setClientes(clientesRes.data || [])
    } catch (err) {
      toast.error('Error al cargar el historial de ventas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [desde, hasta, idCliente])

  // Filtrado local por número comprobante o nombre cliente
  const ventasFiltradas = ventas.filter(v => {
    if (!searchComp) return true
    const q = searchComp.toLowerCase()
    const clienteNom = `${v.cliente?.persona?.nombre || ''} ${v.cliente?.persona?.apellido || ''}`.toLowerCase()
    return v.numero_comprobante?.toLowerCase().includes(q) || clienteNom.includes(q)
  })

  const totalRecaudado = ventasFiltradas.filter(v => v.estado !== 'ANULADA').reduce((a, v) => a + v.total, 0)

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Módulo */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyBetween: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)', margin: 0 }}>
            Historial de Ventas
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            RF18.1, RF18.2 — Consulta de comprobantes emitidos, reimpresión de tickets y anulaciones transaccionales
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1.4rem' }}>
            🧾
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', uppercase: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>Ventas Registradas</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{ventasFiltradas.length}</span>
          </div>
        </div>

        <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-success-muted)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1.4rem' }}>
            💵
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', uppercase: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>Total Recaudado</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>{formatPrecio(totalRecaudado)}</span>
          </div>
        </div>

      </div>

      {/* Surface Box */}
      <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        
        {/* Filters Header */}
        <div style={{ padding: '1rem', background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Fecha Desde</label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              style={{ width: '100%', height: 36, padding: '0 0.625rem', fontSize: 'var(--text-xs)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Fecha Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              style={{ width: '100%', height: 36, padding: '0 0.625rem', fontSize: 'var(--text-xs)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Cliente</label>
            <select
              value={idCliente}
              onChange={e => setIdCliente(e.target.value)}
              style={{ width: '100%', height: 36, padding: '0 0.625rem', fontSize: 'var(--text-xs)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
            >
              <option value="">Todos los clientes</option>
              {clientes.map(c => (
                <option key={c.id_cliente} value={c.id_cliente} style={{ background: 'var(--color-bg-surface)' }}>
                  {c.persona?.nombre} {c.persona?.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Comprobante / Nombre</label>
            <input
              type="text"
              value={searchComp}
              onChange={e => setSearchComp(e.target.value)}
              placeholder="Ej. GC-V-0010..."
              style={{ width: '100%', height: 36, padding: '0 0.625rem', fontSize: 'var(--text-xs)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        {/* Tabla de Ventas */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando ventas...</div>
          ) : ventasFiltradas.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              No se encontraron ventas registradas en el período.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)' }}>
                  <th style={{ padding: '0.875rem 1rem' }}>N° Comprobante</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Fecha y Hora</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Cliente</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Medio / Pago</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--color-text-primary)' }}>
                {ventasFiltradas.map(v => {
                  const clienteNombre = v.cliente
                    ? `${v.cliente.persona?.nombre || ''} ${v.cliente.persona?.apellido || ''}`.trim()
                    : 'Consumidor Final'
                  const esAnulada = v.estado === 'ANULADA'

                  return (
                    <tr key={v.id_venta} style={{ borderBottom: '1px solid var(--color-border-subtle)', opacity: esAnulada ? 0.6 : 1 }}>
                      
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)' }}>
                        {v.numero_comprobante}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                        {formatFechaHora(v.fecha_venta)}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                        {clienteNombre}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', fontSize: 'var(--text-xs)' }}>
                        <span style={{ color: 'var(--color-text-primary)', display: 'block' }}>{v.pago?.medio_pago?.nombre_medio || 'Efectivo'}</span>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>{v.modalidad_pago}</span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-pill)', fontSize: '0.65rem', fontWeight: 800,
                          background: esAnulada ? 'var(--color-danger-muted)' : 'var(--color-success-muted)',
                          color: esAnulada ? 'var(--color-danger)' : 'var(--color-success)',
                          border: `1px solid ${esAnulada ? 'hsl(4 60% 24%)' : 'hsl(148 40% 24%)'}`
                        }}>
                          {esAnulada ? 'ANULADA' : 'CONFIRMADA'}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 900, fontSize: 'var(--text-base)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatPrecio(v.total)}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                          <button
                            onClick={() => setVentaDetalle(v)}
                            title="Ver detalle / Anular"
                            style={{
                              padding: '0.375rem 0.625rem', borderRadius: 'var(--radius-md)',
                              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
                              color: 'var(--color-text-primary)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            👁️ Detalle
                          </button>
                          <button
                            onClick={() => setVentaTicket(v)}
                            title="Reimprimir ticket"
                            style={{
                              padding: '0.375rem 0.5rem', borderRadius: 'var(--radius-md)',
                              background: 'var(--color-accent-subtle)', border: '1px solid hsl(183 40% 24%)',
                              color: 'var(--color-accent)', cursor: 'pointer', fontSize: 'var(--text-xs)'
                            }}
                          >
                            🖨️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Modales */}
      {ventaDetalle && (
        <VentaDetalleModal
          venta={ventaDetalle}
          onClose={() => setVentaDetalle(null)}
          onAnulada={loadData}
        />
      )}

      {ventaTicket && (
        <VentaTicketModal
          venta={ventaTicket}
          onClose={() => setVentaTicket(null)}
        />
      )}

    </div>
  )
}
