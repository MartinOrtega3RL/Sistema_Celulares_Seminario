/* src/router/index.jsx */
import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom'
import AppShell            from '../components/layout/AppShell'
import ProtectedRoute      from './ProtectedRoute'
import LoginPage           from '../pages/auth/LoginPage'
import CambiarPasswordPage from '../pages/auth/CambiarPasswordPage'
import DashboardPage       from '../pages/dashboard/DashboardPage'
import SinPermisoPage      from '../pages/SinPermisoPage'
import UsuariosPage        from '../pages/usuarios/UsuariosPage'
import CatalogoPage        from '../pages/catalogo/CatalogoPage'
import ExistenciasPage     from '../pages/stock/ExistenciasPage'
import ClientesPage        from '../pages/clientes/ClientesPage'
import PuntoVentaPage      from '../pages/ventas/PuntoVentaPage'
import HistorialVentasPage from '../pages/ventas/HistorialVentasPage'

// Componente para capturar errores inesperados en rutas
function RouteErrorBoundary() {
  const error = useRouteError()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '1rem', border: '1px solid var(--color-danger)' }}>
        ⚠️
      </div>
      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: 'var(--tracking-tight)', marginBottom: '0.5rem' }}>Ha ocurrido un error inesperado</h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', maxWidth: 420, marginBottom: '1.5rem' }}>
        {error?.message || 'No se pudo cargar la vista seleccionada.'}
      </p>
      <button
        onClick={() => window.location.assign('/dashboard')}
        style={{ padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--color-accent)', color: 'var(--color-text-inverse)', fontWeight: 700, fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer' }}
      >
        Volver al Dashboard
      </button>
    </div>
  )
}

export const router = createBrowserRouter([
  // ── Públicas ─────────────────────────────────────────────────────────────
  { path: '/login', element: <LoginPage /> },

  // ── Protegidas dentro del shell ──────────────────────────────────────────
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },

      { path: 'dashboard', element: <DashboardPage /> },

      // Perfil del usuario logueado
      { path: 'perfil/cambiar-password', element: <CambiarPasswordPage /> },

      // Módulo 1 — Administración (RF04.1: solo Admin ve Usuarios)
      {
        path: 'usuarios',
        element: (
          <ProtectedRoute requiereModulo={1}>
            <UsuariosPage />
          </ProtectedRoute>
        ),
      },

      // Módulo 2 — Catálogo y Existencias
      {
        path: 'catalogo',
        element: (
          <ProtectedRoute requiereModulo={2}>
            <CatalogoPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'stock',
        element: (
          <ProtectedRoute requiereModulo={2}>
            <ExistenciasPage />
          </ProtectedRoute>
        ),
      },

      // Módulo 3 — Clientes
      {
        path: 'clientes',
        element: (
          <ProtectedRoute requiereModulo={3}>
            <ClientesPage />
          </ProtectedRoute>
        ),
      },

      // Módulo 4 — Ventas
      {
        path: 'ventas/nueva',
        element: (
          <ProtectedRoute requiereModulo={4}>
            <PuntoVentaPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ventas/historial',
        element: (
          <ProtectedRoute requiereModulo={4}>
            <HistorialVentasPage />
          </ProtectedRoute>
        ),
      },

      // Sin permiso
      { path: 'sin-permiso', element: <SinPermisoPage /> },
    ],
  },

  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
