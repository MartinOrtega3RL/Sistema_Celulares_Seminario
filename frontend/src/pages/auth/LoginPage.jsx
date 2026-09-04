/* src/pages/auth/LoginPage.jsx — RF01.1
 * Operate mode · dark-first · Inter · design tokens
 */
import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const { login, isAuth, isLoading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname ?? '/dashboard'

  const [form, setForm]         = useState({ nombre_usuario: '', contrasena: '' })
  const [submitting, setSubmit] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [touched, setTouched]   = useState({})

  // Ya autenticado → redirigir
  if (!isLoading && isAuth) return <Navigate to={from} replace />

  function mark(field) { setTouched(t => ({ ...t, [field]: true })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ nombre_usuario: true, contrasena: true })
    if (!form.nombre_usuario.trim()) return
    setSubmit(true)
    try {
      await login(form)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err?.message ?? 'Usuario o contraseña incorrectos.')
    } finally {
      setSubmit(false)
    }
  }

  const errors = {
    nombre_usuario: touched.nombre_usuario && !form.nombre_usuario.trim()
      ? 'Ingresá tu nombre de usuario.'
      : null,
  }

  return (
    <div
      className="flex min-h-dvh"
      style={{ background: 'var(--color-bg-base)' }}
    >
      {/* ── Left panel – brand ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: 'var(--color-bg-surface)', borderRight: '1px solid var(--color-border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <BrandMark size={36} />
          <div>
            <p
              className="text-base font-bold"
              style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-snug)' }}
            >
              El Gringo Celulares
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Sistema de gestión comercial
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <Feature
            icon={<IconShield />}
            title="Acceso por perfil"
            body="Administrador, Vendedor y Técnico con permisos independientes por módulo."
          />
          <Feature
            icon={<IconZap />}
            title="Ventas en menos de 3 s"
            body="Terminal POS con búsqueda predictiva y confirmación atómica de stock."
          />
          <Feature
            icon={<IconBarcode />}
            title="Códigos internos propios"
            body="Generación y etiquetado automático sin depender de lectores ópticos."
          />
        </div>

        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Iteración 1 · Modo demostración
        </p>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <BrandMark size={32} />
            <p
              className="text-sm font-bold"
              style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-snug)' }}
            >
              El Gringo Celulares
            </p>
          </div>

          <header className="mb-8">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-snug)' }}
            >
              Bienvenido
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Ingresá tus credenciales para continuar.
            </p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Usuario */}
            <Field
              id="login-usuario"
              label="Usuario"
              type="text"
              autoComplete="username"
              value={form.nombre_usuario}
              error={errors.nombre_usuario}
              placeholder="tu.usuario"
              onChange={v => setForm(f => ({ ...f, nombre_usuario: v }))}
              onBlur={() => mark('nombre_usuario')}
            />

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-contrasena"
                className="block text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-contrasena"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.contrasena}
                  onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))}
                  onBlur={() => mark('contrasena')}
                  placeholder="••••••••"
                  className="w-full pr-10"
                  style={inputStyle()}
                />
                <button
                  type="button"
                  id="login-toggle-pass"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-[opacity,box-shadow] duration-[var(--duration-fast)] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{
                background:    'var(--color-accent)',
                color:         'var(--color-text-inverse)',
                letterSpacing: 'var(--tracking-wide)',
                boxShadow:     submitting ? 'none' : '0 1px 6px hsl(183 72% 48% / 0.35)',
              }}
            >
              {submitting && <SpinIcon />}
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          {/* Demo hint */}
          <div
            className="mt-8 p-3.5 rounded-md text-xs space-y-1"
            style={{
              background:   'var(--color-bg-elevated)',
              border:       '1px solid var(--color-border-subtle)',
              color:        'var(--color-text-tertiary)',
              lineHeight:   '1.6',
            }}
          >
            <p className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Usuarios de demostración
            </p>
            <p><code className="text-[var(--color-accent)]">martin.admin</code> · Administrador</p>
            <p><code className="text-[var(--color-success)]">laura.vendedora</code> · Vendedor</p>
            <p><code className="text-[var(--color-warning)]">rodrigo.tecnico</code> · Técnico</p>
            <p className="mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Contraseña: cualquier valor
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function BrandMark({ size = 32 }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg shrink-0"
      style={{ width: size, height: size, background: 'var(--color-accent)' }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="white">
        <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01L6.62 10.79z" />
      </svg>
    </div>
  )
}

function Feature({ icon, title, body }) {
  return (
    <div className="flex gap-3.5">
      <div
        className="flex items-center justify-center w-9 h-9 rounded-md shrink-0 mt-0.5"
        style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)', lineHeight: '1.6' }}>
          {body}
        </p>
      </div>
    </div>
  )
}

export function Field({ id, label, type = 'text', value, error, onChange, onBlur, placeholder, autoComplete, disabled }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        style={inputStyle(!!error)}
        className="w-full"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export function inputStyle(isError = false) {
  return {
    background:    'var(--color-bg-elevated)',
    border:        `1px solid ${isError ? 'var(--color-danger)' : 'var(--color-border-default)'}`,
    borderRadius:  'var(--radius-md)',
    color:         'var(--color-text-primary)',
    fontSize:      '0.875rem',
    padding:       '0.625rem 0.875rem',
    outline:       'none',
    transition:    `border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)`,
    width:         '100%',
  }
}

function SpinIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite' }}
      aria-hidden="true"
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
function IconZap() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
function IconBarcode() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M11 5v14" />
    </svg>
  )
}
function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
