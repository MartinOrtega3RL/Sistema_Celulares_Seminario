/* src/pages/catalogo/ProductoFormModal.jsx
 * RF06.1 Alta  RF06.2 Edición  RF06.3 Baja  RF06.6 Imagen
 * RF08.1-8.3 Precios  RF04.2 Costo solo Admin  RF12.2 Stock mínimo  RF09.1 Código interno
 */
import { forwardRef, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createProducto, updateProducto } from '../../services/catalogoService'

const inputStyle = (err) => ({
  width: '100%', background: 'var(--color-bg-elevated)',
  border: `1px solid ${err ? 'var(--color-danger)' : 'var(--color-border-default)'}`,
  borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)', padding: '0.5rem 0.75rem', outline: 'none',
})

export default function ProductoFormModal({ producto, categorias, marcas, esAdmin, onClose, onSaved }) {
  const isEdit  = !!producto
  const firstRef = useRef(null)

  const [form, setForm]         = useState({
    denominacion:     producto?.denominacion     ?? '',
    descripcion:      producto?.descripcion      ?? '',
    id_categoria:     producto?.id_categoria     ?? (categorias[0]?.id_categoria ?? ''),
    id_marca:         producto?.id_marca         ?? (marcas[0]?.id_marca ?? ''),
    precio_costo:     producto?.precio_costo     ?? '',
    precio_minorista: producto?.precio_minorista ?? '',
    precio_mayorista: producto?.precio_mayorista ?? '',
    stock_minimo:     producto?.stock_minimo     ?? 0,
  })
  const [imagenPreview, setPreview] = useState(producto?.imagen_url ?? null)
  const [imagenFile, setFile]       = useState(null)
  const [touched, setTouched]       = useState({})
  const [submitting, setSubmit]     = useState(false)
  const [createdCode, setCreated]   = useState(null) // show after creation

  // Focus trap
  useEffect(() => {
    firstRef.current?.focus()
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const els = Array.from(document.getElementById('producto-modal')?.querySelectorAll(
          'button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
        ) ?? [])
        if (!els.length) return
        if (e.shiftKey) { if (document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus() } }
        else            { if (document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus() } }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function mark(f) { setTouched(t => ({ ...t, [f]: true })) }
  function set(f, v) { setForm(s => ({ ...s, [f]: v })) }

  const errors = {
    denominacion:     touched.denominacion     && !form.denominacion.trim()   ? 'Requerido.' : null,
    precio_minorista: touched.precio_minorista && !form.precio_minorista       ? 'Requerido.' : null,
    precio_mayorista: touched.precio_mayorista && !form.precio_mayorista       ? 'Requerido.' : null,
  }
  const isValid = form.denominacion.trim() && form.precio_minorista && form.precio_mayorista

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5 MB.'); return }
    setFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ denominacion: true, precio_minorista: true, precio_mayorista: true })
    if (!isValid) return
    setSubmit(true)
    try {
      const data = {
        ...form,
        precio_costo:     Number(form.precio_costo)     || 0,
        precio_minorista: Number(form.precio_minorista),
        precio_mayorista: Number(form.precio_mayorista),
        stock_minimo:     Number(form.stock_minimo)     || 0,
        imagen_url:       imagenPreview, // En backend se usaría FormData con multer
      }
      if (isEdit) {
        await updateProducto(producto.id_producto, data)
        toast.success('Producto actualizado.')
        onSaved()
      } else {
        const nuevo = await createProducto(data)
        setCreated(nuevo.codigo_interno)
        toast.success(`Producto creado con código ${nuevo.codigo_interno}`)
      }
    } catch (err) {
      toast.error(err?.message ?? 'Error al guardar.')
    } finally {
      setSubmit(false)
    }
  }

  // After creation: show the assigned code before closing
  if (createdCode) {
    return (
      <Backdrop onClick={onClose}>
        <ModalBox id="producto-modal">
          <ModalHeader title="Producto creado" sub="Código interno asignado" onClose={onClose} />
          <div style={{ padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-xl)', background: 'var(--color-success-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', textAlign: 'center', margin: 0 }}>
              El producto fue registrado con el código interno
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.1em', margin: 0 }}>
              {createdCode}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0 }}>
              Podés generar la etiqueta desde la grilla de productos.
            </p>
          </div>
          <ModalFooter>
            <button id="codigo-cerrar" onClick={onSaved} style={btnPrimary}>Aceptar</button>
          </ModalFooter>
        </ModalBox>
      </Backdrop>
    )
  }

  return (
    <Backdrop onClick={onClose}>
      <ModalBox id="producto-modal" wide>
        <ModalHeader
          title={isEdit ? 'Editar producto' : 'Nuevo producto'}
          sub={isEdit ? producto.codigo_interno : 'Completá los datos del producto'}
          onClose={onClose}
        />

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding: '1.25rem 1.5rem', maxHeight: 'calc(100dvh - 12rem)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Imagen ── */}
            <section>
              <SectionLabel>Imagen del producto (RF06.6)</SectionLabel>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 100, height: 100, borderRadius: 'var(--radius-lg)', overflow: 'hidden', flexShrink: 0,
                  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {imagenPreview
                    ? <img src={imagenPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-default)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="img-upload" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    {imagenPreview ? 'Cambiar imagen' : 'Subir imagen'}
                  </label>
                  <input id="img-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  {imagenFile && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.375rem' }}>{imagenFile.name}</p>}
                  {imagenPreview && (
                    <button type="button" onClick={() => { setPreview(null); setFile(null) }}
                      style={{ display: 'block', marginTop: '0.375rem', fontSize: '0.7rem', color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Eliminar imagen
                    </button>
                  )}
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>JPG, PNG o WEBP, máx. 5 MB</p>
                </div>
              </div>
            </section>

            <Divider />

            {/* ── Identificación ── */}
            <section>
              <SectionLabel>Identificación</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <MField ref={firstRef} id="p-denominacion" label="Denominación *" value={form.denominacion}
                    error={errors.denominacion}
                    onChange={v => set('denominacion', v)} onBlur={() => mark('denominacion')} />
                </div>
                <MSelect id="p-categoria" label="Categoría" value={form.id_categoria} onChange={v => set('id_categoria', Number(v))}
                  options={categorias.map(c => ({ value: c.id_categoria, label: c.nombre_categoria }))} />
                <MSelect id="p-marca" label="Marca" value={form.id_marca} onChange={v => set('id_marca', Number(v))}
                  options={marcas.map(m => ({ value: m.id_marca, label: m.nombre_marca }))} />
                <div style={{ gridColumn: '1 / -1' }}>
                  <MField id="p-descripcion" label="Descripción" value={form.descripcion} onChange={v => set('descripcion', v)} textarea />
                </div>
              </div>
              {isEdit && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: '0.04em' }}>
                  Código: {producto.codigo_interno}
                </p>
              )}
              {!isEdit && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                  El código interno (RF09.1) se genera automáticamente al guardar.
                </p>
              )}
            </section>

            <Divider />

            {/* ── Precios ── */}
            <section>
              <SectionLabel>Precios (RF08.1–8.3)</SectionLabel>
              {!esAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-info-muted)', marginBottom: '0.75rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-info)', margin: 0 }}>El precio de costo es visible solo para el perfil Administrador (RF04.2).</p>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: esAdmin ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0.75rem' }}>
                <MField id="p-minorista" label="Precio minorista *" value={form.precio_minorista} type="number"
                  error={errors.precio_minorista} onChange={v => set('precio_minorista', v)} onBlur={() => mark('precio_minorista')}
                  prefix="$" />
                <MField id="p-mayorista" label="Precio mayorista *" value={form.precio_mayorista} type="number"
                  error={errors.precio_mayorista} onChange={v => set('precio_mayorista', v)} onBlur={() => mark('precio_mayorista')}
                  prefix="$" />
                {esAdmin && (
                  <MField id="p-costo" label="Precio de costo" value={form.precio_costo} type="number"
                    onChange={v => set('precio_costo', v)} prefix="$"
                    hint="Solo visible para Administrador" />
                )}
              </div>
            </section>

            <Divider />

            {/* ── Stock mínimo ── */}
            <section>
              <SectionLabel>Control de existencias (RF12.2)</SectionLabel>
              <div style={{ maxWidth: 180 }}>
                <MField id="p-stock-min" label="Stock mínimo" value={form.stock_minimo} type="number"
                  onChange={v => set('stock_minimo', v)}
                  hint="Alerta cuando el stock baje de este valor." />
              </div>
            </section>
          </div>

          <ModalFooter>
            <button id="p-cancelar" type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
            <button id="p-guardar" type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
              {submitting && <SpinIcon />}
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </ModalFooter>
        </form>
      </ModalBox>
    </Backdrop>
  )
}

