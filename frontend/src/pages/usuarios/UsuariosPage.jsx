/* src/pages/usuarios/UsuariosPage.jsx — RF02.1 a RF02.5 */
import { useCallback, useEffect, useReducer, useState } from 'react'
import { toast } from 'sonner'
import {
  getUsuarios, getPerfiles,
  createUsuario, updateUsuario, deleteUsuario, asignarPerfil,
} from '../../services/usuariosService'
import { useAuth } from '../../contexts/AuthContext'
import UsuarioFormModal from './UsuarioFormModal'

// ── State ─────────────────────────────────────────────────────────────────
const init = { usuarios: [], perfiles: [], loading: true, error: null }
function reducer(s, a) {
  switch (a.type) {
    case 'LOADED':   return { ...s, usuarios: a.usuarios, perfiles: a.perfiles, loading: false }
    case 'ERROR':    return { ...s, error: a.error, loading: false }
    case 'REFRESH':  return { ...s, loading: true, error: null }
    default:         return s
  }
}

const PERFIL_CHIP = {
  Administrador: { bg: 'var(--color-accent-muted)',   text: 'var(--color-accent)'   },
  Vendedor:      { bg: 'var(--color-success-muted)',  text: 'var(--color-success)'  },
  Técnico:       { bg: 'var(--color-warning-muted)',  text: 'var(--color-warning)'  },
}

