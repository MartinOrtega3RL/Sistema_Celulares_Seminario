/* src/pages/stock/IngresoMercaderiaModal.jsx
 * RF11.1 — Registrar ingreso de mercadería
 * Estilizado en el sistema de diseño dark-first con tokens de Impeccable
 */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProductos } from '../../services/catalogoService'
import { registrarIngreso } from '../../services/stockService'
import { useAuth } from '../../contexts/AuthContext'
import { Backdrop, ModalBox, ModalHeader, ModalFooter, btnPrimary, btnSecondary } from '../catalogo/ProductoFormModal'

const fieldStyle = {
  width: '100%', background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', padding: '0.5rem 0.75rem', outline: 'none',
}

const labelStyle = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem'
}

export default function IngresoMercaderiaModal({ onClose, onSuccess, initialProductoId = null }) {
  const { user } = useAuth()
  const [productos, setProductos] = useState([])
  const [loadingProds, setLoadingProds] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [idProducto, setIdProducto] = useState(initialProductoId || '')
  const [cantidad, setCantidad] = useState(1)
  const [motivo, setMotivo] = useState('Ingreso de mercadería / Remito de compra')
  const [proveedor, setProveedor] = useState('')
  const [comprobante, setComprobante] = useState('')

  useEffect(() => {
    let mounted = true
    getProductos({ limit: 9999 })
      .then(res => {
        if (mounted) {
          setProductos(res.data || [])
          setLoadingProds(false)
        }
      })
      .catch(() => {
        if (mounted) setLoadingProds(false)
      })
    return () => { mounted = false }
  }, [])

  const selectedProd = productos.find(p => p.id_producto === Number(idProducto))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!idProducto) {
      toast.error('Seleccioná un producto de la lista.')
      return
    }
    if (cantidad <= 0) {
      toast.error('La cantidad ingresada debe ser mayor a 0.')
      return
    }

    setSubmitting(true)
    try {
      const detalleMotivo = [
        motivo,
        proveedor ? `Prov: ${proveedor}` : null,
        comprobante ? `Comp: ${comprobante}` : null,
      ].filter(Boolean).join(' | ')

      await registrarIngreso({
        id_producto: Number(idProducto),
        cantidad: Number(cantidad),
        motivo: detalleMotivo,
        id_usuario: user?.id_usuario,
      })

      toast.success(`Se ingresaron ${cantidad} unidad(es) a "${selectedProd?.denominacion}".`)
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Error al registrar el ingreso de mercadería.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Backdrop onClick={onClose}>
      <ModalBox id="ingreso-modal">
        <ModalHeader
          title="Ingreso de Mercadería"
          sub="RF11.1 — Incrementar existencias por compras o recepciones"
          onClose={onClose}
        />

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Seleccionar Producto */}
            <div>
              <label style={labelStyle}>
                Producto <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              {loadingProds ? (
                <div style={{ height: 38, background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)' }} />
              ) : (
                <select
                  value={idProducto}
                  onChange={e => setIdProducto(e.target.value)}
                  required
                  style={fieldStyle}
                >
                  <option value="" disabled>Seleccionar producto...</option>
                  {productos.map(p => (
                    <option key={p.id_producto} value={p.id_producto} style={{ background: 'var(--color-bg-surface)' }}>
                      {p.codigo_interno} — {p.denominacion} (Stock actual: {p.stock_actual})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Info del producto seleccionado */}
            {selectedProd && (
              <div style={{
                padding: '0.75rem 1rem', background: 'var(--color-success-muted)',
                border: '1px solid hsl(148 40% 24%)', borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)'
              }}>
                <div>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700, display: 'block' }}>{selectedProd.denominacion}</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>Código: {selectedProd.codigo_interno}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Stock actual: <strong style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>{selectedProd.stock_actual}</strong></span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Mínimo: {selectedProd.stock_minimo}</span>
                </div>
              </div>
            )}

            {/* Cantidad a ingresar */}
            <div>
              <label style={labelStyle}>
                Cantidad a ingresar <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={cantidad}
                  onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  style={{ ...fieldStyle, flex: 1, fontSize: 'var(--text-lg)', fontWeight: 700 }}
                />
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {[1, 5, 10, 50].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCantidad(prev => prev + n)}
                      style={{
                        padding: '0.5rem 0.625rem', background: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)',
                        borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              </div>
              {selectedProd && (
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.375rem' }}>
                  Nuevo stock proyectado: <strong style={{ color: 'var(--color-success)' }}>{selectedProd.stock_actual + Number(cantidad)}</strong> unidades
                </p>
              )}
            </div>

            {/* Proveedor y Comprobante */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Proveedor (Opcional)</label>
                <input
                  type="text"
                  value={proveedor}
                  onChange={e => setProveedor(e.target.value)}
                  placeholder="Ej. Distribuidora Anker"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>N° Comprobante / Remito</label>
                <input
                  type="text"
                  value={comprobante}
                  onChange={e => setComprobante(e.target.value)}
                  placeholder="Ej. REM-0001-492"
                  style={fieldStyle}
                />
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label style={labelStyle}>Observación / Motivo</label>
              <input
                type="text"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Detalle adicional de la recepción"
                style={fieldStyle}
              />
            </div>

          </div>

          <ModalFooter>
            <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
            <button type="submit" disabled={submitting} style={{ ...btnPrimary, background: 'var(--color-success)', color: 'var(--color-text-inverse)' }}>
              {submitting ? 'Registrando...' : 'Confirmar Ingreso'}
            </button>
          </ModalFooter>
        </form>
      </ModalBox>
    </Backdrop>
  )
}
