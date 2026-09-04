/* src/pages/dashboard/DashboardPage.jsx
 * Dashboard principal del sistema commercial — El Gringo Celulares
 * RF12.3 — Alertas automáticas de stock bajo y accesos rápidos de operación
 * Estilizado en el sistema de diseño dark-first con tokens de Impeccable
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAlertas } from '../../services/stockService'
import { getVentas } from '../../services/ventasService'
import { getProductos } from '../../services/catalogoService'
import { getClientes } from '../../services/clientesService'
import { formatPrecio, formatFechaHora } from '../../utils/format'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [alertasStock, setAlertasStock] = useState([])
  const [ventasRecientes, setVentasRecientes] = useState([])
  const [totalProductos, setTotalProductos] = useState(0)
  const [totalClientes, setTotalClientes] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      getAlertas(),
      getVentas({ limit: 5 }),
      getProductos({ limit: 1 }),
      getClientes({ limit: 1 }),
    ]).then(([alertas, ventasRes, prodsRes, clientesRes]) => {
      if (mounted) {
        setAlertasStock(alertas || [])
        setVentasRecientes(ventasRes.data || [])
        setTotalProductos(prodsRes.total || 0)
        setTotalClientes(clientesRes.total || 0)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  // Sin totales de venta por período: eso es RF25, del módulo de reportes,
  // diferido a una iteración posterior. El listado de últimas ventas se
  // sostiene en RF18.1 como acceso al historial.

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)', margin: 0 }}>
          Panel de Control Principal
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          El Gringo Celulares — Monitoreo operativo, existencias críticas y accesos directos
        </p>
      </div>

      {/* Main KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Acceso Rápido POS */}
        <div
          onClick={() => navigate('/ventas/nueva')}
          style={{
            padding: '1.25rem', borderRadius: 'var(--radius-xl)',
            background: 'var(--color-accent-subtle)', border: '1px solid hsl(183 40% 24%)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyBetween: 'space-between',
            transition: 'all var(--duration-fast)', boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>
              Acceso Directo POS
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 2, display: 'block' }}>
              Nueva Venta ⚡
            </span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-accent)', color: 'var(--color-text-inverse)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800 }}>
            🛒
          </div>
        </div>

        {/* Alertas de Stock Bajo (RF12.3) */}
        <div
          onClick={() => navigate('/stock')}
          style={{
            padding: '1.25rem', borderRadius: 'var(--radius-xl)',
            background: alertasStock.length > 0 ? 'var(--color-danger-muted)' : 'var(--color-bg-surface)',
            border: `1px solid ${alertasStock.length > 0 ? 'var(--color-danger)' : 'var(--color-border-subtle)'}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyBetween: 'space-between',
            transition: 'all var(--duration-fast)', boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>
              Alertas de Stock (RF12.3)
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-danger)', marginTop: 2, display: 'block' }}>
              {alertasStock.length} productos
            </span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            ⚠️
          </div>
        </div>

        {/* Total Productos */}
        <div
          onClick={() => navigate('/catalogo')}
          style={{
            padding: '1.25rem', borderRadius: 'var(--radius-xl)',
            background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyBetween: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>
              Productos Catálogo
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {totalProductos} items
            </span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-elevated)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            📦
          </div>
        </div>

        {/* Clientes Registrados */}
        <div
          onClick={() => navigate('/clientes')}
          style={{
            padding: '1.25rem', borderRadius: 'var(--radius-xl)',
            background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyBetween: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>
              Directorio Clientes
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {totalClientes} registrados
            </span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            👥
          </div>
        </div>

      </div>

      {/* Grid Secundario: Alertas Críticas de Almacén + Ventas Recientes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* WIDGET: Alertas de Stock Bajo (RF12.3) */}
        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠️ Productos en Stock Crítico (RF12.3)</span>
            </h3>
            <button
              onClick={() => navigate('/stock')}
              style={{ fontSize: '0.7rem', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              Ver Almacén →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {alertasStock.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-success)', fontSize: 'var(--text-xs)' }}>
                ✅ Todas las existencias están por encima del stock mínimo.
              </div>
            ) : (
              alertasStock.slice(0, 5).map(p => (
                <div key={p.id_producto} style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '0.625rem 0.875rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{p.denominacion}</p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{p.codigo_interno}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: p.stock_actual === 0 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                      {p.stock_actual === 0 ? 'SIN STOCK' : `${p.stock_actual} u. (Mín: ${p.stock_minimo})`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* WIDGET: Ultimas Ventas Emitidas */}
        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              🧾 Últimas Ventas Emitidas
            </h3>
            <button
              onClick={() => navigate('/ventas/historial')}
              style={{ fontSize: '0.7rem', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              Ver Historial →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {ventasRecientes.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                No hay ventas registradas recientemente.
              </div>
            ) : (
              ventasRecientes.map(v => (
                <div key={v.id_venta} style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '0.625rem 0.875rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{v.numero_comprobante}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', display: 'block' }}>{formatFechaHora(v.fecha_venta)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: v.estado === 'ANULADA' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {formatPrecio(v.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
