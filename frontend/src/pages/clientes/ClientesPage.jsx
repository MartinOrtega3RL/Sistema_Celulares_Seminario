/* src/pages/clientes/ClientesPage.jsx
 * RF13.4 — Listado de clientes con buscador instantáneo
 * RF13.5 — Distinción de categoría minorista / mayorista
 * RF13.6 — Acceso directo a WhatsApp (wa.me)
 * Estilizado en el sistema de diseño dark-first con tokens de Impeccable
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getClientes, deleteCliente } from '../../services/clientesService'
import { useAuth } from '../../contexts/AuthContext'
import ClienteFormModal from './ClienteFormModal'

export default function ClientesPage() {
  const navigate = useNavigate()
  const { tienePermiso } = useAuth()
  const canWrite = tienePermiso(3, 'escritura')

  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('TODOS') // 'TODOS' | 'MINORISTA' | 'MAYORISTA'
  const [modalCliente, setModalCliente] = useState(null) // null | clienteObj | { new: true }

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getClientes({ limit: 500, q: search })
      setClientes(res.data || [])
    } catch (err) {
      toast.error('Error al cargar la lista de clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search])

  const handleDelete = async (id, nombreCompleto) => {
    if (!window.confirm(`¿Dar de baja al cliente "${nombreCompleto}"?`)) return
    try {
      await deleteCliente(id)
      toast.success(`Cliente "${nombreCompleto}" dado de baja.`)
      loadData()
    } catch (err) {
      toast.error(err?.message ?? 'Error al eliminar cliente.')
    }
  }

  // Filtrado local
  const clientesFiltrados = clientes.filter(c => {
    if (filtroTipo === 'MINORISTA') return c.id_tipo_cliente === 1
    if (filtroTipo === 'MAYORISTA') return c.id_tipo_cliente === 2
    return true
  })

  const countMayoristas = clientes.filter(c => c.id_tipo_cliente === 2).length
  const countMinoristas = clientes.filter(c => c.id_tipo_cliente === 1).length

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header del Módulo */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)', margin: 0 }}>
            Directorio de Clientes
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            RF13.4, RF13.5 — Gestión de clientes minoristas/mayoristas y accesos directos de contacto
          </p>
        </div>

        {canWrite && (
          <button
            onClick={() => setModalCliente({ new: true })}
            style={{
              padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
              fontWeight: 700, fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)',
              transition: 'background var(--duration-fast) var(--ease-out)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}
          >
            <span>👤+ Nuevo Cliente</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        
        <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            👥
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>Total Registrados</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{clientes.length}</span>
          </div>
        </div>

        <button
          onClick={() => setFiltroTipo(filtroTipo === 'MINORISTA' ? 'TODOS' : 'MINORISTA')}
          style={{
            padding: '1.25rem', borderRadius: 'var(--radius-xl)', textAlign: 'left', cursor: 'pointer',
            background: filtroTipo === 'MINORISTA' ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
            border: `1px solid ${filtroTipo === 'MINORISTA' ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
            display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all var(--duration-fast)'
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-overlay)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            🛒
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>Clientes Minoristas</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{countMinoristas}</span>
          </div>
        </button>

        <button
          onClick={() => setFiltroTipo(filtroTipo === 'MAYORISTA' ? 'TODOS' : 'MAYORISTA')}
          style={{
            padding: '1.25rem', borderRadius: 'var(--radius-xl)', textAlign: 'left', cursor: 'pointer',
            background: filtroTipo === 'MAYORISTA' ? 'var(--color-success-muted)' : 'var(--color-bg-surface)',
            border: `1px solid ${filtroTipo === 'MAYORISTA' ? 'var(--color-success)' : 'var(--color-border-subtle)'}`,
            display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all var(--duration-fast)'
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-success-muted)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            🏬
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', display: 'block' }}>Clientes Mayoristas</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>{countMayoristas}</span>
          </div>
        </button>

      </div>

      {/* Main Surface Box */}
      <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        
        {/* Search Bar & Filter Header */}
        <div style={{ padding: '0.875rem 1.25rem', background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyBetween: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: 400 }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, documento o teléfono..."
              style={{
                width: '100%', height: 38, padding: '0 0.875rem', fontSize: 'var(--text-sm)',
                background: 'var(--color-bg-base)', border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {['TODOS', 'MINORISTA', 'MAYORISTA'].map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                style={{
                  padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer',
                  background: filtroTipo === t ? 'var(--color-accent)' : 'var(--color-bg-base)',
                  color: filtroTipo === t ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-default)'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Client Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando clientes...</div>
          ) : clientesFiltrados.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              No se encontraron clientes que coincidan con la búsqueda.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)' }}>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Cliente</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Documento</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Tipo Cliente (Precios)</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>WhatsApp / Contacto</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Domicilio</th>
                  <th style={{ padding: '0.875rem 1.25rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--color-text-primary)' }}>
                {clientesFiltrados.map(c => {
                  const nombreCompleto = `${c.persona?.nombre || ''} ${c.persona?.apellido || ''}`.trim()
                  const esMayorista = c.id_tipo_cliente === 2
                  const phone = c.persona?.telefono_whatsapp
                  const cleanPhone = phone ? phone.replace(/\D/g, '') : ''
                  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`}` : null

                  return (
                    <tr key={c.id_cliente} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background var(--duration-fast)' }}>
                      
                      {/* Name */}
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 'var(--radius-pill)',
                            background: esMayorista ? 'var(--color-success-muted)' : 'var(--color-bg-elevated)',
                            color: esMayorista ? 'var(--color-success)' : 'var(--color-accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.875rem', flexShrink: 0
                          }}>
                            {c.persona?.nombre?.[0] || 'C'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{nombreCompleto}</p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>ID #{c.id_cliente}</span>
                          </div>
                        </div>
                      </td>

                      {/* Document */}
                      <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        {c.persona?.tipo_documento}: {c.persona?.numero_documento || '—'}
                      </td>

                      {/* Retail / Wholesale Badge */}
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{
                          padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-pill)', fontSize: '0.65rem', fontWeight: 800,
                          background: esMayorista ? 'var(--color-success-muted)' : 'var(--color-bg-elevated)',
                          color: esMayorista ? 'var(--color-success)' : 'var(--color-text-secondary)',
                          border: `1px solid ${esMayorista ? 'hsl(148 40% 24%)' : 'var(--color-border-default)'}`
                        }}>
                          {esMayorista ? '🏬 Mayorista' : '🛒 Minorista'}
                        </span>
                      </td>

                      {/* WhatsApp (wa.me link RF13.6) */}
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                              padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-md)',
                              background: 'hsl(142 50% 12%)', color: 'hsl(142 70% 50%)',
                              border: '1px solid hsl(142 50% 22%)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none'
                            }}
                          >
                            <span>💬 {phone}</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>Sin WhatsApp</span>
                        )}
                      </td>

                      {/* Domicilio */}
                      <td style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                        {c.persona?.domicilio || '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.875rem 1.25rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                          <button
                            onClick={() => navigate(`/ventas/nueva?clienteId=${c.id_cliente}`)}
                            title="Registrar venta para este cliente"
                            style={{
                              padding: '0.375rem 0.625rem', borderRadius: 'var(--radius-md)',
                              background: 'var(--color-accent-subtle)', color: 'var(--color-accent)',
                              border: '1px solid hsl(183 40% 24%)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer'
                            }}
                          >
                            🛍️ Vender
                          </button>
                          
                          {canWrite && (
                            <>
                              <button
                                onClick={() => setModalCliente(c)}
                                title="Editar cliente"
                                style={{
                                  padding: '0.375rem 0.5rem', borderRadius: 'var(--radius-md)',
                                  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
                                  color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.75rem'
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(c.id_cliente, nombreCompleto)}
                                title="Dar de baja"
                                style={{
                                  padding: '0.375rem 0.5rem', borderRadius: 'var(--radius-md)',
                                  background: 'var(--color-danger-muted)', border: '1px solid hsl(4 60% 24%)',
                                  color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.75rem'
                                }}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Modal Alta / Edición */}
      {modalCliente && (
        <ClienteFormModal
          cliente={modalCliente.new ? null : modalCliente}
          onClose={() => setModalCliente(null)}
          onSaved={loadData}
        />
      )}

    </div>
  )
}
