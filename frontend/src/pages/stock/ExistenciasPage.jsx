/* src/pages/stock/ExistenciasPage.jsx
 * RF12.1 — Panel de existencias y control de inventario
 * RF12.2 — Visualización de stock mínimo por producto
 * RF12.3 — Alertas automáticas de stock crítico / bajo mínimo
 * RF11.1 / RF11.5 — Modales integrados de ingreso y ajuste
 * RF04.2 — La valorización del inventario deriva del precio de costo, de modo
 *          que solo se muestra a los perfiles habilitados para verlo.
 * Historial de movimientos filtrable
 * Diseñado con el sistema de tokens dark-first (Impeccable style system)
 */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { getStock, getMovimientos } from '../../services/stockService'
import { formatPrecio, formatFechaHora } from '../../utils/format'
import IngresoMercaderiaModal from './IngresoMercaderiaModal'
import AjusteStockModal from './AjusteStockModal'
import EtiquetasModal from '../catalogo/EtiquetasModal'

export default function ExistenciasPage() {
  const { esAdmin } = useAuth()
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros de existencias
  const [tabActiva, setTabActiva] = useState('existencias') // 'existencias' | 'movimientos'
  const [filtroAlerta, setFiltroAlerta] = useState('TODOS') // 'TODOS' | 'BAJO_MINIMO' | 'SIN_STOCK'
  const [search, setSearch] = useState('')

  // Filtros de movimientos
  const [movSearch, setMovSearch] = useState('')
  const [movTipo, setMovTipo] = useState('TODOS')
  const [movDesde, setMovDesde] = useState('')
  const [movHasta, setMovHasta] = useState('')

  // Modales
  const [modalIngreso, setModalIngreso] = useState(null) // null | prodId
  const [modalAjuste, setModalAjuste] = useState(null)   // null | prodId
  const [modalEtiqueta, setModalEtiqueta] = useState(null) // null | prod

  const loadData = async () => {
    setLoading(true)
    try {
      const [prodsData, movsData] = await Promise.all([
        getStock(),
        getMovimientos({ search: movSearch, tipo: movTipo, desde: movDesde, hasta: movHasta }),
      ])
      setProductos(prodsData || [])
      setMovimientos(movsData || [])
    } catch (err) {
      toast.error('Error al cargar la información de existencias.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [movSearch, movTipo, movDesde, movHasta])

  // KPIs
  const totalProductos = productos.length
  const prodsBajoMinimo = productos.filter(p => p.bajo_minimo || p.stock_actual <= p.stock_minimo)
  const prodsSinStock = productos.filter(p => p.stock_actual === 0)
  // Solo con el costo real: estimarlo a partir del precio de venta expondría un
  // margen inventado, y la rentabilidad es justamente lo que RF04.2 restringe.
  const valorTotalInventario = productos.reduce(
    (acc, p) => acc + p.stock_actual * (p.precio_costo || 0), 0,
  )

  // Filtrado de la tabla de existencias
  const productosFiltrados = productos.filter(p => {
    const q = search.toLowerCase()
    const matchQuery = p.denominacion.toLowerCase().includes(q) || p.codigo_interno.toLowerCase().includes(q)
    if (!matchQuery) return false

    if (filtroAlerta === 'BAJO_MINIMO') return p.bajo_minimo || p.stock_actual <= p.stock_minimo
    if (filtroAlerta === 'SIN_STOCK') return p.stock_actual === 0
    return true
  })

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header del módulo */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>Control de Existencias y Stock</span>
            {prodsBajoMinimo.length > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-xs)', fontWeight: 700,
                background: 'var(--color-danger-muted)', color: 'var(--color-danger)',
                border: '1px solid hsl(4 60% 24%)'
              }}>
                ⚠️ {prodsBajoMinimo.length} Alertas
              </span>
            )}
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            RF12.1, RF12.3 — Monitoreo de almacén, ingresos, ajustes manuales e historial de movimientos
          </p>
        </div>

        {/* Acciones principales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button
            onClick={() => setModalIngreso(true)}
            style={{
              padding: '0.625rem 1.125rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
              fontWeight: 600, fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)',
              transition: 'background var(--duration-fast) var(--ease-out)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}
          >
            <span>➕ Ingreso Mercadería</span>
          </button>

          <button
            onClick={() => setModalAjuste(true)}
            style={{
              padding: '0.625rem 1.125rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)',
              fontWeight: 600, fontSize: 'var(--text-sm)',
              border: '1px solid var(--color-border-default)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'background var(--duration-fast) var(--ease-out)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
          >
            <span>🛠️ Ajuste Manual</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (High-contrast dark surface panels) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Total productos */}
        <div style={{
          padding: '1.25rem', borderRadius: 'var(--radius-xl)',
          background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)',
          display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)',
            background: 'var(--color-accent-subtle)', color: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1.5rem', flexShrink: 0
          }}>
            📦
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>
              Total Productos
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
              {totalProductos}
            </span>
          </div>
        </div>

        {/* Bajo Stock Mínimo */}
        <button
          onClick={() => { setTabActiva('existencias'); setFiltroAlerta('BAJO_MINIMO'); }}
          style={{
            padding: '1.25rem', borderRadius: 'var(--radius-xl)', textAlign: 'left',
            background: filtroAlerta === 'BAJO_MINIMO' && tabActiva === 'existencias' ? 'var(--color-danger-muted)' : 'var(--color-bg-surface)',
            border: `1px solid ${filtroAlerta === 'BAJO_MINIMO' && tabActiva === 'existencias' ? 'var(--color-danger)' : 'var(--color-border-subtle)'}`,
            display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-out)'
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)',
            background: 'var(--color-danger-muted)', color: 'var(--color-danger)',
            display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1.5rem', flexShrink: 0
          }}>
            ⚠️
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>
              Stock Bajo Mínimo
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-danger)', letterSpacing: 'var(--tracking-snug)' }}>
              {prodsBajoMinimo.length}
            </span>
          </div>
        </button>

        {/* Sin Stock */}
        <button
          onClick={() => { setTabActiva('existencias'); setFiltroAlerta('SIN_STOCK'); }}
          style={{
            padding: '1.25rem', borderRadius: 'var(--radius-xl)', textAlign: 'left',
            background: filtroAlerta === 'SIN_STOCK' && tabActiva === 'existencias' ? 'var(--color-warning-muted)' : 'var(--color-bg-surface)',
            border: `1px solid ${filtroAlerta === 'SIN_STOCK' && tabActiva === 'existencias' ? 'var(--color-warning)' : 'var(--color-border-subtle)'}`,
            display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-out)'
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)',
            background: 'var(--color-warning-muted)', color: 'var(--color-warning)',
            display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1.5rem', flexShrink: 0
          }}>
            🚫
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>
              Sin Existencias
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-warning)', letterSpacing: 'var(--tracking-snug)' }}>
              {prodsSinStock.length}
            </span>
          </div>
        </button>

        {/* Valoración Almacén — RF04.2: se calcula sobre el precio de costo,
            de modo que queda restringida a los perfiles habilitados */}
        {esAdmin && (
          <div style={{
            padding: '1.25rem', borderRadius: 'var(--radius-xl)',
            background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)',
            display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-lg)',
              background: 'var(--color-success-muted)', color: 'var(--color-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0
            }}>
              💰
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>
                Valoración Almacén
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)', fontFamily: 'var(--font-sans)' }}>
                {formatPrecio(valorTotalInventario)}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Main Container Card (Dark Surface) */}
      <div style={{
        background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)'
      }}>
        
        {/* Tab & Search Header */}
        <div style={{
          padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setTabActiva('existencias')}
              style={{
                padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
                background: tabActiva === 'existencias' ? 'var(--color-bg-overlay)' : 'transparent',
                color: tabActiva === 'existencias' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                border: tabActiva === 'existencias' ? '1px solid var(--color-border-default)' : '1px solid transparent',
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
            >
              📦 Almacén ({productosFiltrados.length})
            </button>

            <button
              onClick={() => setTabActiva('movimientos')}
              style={{
                padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
                background: tabActiva === 'movimientos' ? 'var(--color-bg-overlay)' : 'transparent',
                color: tabActiva === 'movimientos' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                border: tabActiva === 'movimientos' ? '1px solid var(--color-border-default)' : '1px solid transparent',
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
            >
              📜 Historial de Movimientos ({movimientos.length})
            </button>
          </div>

          {tabActiva === 'existencias' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por producto o código..."
                style={{
                  height: 36, padding: '0 0.75rem', fontSize: 'var(--text-xs)',
                  background: 'var(--color-bg-base)', border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', outline: 'none', width: 220
                }}
              />
              <button
                onClick={() => setFiltroAlerta('TODOS')}
                style={{
                  padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
                  background: filtroAlerta === 'TODOS' ? 'var(--color-accent)' : 'var(--color-bg-base)',
                  color: filtroAlerta === 'TODOS' ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-default)'
                }}
              >
                Todos
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: TABLA DE EXISTENCIAS DE PRODUCTOS */}
        {tabActiva === 'existencias' && (
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                Cargando existencias de stock...
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                No se encontraron productos con los criterios seleccionados.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)' }}>
                    <th style={{ padding: '0.875rem 1rem' }}>Producto</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Categoría / Marca</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'center', width: 180 }}>Nivel de Stock</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Stock Actual</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Stock Mín.</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Acciones Rápidas</th>
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--color-text-primary)' }}>
                  {productosFiltrados.map(p => {
                    const esBajoMinimo = p.bajo_minimo || p.stock_actual <= p.stock_minimo
                    const esSinStock = p.stock_actual === 0
                    const porcentaje = Math.min(100, Math.round((p.stock_actual / Math.max(1, p.stock_minimo * 2)) * 100))

                    const catNombre = p.categoria?.nombre_categoria || (typeof p.categoria === 'string' ? p.categoria : 'Sin cat.')
                    const marcaNombre = p.marca?.nombre_marca || (typeof p.marca === 'string' ? p.marca : 'Genérico')

                    return (
                      <tr key={p.id_producto} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--duration-fast)' }}>
                        
                        {/* Producto */}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: 'var(--radius-md)',
                              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
                              display: 'flex', alignItems: 'center', justifyCenter: 'center',
                              fontWeight: 700, color: 'var(--color-text-tertiary)', fontSize: '0.75rem', overflow: 'hidden', flexShrink: 0
                            }}>
                              {p.imagen_url ? (
                                <img src={p.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                p.codigo_interno.slice(0, 3)
                              )}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, leading: 'var(--leading-tight)' }}>{p.denominacion}</p>
                              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>{p.codigo_interno}</span>
                            </div>
                          </div>
                        </td>

                        {/* Clasificación */}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block' }}>{catNombre}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{marcaNombre}</span>
                        </td>

                        {/* Progress Bar */}
                        <td style={{ padding: '0.75rem 1rem', width: 180 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ height: 8, width: '100%', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%', borderRadius: 'var(--radius-pill)', transition: 'all var(--duration-normal)',
                                  width: `${porcentaje}%`,
                                  background: esSinStock ? 'var(--color-text-disabled)' : esBajoMinimo ? 'var(--color-danger)' : 'var(--color-success)',
                                }}
                              />
                            </div>
                            {esBajoMinimo && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: esSinStock ? 'var(--color-text-tertiary)' : 'var(--color-danger)', textTransform: 'uppercase' }}>
                                {esSinStock ? '🚫 Sin existencias' : '⚠️ Crítico (Bajo mín.)'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stock actual */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: esBajoMinimo ? 'var(--color-danger)' : 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            {p.stock_actual}
                          </span>
                        </td>

                        {/* Stock mínimo */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                          {p.stock_minimo}
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                            <button
                              onClick={() => setModalIngreso(p.id_producto)}
                              title="Ingresar Mercadería"
                              style={{
                                padding: '0.375rem 0.625rem', borderRadius: 'var(--radius-md)',
                                background: 'var(--color-success-muted)', color: 'var(--color-success)',
                                border: '1px solid hsl(148 40% 24%)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer'
                              }}
                            >
                              + Ingreso
                            </button>
                            <button
                              onClick={() => setModalAjuste(p.id_producto)}
                              title="Ajuste manual"
                              style={{
                                padding: '0.375rem 0.625rem', borderRadius: 'var(--radius-md)',
                                background: 'var(--color-warning-muted)', color: 'var(--color-warning)',
                                border: '1px solid hsl(38 60% 24%)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer'
                              }}
                            >
                              🛠️ Ajustar
                            </button>
                            <button
                              onClick={() => setModalEtiqueta(p)}
                              title="Imprimir etiquetas"
                              style={{
                                width: 28, height: 28, borderRadius: 'var(--radius-md)',
                                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
                                color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              🏷️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: HISTORIAL DE MOVIMIENTOS */}
        {tabActiva === 'movimientos' && (
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Filtros del historial */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem',
              padding: '1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Tipo Movimiento</label>
                <select
                  value={movTipo}
                  onChange={e => setMovTipo(e.target.value)}
                  style={{ width: '100%', height: 36, padding: '0 0.625rem', fontSize: 'var(--text-xs)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="INGRESO">INGRESO (+)</option>
                  <option value="AJUSTE">AJUSTE</option>
                  <option value="VENTA">VENTA (-)</option>
                  <option value="RESTITUCIÓN">RESTITUCIÓN (+)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Fecha Desde</label>
                <input
                  type="date"
                  value={movDesde}
                  onChange={e => setMovDesde(e.target.value)}
                  style={{ width: '100%', height: 36, padding: '0 0.625rem', fontSize: 'var(--text-xs)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Fecha Hasta</label>
                <input
                  type="date"
                  value={movHasta}
                  onChange={e => setMovHasta(e.target.value)}
                  style={{ width: '100%', height: 36, padding: '0 0.625rem', fontSize: 'var(--text-xs)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Buscar por motivo / prod</label>
                <input
                  type="text"
                  value={movSearch}
                  onChange={e => setMovSearch(e.target.value)}
                  placeholder="Ej. Remito, Venta #..."
                  style={{ width: '100%', height: 36, padding: '0 0.625rem', fontSize: 'var(--text-xs)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
                />
              </div>
            </div>

            {/* Tabla de movimientos */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Fecha y Hora</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Producto</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Tipo</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Cantidad</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Motivo / Detalle</th>
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--color-text-primary)' }}>
                  {movimientos.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                        No hay movimientos registrados en el periodo.
                      </td>
                    </tr>
                  ) : (
                    movimientos.map(m => (
                      <tr key={m.id_movimiento} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {formatFechaHora(m.fecha_movimiento)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{m.producto?.denominacion || 'Producto'}</p>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{m.producto?.codigo_interno}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-pill)', fontSize: '0.65rem', fontWeight: 800,
                            background: m.tipo_movimiento === 'INGRESO' || m.tipo_movimiento === 'RESTITUCIÓN' ? 'var(--color-success-muted)' : m.tipo_movimiento === 'VENTA' ? 'var(--color-info-muted)' : 'var(--color-warning-muted)',
                            color: m.tipo_movimiento === 'INGRESO' || m.tipo_movimiento === 'RESTITUCIÓN' ? 'var(--color-success)' : m.tipo_movimiento === 'VENTA' ? 'var(--color-info)' : 'var(--color-warning)',
                          }}>
                            {m.tipo_movimiento}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                          <span style={{ color: m.cantidad > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>
                          {m.motivo}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* Modales */}
      {modalIngreso && (
        <IngresoMercaderiaModal
          initialProductoId={typeof modalIngreso === 'number' ? modalIngreso : null}
          onClose={() => setModalIngreso(null)}
          onSuccess={loadData}
        />
      )}

      {modalAjuste && (
        <AjusteStockModal
          initialProductoId={typeof modalAjuste === 'number' ? modalAjuste : null}
          onClose={() => setModalAjuste(null)}
          onSuccess={loadData}
        />
      )}

      {modalEtiqueta && (
        <EtiquetasModal
          productos={productos}
          initialProducto={modalEtiqueta}
          onClose={() => setModalEtiqueta(null)}
        />
      )}

    </div>
  )
}