/* ── Shared Modal Components ──────────────────────────────────────────────── */
export function Backdrop({ children, onClick }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'hsl(220 18% 4% / 0.75)', backdropFilter: 'blur(4px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClick?.() }}
      role="dialog" aria-modal="true"
    >
      {children}
    </div>
  )
}

export function ModalBox({ children, id, wide }) {
  return (
    <div
      id={id}
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%', maxWidth: wide ? 640 : 480,
        background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
        maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}
    >
      {children}
    </div>
  )
}

export function ModalHeader({ title, sub, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)', flexShrink: 0 }}>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-snug)' }}>{title}</p>
        {sub && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>{sub}</p>}
      </div>
      <button onClick={onClose} aria-label="Cerrar" style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}

export function ModalFooter({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)', flexShrink: 0 }}>
      {children}
    </div>
  )
}

export const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: '0.375rem',
  background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
  border: 'none', borderRadius: 'var(--radius-md)', padding: '0.5rem 1.25rem',
  fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', letterSpacing: 'var(--tracking-wide)',
}

export const btnSecondary = {
  background: 'transparent', color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)',
  padding: '0.5rem 1rem', fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
}

export function SectionLabel({ children }) {
  return <p style={{ margin: '0 0 0.625rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--color-text-tertiary)' }}>{children}</p>
}

export function Divider() {
  return <div style={{ borderTop: '1px solid var(--color-border-subtle)', margin: '0 -1.5rem' }} />
}

export function SpinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite' }} aria-hidden="true">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

const MField = forwardRef(function MField({ id, label, type = 'text', value, error, onChange, onBlur, hint, prefix, textarea }, ref) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label htmlFor={id} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', pointerEvents: 'none' }}>{prefix}</span>}
        {textarea ? (
          <textarea ref={ref} id={id} rows={2} value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
            style={{ ...inputStyle(!!error), paddingLeft: prefix ? '1.5rem' : undefined, resize: 'vertical', fontFamily: 'inherit' }} />
        ) : (
          <input ref={ref} id={id} type={type} value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
            aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
            style={{ ...inputStyle(!!error), paddingLeft: prefix ? '1.5rem' : undefined }} />
        )}
      </div>
      {error && <p id={`${id}-err`} role="alert" style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-danger)' }}>{error}</p>}
      {hint && !error && <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{hint}</p>}
    </div>
  )
})

export function MSelect({ id, label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label htmlFor={id} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', padding: '0.5rem 0.75rem', outline: 'none' }}>
        {options.map(o => <option key={o.value} value={o.value} style={{ background: 'var(--color-bg-elevated)' }}>{o.label}</option>)}
      </select>
    </div>
  )
}
