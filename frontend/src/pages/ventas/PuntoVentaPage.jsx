/* src/pages/ventas/PuntoVentaPage.jsx
 * RF16.1 — Punto de Venta (POS) y carrito de compras
 * RF16.2 — Ingreso por código interno / búsqueda predictiva
 * RF16.3 — Gestión de cantidades e ítemes
 * RF16.4 / RF16.5 — Recálculo automático de precios por tipo de cliente (minorista vs mayorista)
 * RF16.6 / RF16.8 — Medios de pago y cuotas (Go Cuotas, Tarjetas)
 * RF17.3 — Modalidad de entrega (local / domicilio)
 * RF16.7 — Confirmación transaccional e impresión de ticket
 * Estilizado en el sistema de diseño dark-first con tokens de Impeccable
 */
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getProductos, buscarProductos } from '../../services/catalogoService'
import { getClientes } from '../../services/clientesService'
import { getMediosPago, registrarVenta } from '../../services/ventasService'
import { useAuth } from '../../contexts/AuthContext'
import { useDebounce } from '../../hooks/useDebounce'
import { formatPrecio } from '../../utils/format'
import VentaTicketModal from './VentaTicketModal'

const MODALIDADES_CUOTAS = [
  { id: 'CONTADO', label: '1 Pago / Contado (0% recargo)', cuotas: 1, recargo: 0 },
  { id: 'CUOTAS_3', label: '3 Cuotas (5% recargo)', cuotas: 3, recargo: 5 },
  { id: 'CUOTAS_6', label: '6 Cuotas (12% recargo)', cuotas: 6, recargo: 12 },
  { id: 'CUOTAS_12', label: '12 Cuotas (24% recargo)', cuotas: 12, recargo: 24 },
  { id: 'GO_CUOTAS', label: 'Go Cuotas (3 cuotas con débito)', cuotas: 3, recargo: 0 },
]

