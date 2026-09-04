/* src/pages/catalogo/ActualizarPreciosModal.jsx — RF08.4 Actualización masiva de precios */
import { useState } from 'react'
import { toast } from 'sonner'
import { actualizarPreciosMasivo } from '../../services/catalogoService'
import { Backdrop, ModalBox, ModalHeader, ModalFooter, btnPrimary, btnSecondary, SectionLabel, SpinIcon } from './ProductoFormModal'

export default function ActualizarPreciosModal({ categorias, marcas, onClose, onSaved }) {
  const [filtroTipo, setFiltroTipo] = useState('todos') // 'todos' | 'categoria' | 'marca'
  const [filtroId, setFiltroId]     = useState('')
  const [camposPrecio, setCampos]   = useState({ minorista: true, mayorista: true, costo: false })
  const [porcentaje, setPct]        = useState('')
  const [submitting, setSubmit]     = useState(false)
  const [preview, setPreview]       = useState(null) // { count, ejemplos[] }

  const pctNum = Number(porcentaje)
  const pctValid = porcentaje !== '' && !isNaN(pctNum) && pctNum !== 0 && Math.abs(pctNum) <= 500

  async function handlePreview() {
    // Mock preview: just count matching products
    const filter = filtroTipo === 'categoria'
      ? { categoria: filtroId }
      : filtroTipo === 'marca'
        ? { marca: filtroId }
        : {}
    const { getProductos } = await import('../../services/catalogoService')
    const { data } = await getProductos({ limit: 9999, ...filter })
    setPreview({ count: data.length, ejemplos: data.slice(0, 3) })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!pctValid) return
    setSubmit(true)
    try {
      const filter = filtroTipo === 'categoria' ? { id_categoria: Number(filtroId) }
                   : filtroTipo === 'marca'     ? { id_marca: Number(filtroId) }
                   : {}
      await actualizarPreciosMasivo({ porcentaje: pctNum, ...filter, campos: camposPrecio })
      const signo = pctNum > 0 ? '+' : ''
      toast.success(`Precios actualizados (${signo}${pctNum} %) en ${preview?.count ?? '?'} productos.`)
      onSaved()
    } catch (err) {
      toast.error(err?.message ?? 'Error al actualizar precios.')
    } finally {
      setSubmit(false)
    }
  }

  return (
    <Backdrop onClick={onClose}>
      <ModalBox id="precios-modal">
        <ModalHeader title="Actualizar precios" sub="RF08.4 — Ajuste masivo por porcentaje" onClose={onClose} />
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Alcance */}
            <section>
              <SectionLabel>Alcance del ajuste</SectionLabel>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {[
                  { val: 'todos',     label: 'Todos los productos' },
                  { val: 'categoria', label: 'Por categoría' },
                  { val: 'marca',     label: 'Por marca' },
                ].map(o => (
                  <button key={o.val} type="button" id={`alcance-${o.val}`} onClick={() => { setFiltroTipo(o.val); setFiltroId(''); setPreview(null) }}
                    style={{
                      padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-md)', border: `1px solid ${filtroTipo === o.val ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
                      background: filtroTipo === o.val ? 'var(--color-accent-subtle)' : 'transparent',
                      color: filtroTipo === o.val ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                      fontSize: 'var(--text-xs)', fontWeight: 500, cursor: 'pointer', transition: 'all var(--duration-fast)',
                    }}>
                    {o.label}
                  </button>
                ))}
              </div>
              {filtroTipo === 'categoria' && (
                <select id="sel-categoria" value={filtroId} onChange={e => { setFiltroId(e.target.value); setPreview(null) }}
                  style={{ width: '100%', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', padding: '0.5rem 0.75rem', outline: 'none' }}>
                  <option value="">Seleccioná una categoría…</option>
                  {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
                </select>
              )}
              {filtroTipo === 'marca' && (
                <select id="sel-marca" value={filtroId} onChange={e => { setFiltroId(e.target.value); setPreview(null) }}
                  style={{ width: '100%', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', padding: '0.5rem 0.75rem', outline: 'none' }}>
                  <option value="">Seleccioná una marca…</option>
                  {marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.nombre_marca}</option>)}
                </select>
              )}
            </section>

            {/* Campos a actualizar */}
            <section>
              <SectionLabel>Campos a ajustar</SectionLabel>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[
                  { key: 'minorista', label: 'Minorista' },
                  { key: 'mayorista', label: 'Mayorista' },
                  { key: 'costo',     label: 'Costo' },
                ].map(c => (
                  <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    <input type="checkbox" id={`check-${c.key}`} checked={camposPrecio[c.key]}
                      onChange={e => setCampos(f => ({ ...f, [c.key]: e.target.checked }))}
                      style={{ accentColor: 'var(--color-accent)' }} />
                    {c.label}
                  </label>
                ))}
              </div>
            </section>

            {/* Porcentaje */}
            <section>
              <SectionLabel>Variación porcentual</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative', maxWidth: 160 }}>
                  <input
                    id="pct-input"
                    type="number"
                    step="0.5"
                    value={porcentaje}
                    onChange={e => { setPct(e.target.value); setPreview(null) }}
                    placeholder="Ej: 10 o -5"
                    style={{ width: '100%', background: 'var(--color-bg-elevated)', border: `1px solid ${pctValid || !porcentaje ? 'var(--color-border-default)' : 'var(--color-danger)'}`, borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', padding: '0.5rem 2rem 0.5rem 0.75rem', outline: 'none' }}
                  />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>%</span>
                </div>
                {pctNum > 0 && porcentaje !== '' && (
                  <span style={{ padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)', background: 'var(--color-success-muted)', color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 700 }}>
                    +{pctNum}% → aumento
                  </span>
                )}
                {pctNum < 0 && porcentaje !== '' && (
                  <span style={{ padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 700 }}>
                    {pctNum}% → reducción
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.375rem' }}>
                Positivo = aumenta, negativo = reduce. Máximo ±500 %.
              </p>
            </section>

            {/* Preview */}
            <section>
              <button type="button" id="btn-preview-precios" onClick={handlePreview}
                disabled={filtroTipo !== 'todos' && !filtroId}
                style={{ ...btnSecondary, opacity: (filtroTipo !== 'todos' && !filtroId) ? 0.5 : 1 }}>
                Ver productos afectados
              </button>
              {preview && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {preview.count} producto{preview.count !== 1 ? 's' : ''} afectado{preview.count !== 1 ? 's' : ''}
                  </p>
                  {preview.ejemplos.map(p => (
                    <div key={p.id_producto} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', padding: '0.2rem 0' }}>
                      <span>{p.denominacion}</span>
                      <div style={{ display: 'flex', gap: '0.75rem', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                        <span>$ {p.precio_minorista} → <strong style={{ color: 'var(--color-text-primary)' }}>$ {Math.round(p.precio_minorista * (1 + pctNum / 100))}</strong></span>
                      </div>
                    </div>
                  ))}
                  {preview.count > 3 && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', margin: '0.375rem 0 0' }}>y {preview.count - 3} más…</p>}
                </div>
              )}
            </section>
          </div>

          <ModalFooter>
            <button id="precios-cancelar" type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
            <button id="precios-aplicar" type="submit" disabled={!pctValid || submitting || !Object.values(camposPrecio).some(Boolean)}
              style={{ ...btnPrimary, opacity: (!pctValid || submitting || !Object.values(camposPrecio).some(Boolean)) ? 0.5 : 1 }}>
              {submitting ? <><SpinIcon /> Aplicando…</> : 'Aplicar ajuste'}
            </button>
          </ModalFooter>
        </form>
      </ModalBox>
    </Backdrop>
  )
}
