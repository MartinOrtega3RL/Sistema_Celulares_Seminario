/* src/pages/catalogo/EtiquetasModal.jsx
 * RF09.1 — Generación de etiquetas con código de barras
 * RF09.2 — Impresión masiva o individual de etiquetas
 * Estilizado en el sistema de diseño dark-first con tokens de Impeccable
 */
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { formatPrecio } from '../../utils/format'
import { Backdrop, ModalHeader, btnPrimary, btnSecondary } from './ProductoFormModal'

/** Generador de barras SVG estático/dinámico tipo Code128 simulación limpia */
function BarcodeSVG({ code = '000000', width = 180, height = 48 }) {
  const hash = Array.from(code).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 100000, 7)
  const pattern = [
    2, 1, 1, 3, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 2, 1, 1, 3, 1, 1, 2, 3, 1, 2,
    (hash % 3) + 1, ((hash * 2) % 3) + 1, ((hash * 5) % 2) + 1, 2, 1, 3, 1, 2
  ]
  const totalUnits = pattern.reduce((a, b) => a + b, 0)
  const unitWidth = width / totalUnits

  let currentX = 0
  const bars = []

  pattern.forEach((w, idx) => {
    const isBlack = idx % 2 === 0
    if (isBlack) {
      bars.push(
        <rect
          key={idx}
          x={currentX}
          y={0}
          width={w * unitWidth}
          height={height}
          fill="#0F172A"
        />
      )
    }
    currentX += w * unitWidth
  })

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ margin: '0.25rem auto' }}>
      {bars}
    </svg>
  )
}

