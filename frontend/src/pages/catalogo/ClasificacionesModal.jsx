/* src/pages/catalogo/ClasificacionesModal.jsx — RF07.1 Categorías  RF07.2 Marcas */
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  getCategorias, createCategoria, updateCategoria, deleteCategoria,
  getMarcas,     createMarca,     updateMarca,     deleteMarca,
} from '../../services/catalogoService'
import { Backdrop, ModalBox, ModalHeader, ModalFooter, btnPrimary, btnSecondary, SpinIcon } from './ProductoFormModal'

export default function ClasificacionesModal({ onClose, onSaved }) {
  const [tab, setTab]             = useState('categorias') // 'categorias' | 'marcas'
  const [categorias, setCategorias] = useState([])
  const [marcas, setMarcas]         = useState([])
  const [loading, setLoading]       = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [cats, mars] = await Promise.all([getCategorias(), getMarcas()])
      setCategorias(cats)
      setMarcas(mars)
    } catch { toast.error('Error al cargar clasificaciones.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const items     = tab === 'categorias' ? categorias : marcas
  const createFn  = tab === 'categorias' ? createCategoria  : createMarca
  const updateFn  = tab === 'categorias' ? updateCategoria  : updateMarca
  const deleteFn  = tab === 'categorias' ? deleteCategoria  : deleteMarca
  const idKey     = tab === 'categorias' ? 'id_categoria'  : 'id_marca'
  const nameKey   = tab === 'categorias' ? 'nombre_categoria' : 'nombre_marca'

  async function handleCreate(nombre) {
    try {
      await createFn({ [nameKey]: nombre })
      toast.success(`${tab === 'categorias' ? 'Categoría' : 'Marca'} creada.`)
      load()
      onSaved?.()
    } catch (err) { toast.error(err?.message ?? 'Error al crear.') }
  }

  async function handleUpdate(id, nombre) {
    try {
      await updateFn(id, { [nameKey]: nombre })
      toast.success('Actualizado correctamente.')
      load()
      onSaved?.()
    } catch (err) { toast.error(err?.message ?? 'Error al actualizar.') }
  }

  async function handleDelete(id) {
    try {
      await deleteFn(id)
      toast.success('Dado de baja.')
      load()
      onSaved?.()
    } catch (err) { toast.error(err?.message ?? 'Error al eliminar.') }
  }

  return (
    <Backdrop onClick={onClose}>
      <ModalBox id="clasificaciones-modal">
        <ModalHeader title="Categorías y marcas" sub="RF07.1 / RF07.2" onClose={onClose} />

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-subtle)', padding: '0 1rem', background: 'var(--color-bg-elevated)' }}>
          {['categorias', 'marcas'].map(t => (
            <button
              key={t}
              id={`tab-${t}`}
              onClick={() => setTab(t)}
              style={{
                padding: '0.625rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: tab === t ? 600 : 400,
                color: tab === t ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                borderBottom: `2px solid ${tab === t ? 'var(--color-accent)' : 'transparent'}`,
                transition: 'color var(--duration-fast), border-color var(--duration-fast)',
                marginBottom: -1,
              }}
            >
              {t === 'categorias' ? 'Categorías' : 'Marcas'}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 300, maxHeight: '50vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <SpinIcon />
            </div>
          ) : (
            <>
              {items.map(item => (
                <ClasifRow
                  key={item[idKey]}
                  id={`${tab}-${item[idKey]}`}
                  name={item[nameKey]}
                  onUpdate={nombre => handleUpdate(item[idKey], nombre)}
                  onDelete={() => handleDelete(item[idKey])}
                />
              ))}
              {items.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', padding: '1rem' }}>
                  No hay {tab} registradas. Creá la primera abajo.
                </p>
              )}
            </>
          )}
        </div>

        <ModalFooter>
          <AddNewRow nameKey={nameKey} onCreate={handleCreate} tab={tab} />
        </ModalFooter>
      </ModalBox>
    </Backdrop>
  )
}

/* ── Row with inline edit ─────────────────────────────────────────────────── */
function ClasifRow({ id, name, onUpdate, onDelete }) {
  const [editing, setEditing]  = useState(false)
  const [val, setVal]          = useState(name)
  const [confirm, setConfirm]  = useState(false)
  const [saving, setSaving]    = useState(false)
  const inputRef               = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  async function save() {
    if (!val.trim()) return
    setSaving(true)
    await onUpdate(val.trim())
    setSaving(false)
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)' }}>
      {editing ? (
        <>
          <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            style={{ flex: 1, background: 'var(--color-bg-overlay)', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', padding: '0.3rem 0.625rem', outline: 'none' }} />
          <IconBtn id={`save-${id}`} onClick={save} aria-label="Guardar" loading={saving}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </IconBtn>
          <IconBtn id={`cancel-${id}`} onClick={() => setEditing(false)} aria-label="Cancelar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </IconBtn>
        </>
      ) : confirm ? (
        <>
          <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>¿Dar de baja "{name}"?</span>
          <IconBtn id={`confirm-del-${id}`} onClick={onDelete} aria-label="Confirmar" danger>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </IconBtn>
          <IconBtn id={`cancel-del-${id}`} onClick={() => setConfirm(false)} aria-label="Cancelar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </IconBtn>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{name}</span>
          <IconBtn id={`edit-${id}`} onClick={() => setEditing(true)} aria-label="Editar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </IconBtn>
          <IconBtn id={`del-${id}`} onClick={() => setConfirm(true)} aria-label="Eliminar" danger>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </IconBtn>
        </>
      )}
    </div>
  )
}

function AddNewRow({ nameKey, onCreate, tab }) {
  const [val, setVal]       = useState('')
  const [busy, setBusy]     = useState(false)
  const inputRef            = useRef(null)

  async function submit() {
    if (!val.trim()) return
    setBusy(true)
    await onCreate(val.trim())
    setVal('')
    setBusy(false)
    inputRef.current?.focus()
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
      <input
        ref={inputRef}
        id={`new-${tab}-input`}
        placeholder={`Nueva ${tab === 'categorias' ? 'categoría' : 'marca'}…`}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit() }}
        style={{ flex: 1, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', padding: '0.5rem 0.75rem', outline: 'none' }}
      />
      <button id={`btn-new-${tab}`} onClick={submit} disabled={busy || !val.trim()} style={{ ...btnPrimary, opacity: !val.trim() ? 0.5 : 1 }}>
        {busy ? <SpinIcon /> : '+ Agregar'}
      </button>
    </div>
  )
}

function IconBtn({ id, children, onClick, 'aria-label': label, danger, loading }) {
  const [h, setH] = useState(false)
  return (
    <button id={id} aria-label={label} onClick={onClick} disabled={loading}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', background: h ? (danger ? 'var(--color-danger-muted)' : 'var(--color-bg-overlay)') : 'transparent', border: 'none', cursor: 'pointer', color: danger ? 'var(--color-danger)' : 'var(--color-text-tertiary)', transition: 'background var(--duration-fast)' }}>
      {loading ? <SpinIcon /> : children}
    </button>
  )
}