export default function PuntoVentaPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const initialClienteId = searchParams.get('clienteId')

  // Catálogo de productos y clientes
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [mediosPago, setMediosPago] = useState([])
  const [loadingProds, setLoadingProds] = useState(true)

  // Búsqueda predictiva
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSugg, setShowSugg] = useState(false)
  const debouncedSearch = useDebounce(search, 200)

  // Carrito de compras
  const [cart, setCart] = useState([]) // [{ id_producto, denominacion, codigo_interno, precio_minorista, precio_mayorista, precio_costo, cantidad, stock_actual }]
  const [selectedClienteId, setSelectedClienteId] = useState(initialClienteId ? Number(initialClienteId) : '')
  const [selectedMedioPagoId, setSelectedMedioPagoId] = useState(1) // 1: Efectivo
  const [modalidadPagoId, setModalidadPagoId] = useState('CONTADO')
  const [modalidadEntrega, setModalidadEntrega] = useState('RETIRO_LOCAL') // 'RETIRO_LOCAL' | 'ENVIO_DOMICILIO'

  const [submitting, setSubmitting] = useState(false)
  const [ventaConfirmada, setVentaConfirmada] = useState(null)

  // Carga inicial
  useEffect(() => {
    let mounted = true
    Promise.all([
      getProductos({ limit: 9999 }),
      getClientes({ limit: 9999 }),
      getMediosPago(),
    ]).then(([prodsRes, clientesRes, mediosData]) => {
      if (mounted) {
        setProductos(prodsRes.data || [])
        setClientes(clientesRes.data || [])
        setMediosPago(mediosData || [])
        setLoadingProds(false)
      }
    }).catch(() => {
      if (mounted) setLoadingProds(false)
    })
    return () => { mounted = false }
  }, [])

  // Búsqueda predictiva y scanner de código interno
  useEffect(() => {
    if (debouncedSearch.trim().length < 1) {
      setSuggestions([])
      return
    }
    const q = debouncedSearch.trim().toLowerCase()
    // Buscar coincidencia exacta por código interno (scanner rápido)
    const exactMatch = productos.find(p => p.codigo_interno.toLowerCase() === q)
    if (exactMatch) {
      addToCart(exactMatch)
      setSearch('')
      setSuggestions([])
      setShowSugg(false)
      return
    }

    buscarProductos(q).then(res => setSuggestions(res || [])).catch(() => setSuggestions([]))
  }, [debouncedSearch])

  // Cliente seleccionado
  const selectedCliente = clientes.find(c => c.id_cliente === Number(selectedClienteId))
  const esMayorista = selectedCliente?.id_tipo_cliente === 2

  // Agregar al carrito
  const addToCart = (prod) => {
    if (prod.stock_actual <= 0) {
      toast.error(`"${prod.denominacion}" no tiene stock disponible.`)
      return
    }
    setCart(prev => {
      const idx = prev.findIndex(item => item.id_producto === prod.id_producto)
      if (idx >= 0) {
        const itemExist = prev[idx]
        if (itemExist.cantidad >= prod.stock_actual) {
          toast.warning(`Supera el stock disponible (${prod.stock_actual} u.).`)
          return prev
        }
        const updated = [...prev]
        updated[idx] = { ...itemExist, cantidad: itemExist.cantidad + 1 }
        return updated
      } else {
        return [...prev, { ...prod, cantidad: 1 }]
      }
    })
    toast.success(`"${prod.denominacion}" agregado al carrito.`)
  }

  // Modificar cantidad
  const updateQuantity = (id, delta) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id_producto === id) {
          const nuevaCant = item.cantidad + delta
          if (nuevaCant <= 0) return null
          if (nuevaCant > item.stock_actual) {
            toast.warning(`Máximo stock disponible alcanzado (${item.stock_actual} u.).`)
            return item
          }
          return { ...item, cantidad: nuevaCant }
        }
        return item
      }).filter(Boolean)
    )
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id_producto !== id))
  }

  // Cálculo de totales según lista de precios (Minorista vs Mayorista)
  const modalidadObj = MODALIDADES_CUOTAS.find(m => m.id === modalidadPagoId) || MODALIDADES_CUOTAS[0]
  const recargoPercent = modalidadObj.recargo || 0

  const subtotalCarrito = cart.reduce((acc, item) => {
    const precioBase = esMayorista ? item.precio_mayorista : item.precio_minorista
    return acc + (precioBase * item.cantidad)
  }, 0)

  const montoRecargo = Math.round((subtotalCarrito * recargoPercent) / 100)
  const totalFinal = subtotalCarrito + montoRecargo

  // Confirmar y registrar venta transaccional (RF16.7)
  const handleConfirmarVenta = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío. Agregá al menos un producto.')
      return
    }

    setSubmitting(true)
    try {
      const detallesPayload = cart.map(item => {
        const precioUnit = esMayorista ? item.precio_mayorista : item.precio_minorista
        return {
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: precioUnit,
          costo_unitario: item.precio_costo || 0,
          producto: { denominacion: item.denominacion, codigo_interno: item.codigo_interno },
        }
      })

      const venta = await registrarVenta({
        detalles: detallesPayload,
        id_cliente: selectedClienteId ? Number(selectedClienteId) : null,
        id_usuario: user?.id_usuario || 1,
        id_medio_pago: Number(selectedMedioPagoId),
        modalidad_pago: modalidadPagoId,
        cantidad_cuotas: modalidadObj.cuotas,
        recargo_financiacion: recargoPercent,
        modalidad_entrega: modalidadEntrega,
        lista_precio_aplicada: esMayorista ? 'mayorista' : 'minorista',
        cliente: selectedCliente || null,
      })

      toast.success(`Venta N° ${venta.numero_comprobante} registrada exitosamente.`)
      setVentaConfirmada(venta)
      setCart([])
    } catch (err) {
      toast.error(err?.message || 'Error al procesar la venta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header POS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🛒 Punto de Venta (POS)</span>
            <span style={{ fontSize: 'var(--text-xs)', padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-pill)', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', fontWeight: 700 }}>
              Operación Inmediata
            </span>
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            RF16.1 — Búsqueda por código interno, recálculo automático de precios por cliente y cobro rápido
          </p>
        </div>

        {esMayorista && (
          <div style={{ padding: '0.5rem 1rem', background: 'var(--color-success-muted)', border: '1px solid hsl(148 40% 24%)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 700 }}>
            <span>🏬 LISTA MAYORISTA APLICADA: Precios especiales activos</span>
          </div>
        )}
      </div>

      {/* POS Grid: Izquierda Catálogo / Derecha Carrito */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA: BÚSQUEDA Y CATÁLOGO DE PRODUCTOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Buscador predictivo e ingreso por scanner */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', marginBottom: '0.5rem' }}>
              Buscar o escanear código interno (RF16.2)
            </label>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSugg(true) }}
              onFocus={() => setShowSugg(true)}
              placeholder="Ingresá nombre o código (Ej. GC-0001)..."
              style={{
                width: '100%', height: 44, padding: '0 1rem', fontSize: 'var(--text-base)',
                background: 'var(--color-bg-surface)', border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius-lg)', color: 'var(--color-text-primary)', outline: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            />

            {/* Dropdown predictivo */}
            {showSugg && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                zIndex: 'var(--z-dropdown)', overflow: 'hidden'
              }}>
                {suggestions.map(p => (
                  <button
                    key={p.id_producto}
                    type="button"
                    onMouseDown={() => { addToCart(p); setSearch(''); setSuggestions([]); setShowSugg(false) }}
                    style={{
                      width: '100%', padding: '0.75rem 1rem', background: 'transparent', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyBetween: 'space-between',
                      textAlign: 'left', borderBottom: '1px solid var(--color-border-subtle)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{p.denominacion}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{p.codigo_interno}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        {formatPrecio(esMayorista ? p.precio_mayorista : p.precio_minorista)}
                      </span>
                      <span style={{ fontSize: '0.65rem', display: 'block', color: p.stock_actual <= 0 ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}>
                        Stock: {p.stock_actual} u.
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Catalog Selection Grid */}
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block', marginBottom: '1rem' }}>
              Catálogo Rápido ({productos.length})
            </span>

            {loadingProds ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando catálogo...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', maxHeight: 420, overflowY: 'auto' }}>
                {productos.map(p => {
                  const precio = esMayorista ? p.precio_mayorista : p.precio_minorista
                  const sinStock = p.stock_actual <= 0

                  return (
                    <div
                      key={p.id_producto}
                      onClick={() => !sinStock && addToCart(p)}
                      style={{
                        padding: '0.75rem', background: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg)',
                        cursor: sinStock ? 'not-allowed' : 'pointer', opacity: sinStock ? 0.5 : 1,
                        display: 'flex', flexDirection: 'column', justifyBetween: 'space-between',
                        transition: 'all var(--duration-fast)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', display: 'block' }}>{p.codigo_interno}</span>
                        <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '2px 0 6px', lineHeight: 1.3 }}>{p.denominacion}</h4>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyBetween: 'space-between', marginTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-text-primary)' }}>{formatPrecio(precio)}</span>
                          <span style={{ fontSize: '0.65rem', display: 'block', color: sinStock ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}>
                            {sinStock ? 'Agotado' : `${p.stock_actual} disp.`}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={sinStock}
                          style={{
                            padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)',
                            background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
                            fontWeight: 800, fontSize: '0.75rem', border: 'none', cursor: 'pointer'
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* COLUMNA DERECHA: CARRITO, CONFIGURACIÓN DE PAGO Y CONFIRMACIÓN */}
        <div style={{
          background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-xl)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
              Carrito de Compra ({cart.reduce((a, c) => a + c.cantidad, 0)} items)
            </span>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{ fontSize: '0.7rem', color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Vaciar carrito ×
              </button>
            )}
          </div>

          {/* Cliente selector (RF16.4 / RF16.5) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', uppercase: 'uppercase', marginBottom: '0.375rem' }}>
              Cliente Asignado (Recalcula Lista de Precios)
            </label>
            <select
              value={selectedClienteId}
              onChange={e => setSelectedClienteId(e.target.value)}
              style={{ width: '100%', height: 38, padding: '0 0.75rem', fontSize: 'var(--text-sm)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
            >
              <option value="">Consumidor Final (Precio Minorista)</option>
              {clientes.map(c => (
                <option key={c.id_cliente} value={c.id_cliente} style={{ background: 'var(--color-bg-surface)' }}>
                  {c.persona?.nombre} {c.persona?.apellido} ({c.id_tipo_cliente === 2 ? '🏬 Mayorista' : '🛒 Minorista'})
                </option>
              ))}
            </select>
          </div>

          {/* Cart item list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)', border: '1px dashed var(--color-border-subtle)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)' }}>
                El carrito está vacío. Hacé clic en los productos para agregarlos.
              </div>
            ) : (
              cart.map(item => {
                const precioUnit = esMayorista ? item.precio_mayorista : item.precio_minorista
                const subtotalItem = precioUnit * item.cantidad

                return (
                  <div key={item.id_producto} style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '0.5rem' }}>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.denominacion}</p>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{item.codigo_interno} • {formatPrecio(precioUnit)} u.</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id_producto, -1)}
                          style={{ width: 22, height: 22, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-text-primary)', width: 20, textAlign: 'center' }}>{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id_producto, 1)}
                          style={{ width: 22, height: 22, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>

                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-text-primary)', width: 64, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatPrecio(subtotalItem)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id_producto)}
                        style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', marginLeft: 4 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Formas de Pago y Financiación (RF16.6 / RF16.8) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', uppercase: 'uppercase', marginBottom: '0.25rem' }}>Medio de Pago</label>
              <select
                value={selectedMedioPagoId}
                onChange={e => setSelectedMedioPagoId(e.target.value)}
                style={{ width: '100%', height: 36, padding: '0 0.625rem', fontSize: 'var(--text-xs)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
              >
                {mediosPago.map(m => (
                  <option key={m.id_medio_pago} value={m.id_medio_pago} style={{ background: 'var(--color-bg-surface)' }}>
                    {m.nombre_medio}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', uppercase: 'uppercase', marginBottom: '0.25rem' }}>Plan / Financiación</label>
              <select
                value={modalidadPagoId}
                onChange={e => setModalidadPagoId(e.target.value)}
                style={{ width: '100%', height: 36, padding: '0 0.625rem', fontSize: 'var(--text-xs)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
              >
                {MODALIDADES_CUOTAS.map(m => (
                  <option key={m.id} value={m.id} style={{ background: 'var(--color-bg-surface)' }}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Entrega (RF17.3) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', uppercase: 'uppercase', marginBottom: '0.25rem' }}>Modalidad de Entrega (RF17.3)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.25rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
              <button
                type="button"
                onClick={() => setModalidadEntrega('RETIRO_LOCAL')}
                style={{
                  padding: '0.375rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
                  background: modalidadEntrega === 'RETIRO_LOCAL' ? 'var(--color-bg-overlay)' : 'transparent',
                  color: modalidadEntrega === 'RETIRO_LOCAL' ? 'var(--color-accent)' : 'var(--color-text-secondary)', border: 'none'
                }}
              >
                🏪 Retiro en Local
              </button>
              <button
                type="button"
                onClick={() => setModalidadEntrega('ENVIO_DOMICILIO')}
                style={{
                  padding: '0.375rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
                  background: modalidadEntrega === 'ENVIO_DOMICILIO' ? 'var(--color-bg-overlay)' : 'transparent',
                  color: modalidadEntrega === 'ENVIO_DOMICILIO' ? 'var(--color-accent)' : 'var(--color-text-secondary)', border: 'none'
                }}
              >
                🚚 Envío Domicilio
              </button>
            </div>
          </div>

          {/* Totales y Botón de Cobro Transaccional (RF16.7) */}
          <div style={{ borderTop: '2px solid var(--color-border-subtle)', paddingTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              <span>Subtotal productos:</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrecio(subtotalCarrito)}</span>
            </div>
            {recargoPercent > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-warning)' }}>
                <span>Recargo financiación ({recargoPercent}%):</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>+{formatPrecio(montoRecargo)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-text-primary)' }}>TOTAL A COBRAR</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
                {formatPrecio(totalFinal)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmarVenta}
              disabled={submitting || cart.length === 0}
              style={{
                marginTop: '0.5rem', padding: '0.875rem', borderRadius: 'var(--radius-lg)',
                background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
                fontSize: 'var(--text-base)', fontWeight: 800, border: 'none', cursor: 'pointer',
                opacity: (submitting || cart.length === 0) ? 0.5 : 1, transition: 'all var(--duration-fast)',
                boxShadow: '0 2px 10px hsl(183 72% 48% / 0.3)'
              }}
            >
              {submitting ? 'Procesando Venta...' : '⚡ Confirmar y Emitir Ticket'}
            </button>
          </div>

        </div>

      </div>

      {/* Modal de Ticket de Venta Emitido (RF17.1, RF17.2) */}
      {ventaConfirmada && (
        <VentaTicketModal
          venta={ventaConfirmada}
          onClose={() => setVentaConfirmada(null)}
        />
      )}

    </div>
  )
}