export default function UsuariosPage() {
  const { tienePermiso }           = useAuth()
  const [state, dispatch]          = useReducer(reducer, init)
  const [modal, setModal]          = useState(null) // null | { mode: 'create'|'edit', usuario? }
  const [deletingId, setDeletingId]= useState(null)
  const [search, setSearch]        = useState('')

  const canWrite = tienePermiso(1, 'escritura')

  const load = useCallback(async () => {
    dispatch({ type: 'REFRESH' })
    try {
      const [usuarios, perfiles] = await Promise.all([getUsuarios(), getPerfiles()])
      dispatch({ type: 'LOADED', usuarios, perfiles })
    } catch (err) {
      dispatch({ type: 'ERROR', error: err?.message ?? 'Error al cargar usuarios.' })
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = state.usuarios.filter(u => {
    const term = search.toLowerCase()
    return (
      u.nombre_usuario.toLowerCase().includes(term) ||
      `${u.persona?.nombre} ${u.persona?.apellido}`.toLowerCase().includes(term) ||
      u.perfil?.nombre_perfil.toLowerCase().includes(term)
    )
  })

  async function handleSave(data, modo, usuarioId) {
    try {
      if (modo === 'create') {
        await createUsuario(data)
        toast.success('Usuario creado correctamente.')
      } else {
        await updateUsuario(usuarioId, data)
        toast.success('Usuario actualizado.')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err?.message ?? 'Error al guardar el usuario.')
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await deleteUsuario(id)
      toast.success('Usuario dado de baja.')
      load()
    } catch (err) {
      toast.error(err?.message ?? 'Error al dar de baja.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handlePerfil(id, id_perfil) {
    try {
      await asignarPerfil(id, id_perfil)
      toast.success('Perfil actualizado.')
      load()
    } catch (err) {
      toast.error(err?.message ?? 'Error al asignar perfil.')
    }
  }

  return (
    <>
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-snug)' }}
          >
            Usuarios
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {state.loading ? 'Cargando…' : `${state.usuarios.length} usuario${state.usuarios.length !== 1 ? 's' : ''} registrado${state.usuarios.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <span
              className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <IconSearch />
            </span>
            <input
              id="usuarios-search"
              type="search"
              placeholder="Buscar usuario…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background:   'var(--color-bg-elevated)',
                border:       '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                color:        'var(--color-text-primary)',
                fontSize:     '0.875rem',
                padding:      '0.5rem 0.875rem 0.5rem 2.25rem',
                outline:      'none',
                width:        '200px',
              }}
            />
          </div>
          {/* New user */}
          {canWrite && (
            <button
              id="btn-nuevo-usuario"
              onClick={() => setModal({ mode: 'create' })}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
              style={{
                background:    'var(--color-accent)',
                color:         'var(--color-text-inverse)',
                letterSpacing: 'var(--tracking-wide)',
                boxShadow:     '0 1px 6px hsl(183 72% 48% / 0.3)',
              }}
            >
              <IconPlus />
              Nuevo usuario
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {state.loading ? (
        <TableSkeleton />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState search={search} canWrite={canWrite} onNew={() => setModal({ mode: 'create' })} />
      ) : (
        <div
          className="rounded-xl border border-default overflow-hidden"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <table
            className="w-full text-sm"
            style={{ borderCollapse: 'collapse' }}
          >
            <thead>
              <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                {['Usuario', 'Nombre completo', 'Perfil', 'Estado', ''].map(col => (
                  <th
                    key={col}
                    className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: 'var(--color-text-tertiary)', letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <UserRow
                  key={u.id_usuario}
                  usuario={u}
                  perfiles={state.perfiles}
                  isLast={i === filtered.length - 1}
                  canWrite={canWrite}
                  deleting={deletingId === u.id_usuario}
                  onEdit={() => setModal({ mode: 'edit', usuario: u })}
                  onDelete={() => handleDelete(u.id_usuario)}
                  onPerfilChange={id_perfil => handlePerfil(u.id_usuario, id_perfil)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <UsuarioFormModal
          mode={modal.mode}
          usuario={modal.usuario}
          perfiles={state.perfiles}
          onSave={(data) => handleSave(data, modal.mode, modal.usuario?.id_usuario)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

/* ── UserRow ─────────────────────────────────────────────────────────────── */
function UserRow({ usuario, perfiles, isLast, canWrite, deleting, onEdit, onDelete, onPerfilChange }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [changingPerfil, setChanging]     = useState(false)

  const perfil      = usuario.perfil?.nombre_perfil ?? '—'
  const chipStyle   = PERFIL_CHIP[perfil] ?? { bg: 'var(--color-bg-overlay)', text: 'var(--color-text-secondary)' }
  const initials    = `${usuario.persona?.nombre?.[0] ?? ''}${usuario.persona?.apellido?.[0] ?? ''}`.toUpperCase()
  const fullName    = `${usuario.persona?.nombre ?? ''} ${usuario.persona?.apellido ?? ''}`.trim()

  return (
    <tr
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--color-border-subtle)',
        background:   'var(--color-bg-surface)',
        transition:   `background var(--duration-fast)`,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-surface)'}
    >
      {/* Username */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full font-bold shrink-0 tabular-nums"
            style={{ width: 32, height: 32, background: chipStyle.bg, color: chipStyle.text, fontSize: '0.75rem' }}
          >
            {initials}
          </div>
          <div>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              @{usuario.nombre_usuario}
            </p>
          </div>
        </div>
      </td>

      {/* Full name */}
      <td className="px-4 py-3.5" style={{ color: 'var(--color-text-secondary)' }}>
        {fullName || '—'}
      </td>

      {/* Perfil — inline select for admin (RF02.4) */}
      <td className="px-4 py-3.5">
        {canWrite ? (
          <select
            id={`select-perfil-${usuario.id_usuario}`}
            value={usuario.id_perfil}
            disabled={changingPerfil}
            onChange={async e => {
              setChanging(true)
              await onPerfilChange(Number(e.target.value))
              setChanging(false)
            }}
            style={{
              background:   chipStyle.bg,
              color:        chipStyle.text,
              border:       'none',
              borderRadius: 'var(--radius-pill)',
              fontSize:     '0.7rem',
              fontWeight:   700,
              letterSpacing:'var(--tracking-widest)',
              padding:      '0.2rem 0.5rem',
              cursor:       'pointer',
              outline:      'none',
              textTransform:'uppercase',
            }}
            aria-label={`Cambiar perfil de @${usuario.nombre_usuario}`}
          >
            {perfiles.map(p => (
              <option key={p.id_perfil} value={p.id_perfil} style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}>
                {p.nombre_perfil}
              </option>
            ))}
          </select>
        ) : (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-bold"
            style={{ background: chipStyle.bg, color: chipStyle.text, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', fontSize: '0.65rem' }}
          >
            {perfil}
          </span>
        )}
      </td>

      {/* Estado */}
      <td className="px-4 py-3.5">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium"
          style={{ color: usuario.activo ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: usuario.activo ? 'var(--color-success)' : 'var(--color-border-default)' }}
          />
          {usuario.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-right">
        {canWrite && (
          <div className="flex items-center justify-end gap-1.5">
            {confirmDelete ? (
              <>
                <span className="text-xs mr-1" style={{ color: 'var(--color-danger)' }}>
                  ¿Dar de baja?
                </span>
                <ActionButton
                  id={`confirm-delete-${usuario.id_usuario}`}
                  label="Confirmar baja"
                  danger
                  loading={deleting}
                  onClick={onDelete}
                  icon={<IconCheck />}
                />
                <ActionButton
                  id={`cancel-delete-${usuario.id_usuario}`}
                  label="Cancelar"
                  onClick={() => setConfirmDelete(false)}
                  icon={<IconX />}
                />
              </>
            ) : (
              <>
                <ActionButton
                  id={`edit-usuario-${usuario.id_usuario}`}
                  label="Editar usuario"
                  onClick={onEdit}
                  icon={<IconEdit />}
                />
                <ActionButton
                  id={`delete-usuario-${usuario.id_usuario}`}
                  label="Dar de baja usuario"
                  danger
                  onClick={() => setConfirmDelete(true)}
                  icon={<IconTrash />}
                />
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}

/* ── ActionButton ─────────────────────────────────────────────────────────── */
function ActionButton({ id, label, icon, onClick, danger = false, loading = false }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      id={id}
      aria-label={label}
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center justify-center w-7 h-7 rounded-md transition-[background,color] duration-[var(--duration-fast)]"
      style={{
        background: hovered ? (danger ? 'var(--color-danger-muted)' : 'var(--color-bg-overlay)') : 'transparent',
        color:      danger   ? 'var(--color-danger)'                 : 'var(--color-text-tertiary)',
        border:     'none',
        cursor:     loading ? 'wait' : 'pointer',
      }}
    >
      {loading
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.7s linear infinite' }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        : icon
      }
    </button>
  )
}

/* ── States ───────────────────────────────────────────────────────────────── */
function TableSkeleton() {
  return (
    <div className="rounded-xl border border-default overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5"
          style={{
            borderBottom: i < 3 ? '1px solid var(--color-border-subtle)' : 'none',
            background:   'var(--color-bg-surface)',
          }}
        >
          <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-bg-elevated)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded" style={{ background: 'var(--color-bg-elevated)' }} />
            <div className="h-2.5 w-48 rounded" style={{ background: 'var(--color-bg-elevated)' }} />
          </div>
          <div className="h-5 w-20 rounded-full" style={{ background: 'var(--color-bg-elevated)' }} />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ search, canWrite, onNew }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16 rounded-xl border border-dashed"
      style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-tertiary)' }}
    >
      <IconUsersOff />
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {search ? `Sin resultados para "${search}"` : 'No hay usuarios activos'}
      </p>
      {!search && canWrite && (
        <button
          id="empty-nuevo-usuario"
          onClick={onNew}
          className="mt-1 text-sm font-semibold"
          style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          + Crear el primer usuario
        </button>
      )}
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12" style={{ color: 'var(--color-danger)' }}>
      <p className="text-sm">{message}</p>
      <button onClick={onRetry} className="text-sm font-semibold" style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
        Reintentar
      </button>
    </div>
  )
}

/* ── Icons ────────────────────────────────────────────────────────────────── */
function IconSearch()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IconPlus()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconEdit()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function IconTrash()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> }
function IconCheck()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function IconX()        { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function IconUsersOff() { return <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="17"/><line x1="23" y1="11" x2="17" y2="17"/></svg> }
