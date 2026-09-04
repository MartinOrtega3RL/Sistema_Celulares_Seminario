// src/services/clientesService.js
// Interfaz final — CRUD de clientes desde mocks.

import { CLIENTES as _base, TIPOS_CLIENTE } from '../mocks/clientes'

let _clientes = structuredClone(_base)
let _nextId   = _clientes.length + 1
let _nextPersonaId = 20

function _delay(ms = 250) { return new Promise(r => setTimeout(r, ms)) }

/** GET /api/clientes — con paginación y filtros */
export async function getClientes({ page = 1, limit = 20, q } = {}) {
  await _delay()
  let lista = _clientes.filter(c => c.activo)
  if (q) {
    const term = q.toLowerCase()
    lista = lista.filter(c =>
      `${c.persona.nombre} ${c.persona.apellido}`.toLowerCase().includes(term) ||
      c.persona.numero_documento?.toLowerCase().includes(term) ||
      c.persona.telefono_whatsapp?.includes(term),
    )
  }
  const total = lista.length
  const data  = lista.slice((page - 1) * limit, page * limit)
  return { data, total }
}

/** GET /api/clientes/buscar?q= */
export async function buscarClientes(q) {
  await _delay(150)
  if (!q || q.trim().length < 1) return []
  const term = q.toLowerCase()
  return _clientes
    .filter(c => c.activo && (
      `${c.persona.nombre} ${c.persona.apellido}`.toLowerCase().includes(term) ||
      c.persona.numero_documento?.toLowerCase().includes(term) ||
      c.persona.telefono_whatsapp?.includes(term)
    ))
    .slice(0, 8)
}

/** GET /api/tipos-cliente */
export async function getTiposCliente() {
  await _delay(100)
  return TIPOS_CLIENTE
}

/** POST /api/clientes */
export async function createCliente(data) {
  await _delay()
  const tipo = TIPOS_CLIENTE.find(t => t.id_tipo_cliente === Number(data.id_tipo_cliente))
  const persona = {
    id_persona:         _nextPersonaId++,
    nombre:             data.nombre,
    apellido:           data.apellido,
    tipo_documento:     data.tipo_documento ?? 'DNI',
    numero_documento:   data.numero_documento ?? null,
    telefono_whatsapp:  data.telefono_whatsapp ?? null,
    correo_electronico: data.correo_electronico ?? null,
    domicilio:          data.domicilio ?? null,
  }
  const nuevo = {
    id_cliente:      _nextId++,
    id_persona:      persona.id_persona,
    id_tipo_cliente: Number(data.id_tipo_cliente),
    activo:          1,
    tipo_cliente:    tipo ?? null,
    persona,
  }
  _clientes.push(nuevo)
  return nuevo
}

/** PUT /api/clientes/:id */
export async function updateCliente(id, data) {
  await _delay()
  const idx = _clientes.findIndex(c => c.id_cliente === id)
  if (idx < 0) throw { status: 404, message: 'Cliente no encontrado.' }
  const tipo = TIPOS_CLIENTE.find(t => t.id_tipo_cliente === Number(data.id_tipo_cliente))
  _clientes[idx] = {
    ..._clientes[idx],
    id_tipo_cliente: Number(data.id_tipo_cliente),
    tipo_cliente:    tipo ?? _clientes[idx].tipo_cliente,
    persona: { ..._clientes[idx].persona, ...data },
  }
  return _clientes[idx]
}

/** DELETE /api/clientes/:id — baja lógica */
export async function deleteCliente(id) {
  await _delay()
  const c = _clientes.find(c => c.id_cliente === id)
  if (!c) throw { status: 404, message: 'Cliente no encontrado.' }
  c.activo = 0
}
