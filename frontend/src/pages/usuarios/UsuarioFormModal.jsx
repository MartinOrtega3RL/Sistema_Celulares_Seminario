/* src/pages/usuarios/UsuarioFormModal.jsx — Modal de alta y edición (RF02.1, RF02.2) */
import { useEffect, useRef, useState } from 'react'

const TIPO_DOC_OPTIONS = ['DNI', 'CUIT', 'CUIL', 'Pasaporte']

export default function UsuarioFormModal({ mode, usuario, perfiles, onSave, onClose }) {
  const isEdit = mode === 'edit'
  const firstRef = useRef(null)

  const [form, setForm]         = useState({
    nombre:             usuario?.persona?.nombre             ?? '',
    apellido:           usuario?.persona?.apellido           ?? '',
    nombre_usuario:     usuario?.nombre_usuario              ?? '',
    tipo_documento:     usuario?.persona?.tipo_documento     ?? 'DNI',
    numero_documento:   usuario?.persona?.numero_documento   ?? '',
    correo_electronico: usuario?.persona?.correo_electronico ?? '',
    telefono_whatsapp:  usuario?.persona?.telefono_whatsapp  ?? '',
    id_perfil:          usuario?.id_perfil                   ?? perfiles[0]?.id_perfil ?? 1,
  })
  const [touched, setTouched]   = useState({})
  const [submitting, setSubmit] = useState(false)

  // Trap focus on mount; restore on unmount
  useEffect(() => {
    firstRef.current?.focus()
    const prev = document.activeElement

    function trapFocus(e) {
      const focusable = Array.from(
        document.getElementById('usuario-modal')?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.key === 'Tab') {
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus() } }
        else            { if (document.activeElement === last)  { e.preventDefault(); first.focus() } }
      }
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', trapFocus)
    return () => { document.removeEventListener('keydown', trapFocus); prev?.focus() }
  }, [onClose])

  function mark(f) { setTouched(t => ({ ...t, [f]: true })) }
  function set(f, v) { setForm(s => ({ ...s, [f]: v })) }

  const errors = {
    nombre:         touched.nombre         && !form.nombre.trim()         ? 'Requerido.' : null,
    apellido:       touched.apellido       && !form.apellido.trim()       ? 'Requerido.' : null,
    nombre_usuario: touched.nombre_usuario && !form.nombre_usuario.trim() ? 'Requerido.' : null,
  }

  const isValid = form.nombre.trim() && form.apellido.trim() && form.nombre_usuario.trim()

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ nombre: true, apellido: true, nombre_usuario: true })
    if (!isValid) return
    setSubmit(true)
    try {
      await onSave({ ...form, id_perfil: Number(form.id_perfil) })
    } finally {
      setSubmit(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'hsl(220 18% 4% / 0.75)', backdropFilter: 'blur(4px)', zIndex: 'var(--z-modal)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        id="usuario-modal"
        className="w-full max-w-lg rounded-2xl border overflow-hidden"
        style={{
          background:  'var(--color-bg-surface)',
          border:      '1px solid var(--color-border-default)',
          boxShadow:   'var(--shadow-lg)',
          maxHeight:   'calc(100dvh - 2rem)',
          overflowY:   'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-elevated)' }}
        >
          <div>
            <h2
              id="modal-title"
              className="text-base font-bold"
              style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-snug)' }}
            >
              {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              {isEdit ? `@${usuario?.nombre_usuario}` : 'Completá los datos del nuevo usuario'}
            </p>
          </div>
          <button
            id="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center w-8 h-8 rounded-md transition-[background] duration-[var(--duration-fast)]"
            style={{ color: 'var(--color-text-tertiary)', background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-5">

            {/* Sección: Persona */}
            <section>
              <p
                className="text-xs font-semibold mb-3 uppercase"
                style={{ color: 'var(--color-text-tertiary)', letterSpacing: 'var(--tracking-widest)' }}
              >
                Datos personales
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ModalField
                  ref={firstRef}
                  id="m-nombre"
                  label="Nombre *"
                  value={form.nombre}
                  error={errors.nombre}
                  onChange={v => set('nombre', v)}
                  onBlur={() => mark('nombre')}
                />
                <ModalField
                  id="m-apellido"
                  label="Apellido *"
                  value={form.apellido}
                  error={errors.apellido}
                  onChange={v => set('apellido', v)}
                  onBlur={() => mark('apellido')}
                />
                <ModalSelect
                  id="m-tipo-doc"
                  label="Tipo de documento"
                  value={form.tipo_documento}
                  options={TIPO_DOC_OPTIONS.map(t => ({ value: t, label: t }))}
                  onChange={v => set('tipo_documento', v)}
                />
                <ModalField
                  id="m-num-doc"
                  label="Número"
                  value={form.numero_documento}
                  onChange={v => set('numero_documento', v)}
                />
                <ModalField
                  id="m-correo"
                  label="Correo"
                  type="email"
                  value={form.correo_electronico}
                  onChange={v => set('correo_electronico', v)}
                />
                <ModalField
                  id="m-whatsapp"
                  label="WhatsApp"
                  type="tel"
                  value={form.telefono_whatsapp}
                  onChange={v => set('telefono_whatsapp', v)}
                  placeholder="5493815…"
                />
              </div>
            </section>

            <div className="border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />

            {/* Sección: Acceso */}
            <section>
              <p
                className="text-xs font-semibold mb-3 uppercase"
                style={{ color: 'var(--color-text-tertiary)', letterSpacing: 'var(--tracking-widest)' }}
              >
                Credenciales y perfil
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ModalField
                  id="m-nombre-usuario"
                  label="Nombre de usuario *"
                  value={form.nombre_usuario}
                  error={errors.nombre_usuario}
                  onChange={v => set('nombre_usuario', v.toLowerCase().replace(/\s/g, '.'))}
                  onBlur={() => mark('nombre_usuario')}
                  autoComplete="username"
                />
                <ModalSelect
                  id="m-perfil"
                  label="Perfil (RF02.4)"
                  value={form.id_perfil}
                  options={perfiles.map(p => ({ value: p.id_perfil, label: p.nombre_perfil }))}
                  onChange={v => set('id_perfil', Number(v))}
                />
              </div>
              {!isEdit && (
                <p className="mt-2.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  En modo demostración no se define contraseña; el backend generará el hash bcrypt al crear el usuario.
                </p>
              )}
            </section>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-elevated)' }}
          >
            <button
              id="modal-cancelar"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium border transition-[background] duration-[var(--duration-fast)]"
              style={{
                background: 'transparent',
                color:      'var(--color-text-secondary)',
                border:     '1px solid var(--color-border-default)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Cancelar
            </button>
            <button
              id="modal-guardar"
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-[opacity] duration-[var(--duration-fast)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:    'var(--color-accent)',
                color:         'var(--color-text-inverse)',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              {submitting && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ animation: 'spin 0.7s linear infinite' }} aria-hidden="true">
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Field components ─────────────────────────────────────────────────────── */
import { forwardRef } from 'react'

const ModalField = forwardRef(function ModalField(
  { id, label, type = 'text', value, error, onChange, onBlur, placeholder, autoComplete }, ref
) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        style={{
          width:         '100%',
          background:    'var(--color-bg-elevated)',
          border:        `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-default)'}`,
          borderRadius:  'var(--radius-md)',
          color:         'var(--color-text-primary)',
          fontSize:      '0.875rem',
          padding:       '0.5rem 0.75rem',
          outline:       'none',
          transition:    `border-color var(--duration-fast)`,
        }}
      />
      {error && <p id={`${id}-err`} role="alert" className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  )
})

function ModalSelect({ id, label, value, options, onChange }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width:         '100%',
          background:    'var(--color-bg-elevated)',
          border:        '1px solid var(--color-border-default)',
          borderRadius:  'var(--radius-md)',
          color:         'var(--color-text-primary)',
          fontSize:      '0.875rem',
          padding:       '0.5rem 0.75rem',
          outline:       'none',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: 'var(--color-bg-elevated)' }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
