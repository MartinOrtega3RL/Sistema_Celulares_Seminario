/* src/pages/auth/CambiarPasswordPage.jsx — RF01.3 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cambiarPassword } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'
import { Field, inputStyle } from './LoginPage'

export default function CambiarPasswordPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]         = useState({ contrasena_actual: '', contrasena_nueva: '', confirmar: '' })
  const [submitting, setSubmit] = useState(false)
  const [showFields, setShow]   = useState({ actual: false, nueva: false, confirmar: false })
  const [touched, setTouched]   = useState({})

  function mark(f) { setTouched(t => ({ ...t, [f]: true })) }

  const errors = {
    contrasena_actual: touched.contrasena_actual && !form.contrasena_actual
      ? 'Ingresá tu contraseña actual.' : null,
    contrasena_nueva: touched.contrasena_nueva && form.contrasena_nueva.length > 0 && form.contrasena_nueva.length < 8
      ? 'Mínimo 8 caracteres.' : null,
    confirmar: touched.confirmar && form.confirmar && form.contrasena_nueva !== form.confirmar
      ? 'Las contraseñas no coinciden.' : null,
  }

  const isValid = form.contrasena_actual && form.contrasena_nueva.length >= 8 && form.contrasena_nueva === form.confirmar

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ contrasena_actual: true, contrasena_nueva: true, confirmar: true })
    if (!isValid) return
    setSubmit(true)
    try {
      await cambiarPassword({ contrasena_actual: form.contrasena_actual, contrasena_nueva: form.contrasena_nueva })
      toast.success('Contraseña actualizada. Volvé a iniciar sesión si es necesario.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo actualizar la contraseña.')
    } finally {
      setSubmit(false)
    }
  }

  const strength = passwordStrength(form.contrasena_nueva)

  return (
    <div className="max-w-md">
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-snug)' }}
        >
          Cambiar contraseña
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Usuario: <span style={{ color: 'var(--color-text-primary)' }}>@{usuario?.nombre_usuario}</span>
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-xl p-6 space-y-5 border border-default"
        style={{ background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-md)' }}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Contraseña actual */}
          <PasswordField
            id="cp-actual"
            label="Contraseña actual"
            value={form.contrasena_actual}
            show={showFields.actual}
            onToggle={() => setShow(s => ({ ...s, actual: !s.actual }))}
            error={errors.contrasena_actual}
            onChange={v => setForm(f => ({ ...f, contrasena_actual: v }))}
            onBlur={() => mark('contrasena_actual')}
            autoComplete="current-password"
          />

          <div
            className="border-t"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          />

          {/* Nueva contraseña */}
          <PasswordField
            id="cp-nueva"
            label="Nueva contraseña"
            value={form.contrasena_nueva}
            show={showFields.nueva}
            onToggle={() => setShow(s => ({ ...s, nueva: !s.nueva }))}
            error={errors.contrasena_nueva}
            onChange={v => setForm(f => ({ ...f, contrasena_nueva: v }))}
            onBlur={() => mark('contrasena_nueva')}
            autoComplete="new-password"
          />

          {/* Strength bar */}
          {form.contrasena_nueva.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-pill transition-[background] duration-[var(--duration-normal)]"
                    style={{
                      background: i < strength.level
                        ? strength.color
                        : 'var(--color-border-subtle)',
                    }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </div>
          )}

          {/* Confirmar */}
          <PasswordField
            id="cp-confirmar"
            label="Confirmar nueva contraseña"
            value={form.confirmar}
            show={showFields.confirmar}
            onToggle={() => setShow(s => ({ ...s, confirmar: !s.confirmar }))}
            error={errors.confirmar}
            onChange={v => setForm(f => ({ ...f, confirmar: v }))}
            onBlur={() => mark('confirmar')}
            autoComplete="new-password"
          />

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              id="cp-cancelar"
              onClick={() => navigate(-1)}
              className="flex-1 py-2.5 rounded-md text-sm font-medium transition-[background] duration-[var(--duration-fast)]"
              style={{
                background: 'var(--color-bg-elevated)',
                color:      'var(--color-text-secondary)',
                border:     '1px solid var(--color-border-default)',
              }}
            >
              Cancelar
            </button>
            <button
              id="cp-guardar"
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-[opacity] duration-[var(--duration-fast)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:    'var(--color-accent)',
                color:         'var(--color-text-inverse)',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              {submitting ? <SpinIcon /> : null}
              {submitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {/* Requirements list */}
      <ul className="mt-4 space-y-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        <RequirementItem met={form.contrasena_nueva.length >= 8} text="Mínimo 8 caracteres" />
        <RequirementItem met={/[A-Z]/.test(form.contrasena_nueva)} text="Al menos una letra mayúscula" />
        <RequirementItem met={/[0-9]/.test(form.contrasena_nueva)} text="Al menos un número" />
        <RequirementItem
          met={form.contrasena_nueva.length > 0 && form.contrasena_nueva === form.confirmar}
          text="Las contraseñas coinciden"
        />
      </ul>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function PasswordField({ id, label, value, show, onToggle, error, onChange, onBlur, autoComplete }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="••••••••"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full pr-10"
          style={inputStyle(!!error)}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Ocultar' : 'Mostrar'}
          className="absolute inset-y-0 right-0 flex items-center pr-3"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {show
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          }
        </button>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  )
}

function RequirementItem({ met, text }) {
  return (
    <li className="flex items-center gap-2" style={{ color: met ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
      {met
        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /></svg>
      }
      {text}
    </li>
  )
}

function passwordStrength(pw) {
  let score = 0
  if (pw.length >= 8)    score++
  if (pw.length >= 12)   score++
  if (/[A-Z]/.test(pw))  score++
  if (/[0-9!@#$%]/.test(pw)) score++
  const levels = [
    { level: 1, label: 'Débil',    color: 'var(--color-danger)'  },
    { level: 2, label: 'Regular',  color: 'var(--color-warning)' },
    { level: 3, label: 'Buena',    color: 'var(--color-info)'    },
    { level: 4, label: 'Fuerte',   color: 'var(--color-success)' },
  ]
  return levels[Math.min(score, 4) - 1] ?? { level: 1, label: 'Débil', color: 'var(--color-danger)' }
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
