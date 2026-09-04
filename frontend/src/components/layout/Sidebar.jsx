/* src/components/layout/Sidebar.jsx — RF04.1 (solo módulos habilitados según perfil) */
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/* Nav tree: modulo null = visible para todos los autenticados */
const NAV_GROUPS = [
  {
    label: null, // sin título de grupo
    items: [
      {
        id:     'dashboard',
        label:  'Dashboard',
        to:     '/dashboard',
        modulo: null,
        icon:   <IconGrid />,
      },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { id: 'catalogo', label: 'Productos',   to: '/catalogo',    modulo: 2, icon: <IconBox />   },
      { id: 'stock',    label: 'Stock',       to: '/stock',       modulo: 2, icon: <IconLayers /> },
    ],
  },
  {
    label: 'Comercio',
    items: [
      { id: 'clientes',  label: 'Clientes',        to: '/clientes',         modulo: 3, icon: <IconUsers />  },
      { id: 'pos',       label: 'Punto de venta',  to: '/ventas/nueva',     modulo: 4, icon: <IconCart />   },
      { id: 'historial', label: 'Ventas',          to: '/ventas/historial', modulo: 4, icon: <IconActivity /> },
    ],
  },
  {
    label: 'Administración',
    items: [
      { id: 'usuarios', label: 'Usuarios', to: '/usuarios', modulo: 1, icon: <IconUserCog /> },
    ],
  },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { tienePermiso } = useAuth()

  const filteredGroups = NAV_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(i => i.modulo === null || tienePermiso(i.modulo, 'lectura')),
  })).filter(g => g.items.length > 0)

  return (
    <aside
      id="app-sidebar"
      aria-label="Navegación principal"
      style={{
        width:    collapsed ? '64px' : '256px',
        minWidth: collapsed ? '64px' : '256px',
        position: 'fixed',
        inset:    '0 auto 0 0',
        zIndex:   'var(--z-sidebar)',
        transition: `width var(--duration-slow) var(--ease-out)`,
        background:   'var(--color-bg-surface)',
        borderRight:  '1px solid var(--color-border-subtle)',
        display:      'flex',
        flexDirection:'column',
        overflow:     'hidden',
      }}
    >
      {/* ── Brand ── */}
      <div
        style={{
          height:       'var(--spacing-topbar)',
          display:      'flex',
          alignItems:   'center',
          gap:          '0.75rem',
          padding:      '0 1rem',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink:   0,
        }}
      >
        <BrandIcon />
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize:      '0.875rem',
              fontWeight:    700,
              color:         'var(--color-text-primary)',
              letterSpacing: 'var(--tracking-snug)',
              whiteSpace:    'nowrap',
              overflow:      'hidden',
              textOverflow:  'ellipsis',
            }}>
              El Gringo Celulares
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav
        style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 0 }}
      >
        {filteredGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: group.label ? '0.5rem' : 0 }}>
            {/* Group label */}
            {group.label && !collapsed && (
              <p style={{
                fontSize:      '0.65rem',
                fontWeight:    700,
                color:         'var(--color-text-tertiary)',
                letterSpacing: 'var(--tracking-widest)',
                padding:       '0.5rem 0.75rem 0.25rem',
                textTransform: 'uppercase',
              }}>
                {group.label}
              </p>
            )}
            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {group.items.map(item => (
                <NavItem key={item.id} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Toggle ── */}
      <div style={{ padding: '0.5rem', borderTop: '1px solid var(--color-border-subtle)', flexShrink: 0 }}>
        <CollapseButton collapsed={collapsed} onToggle={onToggle} />
      </div>
    </aside>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      id={`nav-${item.id}`}
      title={collapsed ? item.label : undefined}
      end={item.to === '/dashboard'}
      style={({ isActive }) => ({
        display:       'flex',
        alignItems:    'center',
        gap:           '0.625rem',
        padding:       '0.5rem 0.625rem',
        borderRadius:  'var(--radius-md)',
        fontSize:      '0.875rem',
        fontWeight:    isActive ? 600 : 500,
        color:         isActive ? 'var(--color-accent)'           : 'var(--color-text-secondary)',
        background:    isActive ? 'var(--color-accent-subtle)'    : 'transparent',
        textDecoration:'none',
        transition:    `background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)`,
        justifyContent: collapsed ? 'center' : 'flex-start',
        whiteSpace:    'nowrap',
        overflow:      'hidden',
      })}
      className="nav-item"
    >
      {({ isActive }) => (
        <>
          <span
            className="shrink-0"
            style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }}
          >
            {item.icon}
          </span>
          {!collapsed && item.label}
        </>
      )}
    </NavLink>
  )
}

function CollapseButton({ collapsed, onToggle }) {
  return (
    <button
      id="sidebar-toggle"
      onClick={onToggle}
      aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
      style={{
        width:         '100%',
        display:       'flex',
        alignItems:    'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap:           '0.5rem',
        padding:       '0.5rem 0.625rem',
        borderRadius:  'var(--radius-md)',
        fontSize:      '0.8125rem',
        fontWeight:    500,
        color:         'var(--color-text-tertiary)',
        background:    'transparent',
        border:        'none',
        cursor:        'pointer',
        transition:    `background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)`,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-tertiary)' }}
    >
      {!collapsed && <span>Contraer</span>}
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{
          transform:  collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: `transform var(--duration-slow) var(--ease-out)`,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  )
}

function BrandIcon() {
  return (
    <div
      style={{
        width:          32,
        height:         32,
        borderRadius:   'var(--radius-md)',
        background:     'var(--color-accent)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
      }}
      aria-hidden="true"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01L6.62 10.79z" />
      </svg>
    </div>
  )
}

/* ── Icons (stroke icons, consistent 18×18, 1.75 strokeWidth) ─────────────── */
function IconGrid()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> }
function IconBox()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function IconLayers()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> }
function IconUsers()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IconCart()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> }
function IconActivity() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function IconUserCog()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><circle cx="19" cy="19" r="2"/><path d="M19 17v-1m0 4v-1m-1.73-1.27-.87.5m3.47-2-.87.5m-1.73 2.27-.87-.5m3.47-2-.87-.5"/></svg> }
