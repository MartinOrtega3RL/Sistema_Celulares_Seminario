/* src/components/layout/AppShell.jsx */
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'

const ROUTE_TITLES = {
  '/dashboard':                'Dashboard',
  '/catalogo':                 'Catálogo de productos',
  '/stock':                    'Control de stock',
  '/clientes':                 'Directorio de clientes',
  '/ventas/nueva':             'Punto de venta',
  '/ventas/historial':         'Historial de ventas',
  '/usuarios':                 'Gestión de usuarios',
  '/perfil/cambiar-password':  'Cambiar contraseña',
  '/sin-permiso':              'Acceso denegado',
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const title    = ROUTE_TITLES[location.pathname] ?? 'El Gringo Celulares'
  const sidebarW = collapsed ? 64 : 256

  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--color-bg-base)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div
        className="flex flex-col flex-1 min-w-0"
        style={{
          marginLeft: `${sidebarW}px`,
          transition: `margin-left var(--duration-slow) var(--ease-out)`,
        }}
      >
        <Topbar sidebarCollapsed={collapsed} title={title} />

        <main
          id="main-content"
          style={{
            paddingTop: 'var(--spacing-topbar)',
            minHeight:  '100dvh',
            flex:       1,
          }}
        >
          <div style={{ padding: '1.5rem' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
