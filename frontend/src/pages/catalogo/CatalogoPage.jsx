/* src/pages/catalogo/CatalogoPage.jsx
 * RF06.4 — Grilla de productos  RF06.5 — Búsqueda predictiva
 * RF07   — ABM categorías y marcas   RF08.4 — Actualización masiva
 * RF04.2 — Ocultar costo según perfil   RF09 — Etiquetas
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { useDebounce } from '../../hooks/useDebounce'
import {
  getProductos, buscarProductos, deleteProducto,
  getCategorias, getMarcas,
} from '../../services/catalogoService'
import { formatPrecio } from '../../utils/format'
import ProductoFormModal     from './ProductoFormModal'
import ClasificacionesModal  from './ClasificacionesModal'
import ActualizarPreciosModal from './ActualizarPreciosModal'

// ── State ─────────────────────────────────────────────────────────────────
const initState = {
  productos: [], categorias: [], marcas: [],
  total: 0, loading: true, error: null,
}
function reducer(s, a) {
  switch (a.type) {
    case 'LOADED':   return { ...s, ...a.payload, loading: false, error: null }
    case 'REFRESH':  return { ...s, loading: true, error: null }
    case 'ERROR':    return { ...s, error: a.error, loading: false }
    default:         return s
  }
}

const STOCK_BADGE = {
  ok:   { label: 'En stock',       bg: 'var(--color-success-muted)', text: 'var(--color-success)' },
  bajo: { label: 'Stock bajo',     bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
  sin:  { label: 'Sin stock',      bg: 'var(--color-danger-muted)',  text: 'var(--color-danger)'  },
}

function stockStatus(p) {
  if (p.stock_actual <= 0)             return 'sin'
  if (p.bajo_minimo || p.stock_actual <= p.stock_minimo) return 'bajo'
  return 'ok'
}

export default function CatalogoPage() {
  const { esAdmin, tienePermiso } = useAuth()
  const navigate  = useNavigate()
  const canWrite  = tienePermiso(2, 'escritura')

  const [state, dispatch]     = useReducer(reducer, initState)
  const [search, setSearch]   = useState('')
  const [filtroCat, setCat]   = useState('')
  const [filtroMar, setMar]   = useState('')
  const [modal, setModal]     = useState(null) // null | { type, data? }
  const [suggestions, setSugg]= useState([])
  const [showSugg, setShowSugg] = useState(false)
  const searchRef             = useRef(null)
  const debouncedSearch       = useDebounce(search, 250)

  const load = useCallback(async () => {
    dispatch({ type: 'REFRESH' })
    try {
      const [res, cats, mars] = await Promise.all([
        getProductos({ limit: 200, categoria: filtroCat || undefined, marca: filtroMar || undefined }),
        getCategorias(),
        getMarcas(),
      ])
      dispatch({ type: 'LOADED', payload: { productos: res.data, total: res.total, categorias: cats, marcas: mars } })
    } catch (err) {
      dispatch({ type: 'ERROR', error: err?.message ?? 'Error al cargar el catálogo.' })
    }
  }, [filtroCat, filtroMar])

  useEffect(() => { load() }, [load])

  // Predictive search suggestions
  useEffect(() => {
    if (debouncedSearch.trim().length < 1) { setSugg([]); return }
    buscarProductos(debouncedSearch).then(setSugg).catch(() => setSugg([]))
  }, [debouncedSearch])

  // Filter displayed products by search term
  const displayed = debouncedSearch.trim()
    ? state.productos.filter(p =>
        p.denominacion.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.codigo_interno.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : state.productos

  function selectSuggestion(p) {
    setSearch(p.denominacion)
    setSugg([])
    setShowSugg(false)
  }

  async function handleDelete(id, denominacion) {
    if (!window.confirm(`¿Dar de baja "${denominacion}"? Se puede reactivar desde el backend.`)) return
    try {
      await deleteProducto(id)
      toast.success('Producto dado de baja.')
      load()
    } catch (err) {
      toast.error(err?.message ?? 'Error al dar de baja.')
    }
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-snug)', margin: 0 }}>
            Catálogo
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
            {state.loading ? 'Cargando…' : `${state.total} producto${state.total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button id="btn-clasificaciones" onClick={() => setModal({ type: 'clasificaciones' })}
            style={btnSecondary}>
            <IconTag size={14} /> Categorías y marcas
          </button>
          {canWrite && (
            <>
              <button id="btn-actualizar-precios" onClick={() => setModal({ type: 'precios' })}
                style={btnSecondary}>
                <IconPercent size={14} /> Actualizar precios
              </button>
              <button id="btn-nuevo-producto" onClick={() => setModal({ type: 'producto', data: null })}
                style={btnPrimary}>
                <IconPlus size={14} /> Nuevo producto
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }}>
            <IconSearch size={14} />
          </span>
          <input
            id="catalogo-search"
            ref={searchRef}
            type="search"
            placeholder="Buscar por nombre o código…"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSugg(true) }}
            onFocus={() => setShowSugg(true)}
            onBlur={() => setTimeout(() => setShowSugg(false), 150)}
            style={{ ...inputBase, paddingLeft: '2rem', width: '100%' }}
          />
          {/* Suggestions dropdown */}
          {showSugg && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
              zIndex: 'var(--z-dropdown)', overflow: 'hidden',
            }}>
              {suggestions.map(p => (
                <button key={p.id_producto} onMouseDown={() => selectSuggestion(p)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-accent)', letterSpacing: '0.02em' }}>{p.codigo_interno}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.denominacion}</span>
                  <StockBadge status={stockStatus(p)} small />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category filter */}
        <select id="filtro-categoria" value={filtroCat} onChange={e => setCat(e.target.value)} style={{ ...inputBase, width: 'auto' }}>
          <option value="">Todas las categorías</option>
          {state.categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
        </select>

        {/* Brand filter */}
        <select id="filtro-marca" value={filtroMar} onChange={e => setMar(e.target.value)} style={{ ...inputBase, width: 'auto' }}>
          <option value="">Todas las marcas</option>
          {state.marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.nombre_marca}</option>)}
        </select>

        {(filtroCat || filtroMar || search) && (
          <button onClick={() => { setCat(''); setMar(''); setSearch('') }}
            style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Limpiar filtros ×
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {state.loading ? (
        <ProductGridSkeleton />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={load} />
      ) : displayed.length === 0 ? (
        <EmptyState search={search} canWrite={canWrite} onNew={() => setModal({ type: 'producto', data: null })} />
      ) : (
        <div style={gridStyle}>
          {displayed.map(p => (
            <ProductCard
              key={p.id_producto}
              producto={p}
              esAdmin={esAdmin}
              canWrite={canWrite}
              onEdit={() => setModal({ type: 'producto', data: p })}
              onDelete={() => handleDelete(p.id_producto, p.denominacion)}
              onLabel={() => navigate(`/catalogo/etiquetas?id=${p.id_producto}`)}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {modal?.type === 'producto' && (
        <ProductoFormModal
          producto={modal.data}
          categorias={state.categorias}
          marcas={state.marcas}
          esAdmin={esAdmin}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
      {modal?.type === 'clasificaciones' && (
        <ClasificacionesModal
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {modal?.type === 'precios' && (
        <ActualizarPreciosModal
          categorias={state.categorias}
          marcas={state.marcas}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

/* ── ProductCard ─────────────────────────────────────────────────────────── */
function ProductCard({ producto: p, esAdmin, canWrite, onEdit, onDelete, onLabel }) {
  const [hovered, setHover] = useState(false)
  const status = stockStatus(p)
  const badge  = STOCK_BADGE[status]

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background:    'var(--color-bg-surface)',
        border:        `1px solid ${hovered ? 'var(--color-border-default)' : 'var(--color-border-subtle)'}`,
        borderRadius:  'var(--radius-lg)',
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'column',
        boxShadow:     hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition:    `border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)`,
      }}
    >
      {/* Image area */}
      <div style={{ aspectRatio: '4/3', background: 'var(--color-bg-elevated)', position: 'relative', overflow: 'hidden' }}>
        {p.imagen_url ? (
          <img src={p.imagen_url} alt={p.denominacion}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBox size={32} color="var(--color-border-default)" />
          </div>
        )}
        {/* Stock badge overlay */}
        <span style={{
          position: 'absolute', top: 8, right: 8,
          background: badge.bg, color: badge.text,
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: 'var(--tracking-widest)',
          padding: '2px 7px', borderRadius: 'var(--radius-pill)', textTransform: 'uppercase',
        }}>
          {badge.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '0.875rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Category + brand chips */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {p.categoria && (
            <Chip label={p.categoria.nombre_categoria} />
          )}
          {p.marca && (
            <Chip label={p.marca.nombre_marca} accent />
          )}
        </div>

        {/* Name */}
        <p style={{
          fontSize: 'var(--text-sm)', fontWeight: 600,
          color: 'var(--color-text-primary)', lineHeight: 'var(--leading-snug)',
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          margin: 0,
        }}>
          {p.denominacion}
        </p>

        {/* Code */}
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
          color: 'var(--color-accent)', letterSpacing: '0.04em', margin: 0,
        }}>
          {p.codigo_interno}
        </p>

        {/* Stock info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
          <span>Stock: <strong style={{ color: status === 'sin' ? 'var(--color-danger)' : status === 'bajo' ? 'var(--color-warning)' : 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{p.stock_actual}</strong></span>
          <span>Mín: {p.stock_minimo}</span>
        </div>

        {/* Prices */}
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <PriceRow label="Minorista" value={formatPrecio(p.precio_minorista)} highlight />
          <PriceRow label="Mayorista" value={formatPrecio(p.precio_mayorista)} />
          {esAdmin && <PriceRow label="Costo" value={formatPrecio(p.precio_costo)} dim />}
        </div>
      </div>

      {/* Footer actions */}
      <div style={{
        display: 'flex', borderTop: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-elevated)',
      }}>
        <CardAction id={`label-${p.id_producto}`}  label="Etiqueta"  icon={<IconBarcode size={14} />} onClick={onLabel} />
        {canWrite && (
          <>
            <div style={{ width: 1, background: 'var(--color-border-subtle)' }} />
            <CardAction id={`edit-${p.id_producto}`}   label="Editar"    icon={<IconEdit size={14} />}    onClick={onEdit}   />
            <div style={{ width: 1, background: 'var(--color-border-subtle)' }} />
            <CardAction id={`delete-${p.id_producto}`} label="Dar de baja" icon={<IconTrash size={14} />} onClick={onDelete} danger />
          </>
        )}
      </div>
    </div>
  )
}

/* ── Shared small components ──────────────────────────────────────────────── */
export function StockBadge({ status, small }) {
  const b = STOCK_BADGE[status] ?? STOCK_BADGE.ok
  return (
    <span style={{
      background: b.bg, color: b.text,
      fontSize: small ? '0.6rem' : '0.65rem',
      fontWeight: 700, letterSpacing: 'var(--tracking-widest)',
      padding: small ? '1px 5px' : '2px 7px',
      borderRadius: 'var(--radius-pill)', textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {b.label}
    </span>
  )
}

function Chip({ label, accent }) {
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 600,
      color: accent ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
      background: accent ? 'var(--color-accent-subtle)' : 'var(--color-bg-overlay)',
      padding: '1px 6px', borderRadius: 'var(--radius-pill)',
      letterSpacing: 'var(--tracking-wide)',
    }}>
      {label}
    </span>
  )
}

function PriceRow({ label, value, highlight, dim }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
        fontSize: highlight ? '0.9375rem' : '0.8125rem',
        fontWeight: highlight ? 700 : 500,
        color: dim ? 'var(--color-text-tertiary)' : highlight ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      }}>
        {value}
      </span>
    </div>
  )
}

function CardAction({ id, label, icon, onClick, danger }) {
  const [h, setH] = useState(false)
  return (
    <button id={id} aria-label={label} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
        padding: '0.5rem', fontSize: '0.7rem', fontWeight: 500, border: 'none', cursor: 'pointer',
        background: h ? (danger ? 'var(--color-danger-muted)' : 'var(--color-bg-overlay)') : 'transparent',
        color: h ? (danger ? 'var(--color-danger)' : 'var(--color-text-primary)') : 'var(--color-text-tertiary)',
        transition: 'background var(--duration-fast), color var(--duration-fast)',
      }}
    >
      {icon} {label}
    </button>
  )
}

/* ── Skeleton / Empty / Error ─────────────────────────────────────────────── */
function ProductGridSkeleton() {
  return (
    <div style={gridStyle}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ aspectRatio: '4/3', background: 'var(--color-bg-elevated)' }} />
          <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[60, 100, 40].map((w, j) => (
              <div key={j} style={{ height: j === 1 ? 14 : 10, width: `${w}%`, background: 'var(--color-bg-elevated)', borderRadius: 4 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ search, canWrite, onNew }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '4rem 0', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border-default)' }}>
      <IconBox size={40} color="var(--color-text-tertiary)" />
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500, margin: 0 }}>
        {search ? `Sin resultados para "${search}"` : 'No hay productos en el catálogo'}
      </p>
      {!search && canWrite && (
        <button onClick={onNew} style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
          + Agregar el primer producto
        </button>
      )}
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '3rem 0' }}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>{message}</p>
      <button onClick={onRetry} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Reintentar</button>
    </div>
  )
}

/* ── Style constants ─────────────────────────────────────────────────────── */
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '1rem',
}

const inputBase = {
  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)',
  padding: '0.5rem 0.875rem', outline: 'none',
}

const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: '0.375rem',
  background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
  border: 'none', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem',
  fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
  letterSpacing: 'var(--tracking-wide)', boxShadow: '0 1px 6px hsl(183 72% 48% / 0.3)',
}

const btnSecondary = {
  display: 'flex', alignItems: 'center', gap: '0.375rem',
  background: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)',
  padding: '0.5rem 0.875rem', fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
}

/* ── Icons ────────────────────────────────────────────────────────────────── */
function IconPlus({ size = 16 })    { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconSearch({ size = 16 })  { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IconBox({ size = 16, color }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> }
function IconEdit({ size = 16 })    { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function IconTrash({ size = 16 })   { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> }
function IconBarcode({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M11 5v14"/></svg> }
function IconTag({ size = 16 })     { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> }
function IconPercent({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> }
