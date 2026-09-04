/* src/pages/SinPermisoPage.jsx */
import { useNavigate } from 'react-router-dom'

export default function SinPermisoPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div style={{ color: 'var(--color-warning)', fontSize: '3rem' }}>🔒</div>
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        Sin permiso
      </h1>
      <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Tu perfil no tiene acceso a esta sección. Contactá al administrador.
      </p>
      <button
        id="volver-btn"
        onClick={() => navigate(-1)}
        className="px-4 py-2 rounded-md text-sm font-medium transition-[background] duration-[var(--duration-fast)]"
        style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
      >
        Volver
      </button>
    </div>
  )
}
