/* src/components/layout/Topbar.jsx — RF01.2 (cierre de sesión) */
import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'

const PERFIL_STYLES = {
  Administrador: { bg: 'var(--color-accent-muted)',   text: 'var(--color-accent)'   },
  Vendedor:      { bg: 'var(--color-success-muted)',  text: 'var(--color-success)'  },
  Técnico:       { bg: 'var(--color-warning-muted)',  text: 'var(--color-warning)'  },
}

export default function Topbar({ sidebarCollapsed, title }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen]   = useState(false)
  const [busy, setBusy]   = useState(false)
  const menuRef           = useRef(null)
  const triggerRef        = useRef(null)

  const perfil     = usuario?.perfil?.nombre_perfil ?? ''
  const perfilStyle = PERFIL_STYLES[perfil] ?? { bg: 'var(--color-bg-overlay)', text: 'var(--color-text-secondary)' }
  const initials   = usuario
    ? `${usuario.persona?.nombre?.[0] ?? ''}${usuario.persona?.apellido?.[0] ?? ''}`.toUpperCase()
    : '?'
  const fullName   = usuario ? `${usuario.persona?.nombre} ${usuario.persona?.apellido}` : ''

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (!menuRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e) { if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus() } }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  async function handleLogout() {
    setBusy(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      toast.error('Error al cerrar sesión.')
      setBusy(false)
    }
  }

  const sidebarW = sidebarCollapsed ? 64 : 256

  return (
    <header
      id="app-topbar"
      style={{
        position:   'fixed',
        top:        0,
        right:      0,
        left:       `${sidebarW}px`,
        height:     'var(--spacing-topbar)',
        zIndex:     'var(--z-topbar)',
        transition: `left var(--duration-slow) var(--ease-out)`,
        background: 'hsl(220 16% 12% / 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
      className="flex items-center justify-between px-5 gap-4"
    >
      {/* Page title slot */}
      <h2
        className="text-sm font-semibold truncate"
        style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-snug)' }}
      >
        {title ?? 'El Gringo Celulares'}
      </h2>

      {/* Right cluster */}
      <div className="flex items-center gap-2.5 shrink-0 relative">
        {/* Perfil badge (hidden on very small screens) */}
        {perfil && (
          <span
            className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-semibold"
            style={{
              background:    perfilStyle.bg,
              color:         perfilStyle.text,
              letterSpacing: 'var(--tracking-widest)',
              fontSize:      '0.65rem',
            }}
          >
            {perfil.toUpperCase()}
          </span>
        )}

        {/* Avatar trigger */}
        <button
          id="topbar-user-menu"
          ref={triggerRef}
          onClick={() => setOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Menú de cuenta"
          className="flex items-center gap-2 px-2 py-1 rounded-md transition-[background] duration-[var(--duration-fast)]"
          style={{
            background: open ? 'var(--color-bg-elevated)' : 'transparent',
            color:      'var(--color-text-primary)',
            border:     '1px solid transparent',
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--color-bg-elevated)' }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
        >
          <Avatar initials={initials} perfilStyle={perfilStyle} />
          <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
            {fullName}
          </span>
          <ChevronDown open={open} />
        </button>

        {/* Dropdown */}
        {open && (
          <div
            ref={menuRef}
            role="menu"
            id="user-dropdown"
            className="absolute right-0 top-[calc(100%+6px)] w-60 rounded-xl border py-1.5"
            style={{
              background:  'var(--color-bg-elevated)',
              border:      '1px solid var(--color-border-default)',
              boxShadow:   'var(--shadow-lg)',
              zIndex:      'var(--z-dropdown)',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2.5">
                <Avatar initials={initials} perfilStyle={perfilStyle} size={32} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {fullName}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                    @{usuario?.nombre_usuario}
                  </p>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="py-1">
              <MenuItem
                id="menu-cambiar-password"
                icon={<IconLock />}
                label="Cambiar contraseña"
                onClick={() => { setOpen(false); navigate('/perfil/cambiar-password') }}
              />
            </div>

            <div className="border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />

            <div className="py-1">
              <MenuItem
                id="menu-logout"
                icon={busy ? <SpinIcon /> : <IconLogOut />}
                label={busy ? 'Cerrando sesión…' : 'Cerrar sesión'}
                danger
                disabled={busy}
                onClick={handleLogout}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Avatar({ initials, perfilStyle, size = 28 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold shrink-0"
      style={{
        width:      size,
        height:     size,
        background: perfilStyle.bg,
        color:      perfilStyle.text,
        fontSize:   size * 0.38,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

function MenuItem({ id, icon, label, onClick, danger = false, disabled = false }) {
  const [hovered, setHovered] = useState(false)
  const color    = danger ? 'var(--color-danger)'        : 'var(--color-text-secondary)'
  const hoverBg  = danger ? 'var(--color-danger-muted)'  : 'var(--color-bg-overlay)'
  const hoverColor = danger ? 'var(--color-danger)'      : 'var(--color-text-primary)'

  return (
    <button
      role="menuitem"
      id={id}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-[background,color] duration-[var(--duration-fast)] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: hovered && !disabled ? hoverBg  : 'transparent',
        color:      hovered && !disabled ? hoverColor : color,
        textAlign:  'left',
      }}
    >
      <span style={{ color: danger ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}>
        {icon}
      </span>
      {label}
    </button>
  )
}

function ChevronDown({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{
        color:     'var(--color-text-tertiary)',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: `transform var(--duration-fast) var(--ease-out)`,
      }}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
function IconLogOut() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function SpinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite' }} aria-hidden="true">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
