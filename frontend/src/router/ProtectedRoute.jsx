/* src/router/ProtectedRoute.jsx
 * Protege rutas: si no hay sesión activa redirige al login.
 * Si opcionalmente se pasa `requiereModulo`, valida el permiso de lectura.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, requiereModulo }) {
  const { isAuth, isLoading, tienePermiso } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-dvh"
        style={{ background: 'var(--color-bg-base)' }}
        aria-label="Cargando sesión"
      >
        <Spinner />
      </div>
    )
  }

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiereModulo && !tienePermiso(requiereModulo, 'lectura')) {
    return <Navigate to="/sin-permiso" replace />
  }

  return children
}

function Spinner() {
  return (
    <svg
      width="32" height="32" viewBox="0 0 24 24"
      fill="none" stroke="var(--color-accent)"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: 'spin 0.8s linear infinite' }}
      aria-hidden="true"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
