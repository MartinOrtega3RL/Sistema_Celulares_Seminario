/* src/pages/clientes/ClienteFormModal.jsx
 * RF13.1 Alta  RF13.2 Edición  RF13.3 Baja  RF13.6 Enlace WhatsApp wa.me
 * Estilizado en el sistema de diseño dark-first de Impeccable
 */
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createCliente, updateCliente } from '../../services/clientesService'
import { Backdrop, ModalBox, ModalHeader, ModalFooter, btnPrimary, btnSecondary } from '../catalogo/ProductoFormModal'

const fieldStyle = (err) => ({
  width: '100%', background: 'var(--color-bg-elevated)',
  border: `1px solid ${err ? 'var(--color-danger)' : 'var(--color-border-default)'}`,
  borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)', padding: '0.5rem 0.75rem', outline: 'none',
})

const labelStyle = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem'
}

export default function ClienteFormModal({ cliente, tiposCliente = [], onClose, onSaved }) {
  const isEdit = !!cliente
  const firstRef = useRef(null)

  const [form, setForm] = useState({
    nombre:             cliente?.persona?.nombre             ?? '',
    apellido:           cliente?.persona?.apellido           ?? '',
    tipo_documento:     cliente?.persona?.tipo_documento     ?? 'DNI',
    numero_documento:   cliente?.persona?.numero_documento   ?? '',
    telefono_whatsapp:  cliente?.persona?.telefono_whatsapp  ?? '',
    correo_electronico: cliente?.persona?.correo_electronico ?? '',
    domicilio:          cliente?.persona?.domicilio          ?? '',
    id_tipo_cliente:    cliente?.id_tipo_cliente             ?? 1, // 1: Minorista, 2: Mayorista
  })

  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  function mark(f) { setTouched(t => ({ ...t, [f]: true })) }
  function set(f, v) { setForm(s => ({ ...s, [f]: v })) }

  const errors = {
    nombre:   touched.nombre   && !form.nombre.trim()   ? 'Requerido.' : null,
    apellido: touched.apellido && !form.apellido.trim() ? 'Requerido.' : null,
  }

  const isValid = form.nombre.trim() && form.apellido.trim()

  // Genera vista previa del enlace wa.me para WhatsApp (RF13.6)
  const cleanPhone = form.telefono_whatsapp.replace(/\D/g, '')
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`}` : null

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ nombre: true, apellido: true })
    if (!isValid) return

    setSubmitting(true)
    try {
      if (isEdit) {
        await updateCliente(cliente.id_cliente, form)
        toast.success(`Cliente "${form.nombre} ${form.apellido}" actualizado.`)
      } else {
        await createCliente(form)
        toast.success(`Cliente "${form.nombre} ${form.apellido}" registrado.`)
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'Error al guardar el cliente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Backdrop onClick={onClose}>
      <ModalBox id="cliente-modal" wide>
        <ModalHeader
          title={isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
          sub={isEdit ? `ID #${cliente.id_cliente}` : 'RF13.1 — Completá los datos del cliente'}
          onClose={onClose}
        />

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 'calc(100dvh - 12rem)', overflowY: 'auto' }}>
            
            {/* Nombre y Apellido */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>
                  Nombre <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  ref={firstRef}
                  type="text"
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  onBlur={() => mark('nombre')}
                  style={fieldStyle(errors.nombre)}
                />
                {errors.nombre && <p style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: 2 }}>{errors.nombre}</p>}
              </div>

              <div>
                <label style={labelStyle}>
                  Apellido <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.apellido}
                  onChange={e => set('apellido', e.target.value)}
                  onBlur={() => mark('apellido')}
                  style={fieldStyle(errors.apellido)}
                />
                {errors.apellido && <p style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: 2 }}>{errors.apellido}</p>}
              </div>
            </div>

            {/* Documento */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Tipo Doc.</label>
                <select
                  value={form.tipo_documento}
                  onChange={e => set('tipo_documento', e.target.value)}
                  style={{ ...fieldStyle(false), background: 'var(--color-bg-elevated)' }}
                >
                  <option value="DNI" style={{ background: 'var(--color-bg-surface)' }}>DNI</option>
                  <option value="CUIT" style={{ background: 'var(--color-bg-surface)' }}>CUIT</option>
                  <option value="CUIL" style={{ background: 'var(--color-bg-surface)' }}>CUIL</option>
                  <option value="Pasaporte" style={{ background: 'var(--color-bg-surface)' }}>Pasaporte</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Número de Documento</label>
                <input
                  type="text"
                  value={form.numero_documento}
                  onChange={e => set('numero_documento', e.target.value)}
                  placeholder="Ej. 38492019"
                  style={fieldStyle(false)}
                />
              </div>
            </div>

            {/* Tipo de Cliente (Minorista / Mayorista) */}
            <div>
              <label style={labelStyle}>Categoría Comercial (Lista de Precios)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.25rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => set('id_tipo_cliente', 1)}
                  style={{
                    padding: '0.5rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer',
                    background: form.id_tipo_cliente === 1 ? 'var(--color-bg-overlay)' : 'transparent',
                    color: form.id_tipo_cliente === 1 ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    border: form.id_tipo_cliente === 1 ? '1px solid var(--color-border-default)' : '1px solid transparent',
                  }}
                >
                  🛒 Cliente Minorista (Precio Normal)
                </button>

                <button
                  type="button"
                  onClick={() => set('id_tipo_cliente', 2)}
                  style={{
                    padding: '0.5rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer',
                    background: form.id_tipo_cliente === 2 ? 'var(--color-success-muted)' : 'transparent',
                    color: form.id_tipo_cliente === 2 ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    border: form.id_tipo_cliente === 2 ? '1px solid var(--color-success)' : '1px solid transparent',
                  }}
                >
                  🏬 Cliente Mayorista (Precio Especial)
                </button>
              </div>
            </div>

            {/* WhatsApp & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Teléfono WhatsApp (RF13.6)</label>
                <input
                  type="text"
                  value={form.telefono_whatsapp}
                  onChange={e => set('telefono_whatsapp', e.target.value)}
                  placeholder="Ej. 3764123456"
                  style={fieldStyle(false)}
                />
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                  >
                    <span>💬 Abrir chat wa.me ({cleanPhone})</span>
                  </a>
                )}
              </div>

              <div>
                <label style={labelStyle}>Correo Electrónico</label>
                <input
                  type="email"
                  value={form.correo_electronico}
                  onChange={e => set('correo_electronico', e.target.value)}
                  placeholder="ejemplo@correo.com"
                  style={fieldStyle(false)}
                />
              </div>
            </div>

            {/* Domicilio */}
            <div>
              <label style={labelStyle}>Domicilio / Dirección</label>
              <input
                type="text"
                value={form.domicilio}
                onChange={e => set('domicilio', e.target.value)}
                placeholder="Av. Corrientes 1234, Posadas"
                style={fieldStyle(false)}
              />
            </div>

          </div>

          <ModalFooter>
            <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
            <button type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Registrar Cliente'}
            </button>
          </ModalFooter>
        </form>
      </ModalBox>
    </Backdrop>
  )
}