export default function EtiquetasModal({ productos = [], initialProducto = null, onClose }) {
  const [selectedProds, setSelectedProds] = useState(() => {
    if (initialProducto) {
      return [{ ...initialProducto, copias: 2 }]
    }
    return productos.slice(0, 4).map(p => ({ ...p, copias: 1 }))
  })

  const [mostrarPrecios, setMostrarPrecios] = useState(true)
  const [mostrarMarca, setMostrarMarca] = useState(true)
  const [tamanoEtiqueta, setTamanoEtiqueta] = useState('standard') // 'compact', 'standard', 'large'
  const printRef = useRef(null)

  const handleUpdateCopias = (id, delta) => {
    setSelectedProds(prev =>
      prev.map(p => p.id_producto === id ? { ...p, copias: Math.max(1, p.copias + delta) } : p)
    )
  }

  const handleRemove = (id) => {
    setSelectedProds(prev => prev.filter(p => p.id_producto !== id))
  }

  const handleAddProducto = (e) => {
    const id = Number(e.target.value)
    if (!id) return
    const prod = productos.find(p => p.id_producto === id)
    if (prod && !selectedProds.some(p => p.id_producto === id)) {
      setSelectedProds(prev => [...prev, { ...prod, copias: 1 }])
    }
  }

  const totalEtiquetas = selectedProds.reduce((acc, p) => acc + p.copias, 0)

  const handlePrint = () => {
    if (totalEtiquetas === 0) {
      toast.error('Seleccioná al menos un producto para imprimir.')
      return
    }
    window.print()
  }

  const listaEtiquetas = selectedProds.flatMap(p =>
    Array.from({ length: p.copias }).map((_, i) => ({ ...p, copiaIdx: i }))
  )

  return (
    <Backdrop onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 900, maxHeight: '92vh',
          background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
      >
        
        {/* Header */}
        <div className="print:hidden">
          <ModalHeader
            title="Generador de Etiquetas con Código de Barras"
            sub={`RF09.1 — ${totalEtiquetas} etiqueta${totalEtiquetas === 1 ? '' : 's'} listas para impresión`}
            onClose={onClose}
          />
        </div>

        {/* Layout Principal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }} className="print:p-0 print:grid-cols-1">
          
          {/* Panel de Controles (Oculto al imprimir) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="print:hidden">
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', marginBottom: '0.5rem' }}>
                Agregar producto a la lista
              </label>
              <select
                onChange={handleAddProducto}
                defaultValue=""
                style={{ width: '100%', height: 38, padding: '0 0.75rem', fontSize: 'var(--text-sm)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
              >
                <option value="" disabled style={{ background: 'var(--color-bg-surface)' }}>Seleccionar de catálogo...</option>
                {productos.map(p => (
                  <option key={p.id_producto} value={p.id_producto} style={{ background: 'var(--color-bg-surface)' }}>
                    {p.codigo_interno} — {p.denominacion}
                  </option>
                ))}
              </select>
            </div>

            {/* Opciones de diseño */}
            <div style={{ padding: '1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>
                Configuración de etiqueta
              </span>
              
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.375rem' }}>Tamaño de etiqueta</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem', padding: '0.25rem', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-md)' }}>
                  <button
                    type="button"
                    onClick={() => setTamanoEtiqueta('compact')}
                    style={{
                      padding: '0.375rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
                      background: tamanoEtiqueta === 'compact' ? 'var(--color-bg-overlay)' : 'transparent',
                      color: tamanoEtiqueta === 'compact' ? 'var(--color-accent)' : 'var(--color-text-secondary)', border: 'none'
                    }}
                  >
                    Chica
                  </button>
                  <button
                    type="button"
                    onClick={() => setTamanoEtiqueta('standard')}
                    style={{
                      padding: '0.375rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
                      background: tamanoEtiqueta === 'standard' ? 'var(--color-bg-overlay)' : 'transparent',
                      color: tamanoEtiqueta === 'standard' ? 'var(--color-accent)' : 'var(--color-text-secondary)', border: 'none'
                    }}
                  >
                    Estándar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTamanoEtiqueta('large')}
                    style={{
                      padding: '0.375rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
                      background: tamanoEtiqueta === 'large' ? 'var(--color-bg-overlay)' : 'transparent',
                      color: tamanoEtiqueta === 'large' ? 'var(--color-accent)' : 'var(--color-text-secondary)', border: 'none'
                    }}
                  >
                    Grande
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={mostrarPrecios}
                    onChange={e => setMostrarPrecios(e.target.checked)}
                  />
                  Incluir Precio Minorista
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={mostrarMarca}
                    onChange={e => setMostrarMarca(e.target.checked)}
                  />
                  Mostrar Marca / Categoría
                </label>
              </div>
            </div>

            {/* Selector de copias por producto */}
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block', marginBottom: '0.5rem' }}>
                Productos seleccionados ({selectedProds.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 200, overflowY: 'auto' }}>
                {selectedProds.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', padding: '0.75rem', textAlign: 'center', border: '1px dashed var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                    Sin productos seleccionados
                  </p>
                ) : (
                  selectedProds.map(p => (
                    <div key={p.id_producto} style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ minWidth: 0, flex: 1, paddingRight: '0.5rem' }}>
                        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.denominacion}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', margin: 0 }}>{p.codigo_interno}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateCopias(p.id_producto, -1)}
                          style={{ width: 22, height: 22, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', width: 20, textAlign: 'center' }}>{p.copias}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCopias(p.id_producto, 1)}
                          style={{ width: 22, height: 22, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(p.id_producto)}
                          style={{ width: 22, height: 22, borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', background: 'transparent', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginLeft: 4 }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Previsualización e Hoja de Impresión */}
          <div style={{ padding: '1rem', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)', overflowY: 'auto', maxHeight: 460 }} className="print:bg-white print:p-0 print:border-0 print:max-h-none">
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '0.75rem' }} className="print:hidden">
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)' }}>
                Previsualización de Pliego Imprimible
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                {totalEtiquetas} etiqueta{totalEtiquetas === 1 ? '' : 's'}
              </span>
            </div>

            {/* Grid de etiquetas (Paper preview) */}
            <div
              ref={printRef}
              style={{
                display: 'grid', gap: '0.75rem',
                gridTemplateColumns: tamanoEtiqueta === 'compact' ? 'repeat(auto-fill, minmax(130px, 1fr))' : tamanoEtiqueta === 'large' ? 'repeat(auto-fill, minmax(220px, 1fr))' : 'repeat(auto-fill, minmax(170px, 1fr))'
              }}
              className="print:grid-cols-3 print:gap-2"
            >
              {listaEtiquetas.map((item, idx) => (
                <div
                  key={`${item.id_producto}-${idx}`}
                  style={{
                    background: '#FFFFFF', color: '#0F172A', border: '1px border #CBD5E1', borderRadius: 8, padding: 10,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center',
                    minHeight: tamanoEtiqueta === 'compact' ? 115 : tamanoEtiqueta === 'large' ? 170 : 140
                  }}
                  className="print:border-slate-800 print:break-inside-avoid"
                >
                  <div style={{ width: '100%' }}>
                    {mostrarMarca && (
                      <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.marca?.nombre_marca || (typeof item.marca === 'string' ? item.marca : 'Sistema Celulares')}
                      </span>
                    )}
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', margin: '2px 0 0', lineHeight: 1.2 }}>
                      {item.denominacion}
                    </h4>
                  </div>

                  <div style={{ margin: '4px 0' }}>
                    <BarcodeSVG
                      code={item.codigo_interno || '000000'}
                      width={tamanoEtiqueta === 'compact' ? 110 : tamanoEtiqueta === 'large' ? 180 : 140}
                      height={tamanoEtiqueta === 'compact' ? 28 : tamanoEtiqueta === 'large' ? 48 : 36}
                    />
                    <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, color: '#334155', letterSpacing: '0.1em', display: 'block' }}>
                      {item.codigo_interno}
                    </span>
                  </div>

                  {mostrarPrecios && (
                    <div style={{ width: '100%', borderTop: '1px solid #E2E8F0', paddingTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700 }}>
                      <span style={{ fontSize: '0.55rem', color: '#64748B', textTransform: 'uppercase' }}>Precio</span>
                      <span style={{ color: '#0369A1', fontWeight: 800 }}>{formatPrecio(item.precio_minorista)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {listaEtiquetas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                No hay etiquetas generadas. Seleccioná productos a la izquierda.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.25rem', background: 'var(--color-bg-elevated)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="print:hidden">
          <button type="button" onClick={onClose} style={btnSecondary}>
            Cerrar
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={totalEtiquetas === 0}
            style={{ ...btnPrimary, opacity: totalEtiquetas === 0 ? 0.5 : 1 }}
          >
            🖨️ Imprimir Etiquetas ({totalEtiquetas})
          </button>
        </div>
      </div>
    </Backdrop>
  )
}
