/* src/pages/stock/AjusteStockModal.jsx
 * RF11.5 — Modal de ajuste manual de stock con motivo obligatorio
 * Estilizado en el sistema de diseño dark-first con tokens de Impeccable
 */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProductos } from '../../services/catalogoService'
import { registrarAjuste } from '../../services/stockService'
import { useAuth } from '../../contexts/AuthContext'
import { Backdrop, ModalBox, ModalHeader, ModalFooter, btnPrimary, btnSecondary } from '../catalogo/ProductoFormModal'

const MOTIVOS_PRESET = [
  'Rotura / Producto Dañado',
  'Pérdida / Faltante en inventario',
  'Conteo físico / Ajuste de auditoría',
  'Devolución de cliente',
  'Devolución a proveedor',
  'Muestra comercial / Exhibición',
]

const fieldStyle = {
  width: '100%', background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', padding: '0.5rem 0.75rem', outline: 'none',
}

const labelStyle = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem'
}

export default function AjusteStockModal({ onClose, onSuccess, initialProductoId = null }) {
  const { user } = useAuth()
  const [productos, setProductos] = useState([])
  const [loadingProds, setLoadingProds] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [idProducto, setIdProducto] = useState(initialProductoId || '')
  const [tipoOperacion, setTipoOperacion] = useState('DECREMENTO') // 'INCREMENTO' | 'DECREMENTO'
  const [cantidad, setCantidad] = useState(1)
  const [motivoPreset, setMotivoPreset] = useState(MOTIVOS_PRESET[0])
  const [motivoDetalle, setMotivoDetalle] = useState('')

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

  const deltaCantidad = tipoOperacion === 'INCREMENTO' ? Math.abs(cantidad) : -Math.abs(cantidad)
  const nuevoStockCalculado = selectedProd ? Math.max(0, selectedProd.stock_actual + deltaCantidad) : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!idProducto) {
      toast.error('Seleccioná un producto para realizar el ajuste.')
      return
    }
    if (!cantidad || cantidad <= 0) {
      toast.error('La cantidad a ajustar debe ser mayor a 0.')
      return
    }

    const motivoFinal = motivoPreset === 'Otro'
      ? motivoDetalle.trim()
      : motivoDetalle.trim() ? `${motivoPreset} — ${motivoDetalle.trim()}` : motivoPreset

    if (!motivoFinal) {
      toast.error('El motivo del ajuste es obligatorio (RF11.5).')
      return
    }

    setSubmitting(true)
    try {
      await registrarAjuste({
        id_producto: Number(idProducto),
        cantidad: deltaCantidad,
        motivo: motivoFinal,
        id_usuario: user?.id_usuario,
      })

      toast.success(`Ajuste de stock registrado para "${selectedProd?.denominacion}".`)
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Error al registrar el ajuste de stock.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Backdrop onClick={onClose}>
      <ModalBox id="ajuste-modal">
        <ModalHeader
          title="Ajuste Manual de Existencias"
          sub="RF11.5 — Corrección manual de stock con motivo obligatorio"
          onClose={onClose}
        />

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Seleccionar Producto */}
            <div>
              <label style={labelStyle}>
                Producto a ajustar <span style={{ color: 'var(--color-danger)' }}>*</span>
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
                      {p.codigo_interno} — {p.denominacion} (Stock: {p.stock_actual})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Tipo de Ajuste */}
            <div>
              <label style={labelStyle}>Tipo de Ajuste</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.25rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setTipoOperacion('DECREMENTO')}
                  style={{
                    padding: '0.5rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer',
                    background: tipoOperacion === 'DECREMENTO' ? 'var(--color-danger-muted)' : 'transparent',
                    color: tipoOperacion === 'DECREMENTO' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                    border: tipoOperacion === 'DECREMENTO' ? '1px solid var(--color-danger)' : '1px solid transparent',
                  }}
                >
                  🔻 Restar / Salida
                </button>
                <button
                  type="button"
                  onClick={() => setTipoOperacion('INCREMENTO')}
                  style={{
                    padding: '0.5rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer',
                    background: tipoOperacion === 'INCREMENTO' ? 'var(--color-success-muted)' : 'transparent',
                    color: tipoOperacion === 'INCREMENTO' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    border: tipoOperacion === 'INCREMENTO' ? '1px solid var(--color-success)' : '1px solid transparent',
                  }}
                >
                  🔺 Sumar / Entrada
                </button>
              </div>
            </div>

            {/* Cantidad */}
            <div>
              <label style={labelStyle}>
                Cantidad de unidades <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                required
                style={{ ...fieldStyle, fontSize: 'var(--text-lg)', fontWeight: 700 }}
              />
            </div>

            {/* Preview del stock proyectado */}
            {selectedProd && (
              <div style={{
                padding: '0.75rem 1rem', background: 'var(--color-warning-muted)',
                border: '1px solid hsl(38 60% 24%)', borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)'
              }}>
                <div>
                  <span style={{ color: 'var(--color-warning)', fontWeight: 700, display: 'block' }}>{selectedProd.denominacion}</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>Stock actual: {selectedProd.stock_actual} u.</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Nuevo stock:</span>
                  <strong style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: nuevoStockCalculado <= selectedProd.stock_minimo ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                    {nuevoStockCalculado} u.
                  </strong>
                </div>
              </div>
            )}

            {/* Motivo (Obligatorio RF11.5) */}
            <div>
              <label style={labelStyle}>
                Motivo del Ajuste <span style={{ color: 'var(--color-danger)' }}>* (Obligatorio)</span>
              </label>
              <select
                value={motivoPreset}
                onChange={e => setMotivoPreset(e.target.value)}
                style={{ ...fieldStyle, marginBottom: '0.5rem' }}
              >
                {MOTIVOS_PRESET.map(m => (
                  <option key={m} value={m} style={{ background: 'var(--color-bg-surface)' }}>{m}</option>
                ))}
                <option value="Otro" style={{ background: 'var(--color-bg-surface)' }}>Otro motivo específico...</option>
              </select>

              <input
                type="text"
                value={motivoDetalle}
                onChange={e => setMotivoDetalle(e.target.value)}
                placeholder={motivoPreset === 'Otro' ? 'Escribí el motivo detallado...' : 'Aclaración adicional (opcional)'}
                required={motivoPreset === 'Otro'}
                style={fieldStyle}
              />
            </div>

          </div>

          <ModalFooter>
            <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
            <button type="submit" disabled={submitting} style={{ ...btnPrimary, background: 'var(--color-warning)', color: 'var(--color-text-inverse)' }}>
              {submitting ? 'Guardando...' : 'Aplicar Ajuste'}
            </button>
          </ModalFooter>
        </form>
      </ModalBox>
    </Backdrop>
  )
}
