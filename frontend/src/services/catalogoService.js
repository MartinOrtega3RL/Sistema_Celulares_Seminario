// src/services/catalogoService.js
// Interfaz final — lógica de catálogo desde mocks.
// Para producción: reemplazá las implementaciones por llamadas `api.get(...)`.

import {
  CATEGORIAS as _catsMock,
  MARCAS as _marcasMock,
  PRODUCTOS as _prodsMock,
} from '../mocks/catalogo'

// Estado mutable en memoria para el mock (simula DB en cliente)
let _productos  = structuredClone(_prodsMock)
let _categorias = structuredClone(_catsMock)
let _marcas     = structuredClone(_marcasMock)
let _nextId     = _productos.length + 1
let _nextPrefijo = _productos.length + 1   // para código interno GC-XXXX

const PREFIJO = 'GC'

function _pad(n) { return String(n).padStart(4, '0') }
function _delay(ms = 250) { return new Promise(r => setTimeout(r, ms)) }

// ── Categorías ──────────────────────────────────────────────────────────────

/** GET /api/categorias */
export async function getCategorias() {
  await _delay()
  return _categorias.filter(c => c.activo)
}

/** POST /api/categorias */
export async function createCategoria(data) {
  await _delay()
  const nueva = { id_categoria: _categorias.length + 1, activo: 1, ...data }
  _categorias.push(nueva)
  return nueva
}

/** PUT /api/categorias/:id */
export async function updateCategoria(id, data) {
  await _delay()
  const idx = _categorias.findIndex(c => c.id_categoria === id)
  if (idx < 0) throw { status: 404, message: 'Categoría no encontrada.' }
  _categorias[idx] = { ..._categorias[idx], ...data }
  return _categorias[idx]
}

/** DELETE /api/categorias/:id  — baja lógica */
export async function deleteCategoria(id) {
  await _delay()
  const cat = _categorias.find(c => c.id_categoria === id)
  if (!cat) throw { status: 404, message: 'Categoría no encontrada.' }
  cat.activo = 0
}

// ── Marcas ──────────────────────────────────────────────────────────────────

/** GET /api/marcas */
export async function getMarcas() {
  await _delay()
  return _marcas.filter(m => m.activo)
}

/** POST /api/marcas */
export async function createMarca(data) {
  await _delay()
  const nueva = { id_marca: _marcas.length + 1, activo: 1, ...data }
  _marcas.push(nueva)
  return nueva
}

/** PUT /api/marcas/:id */
export async function updateMarca(id, data) {
  await _delay()
  const idx = _marcas.findIndex(m => m.id_marca === id)
  if (idx < 0) throw { status: 404, message: 'Marca no encontrada.' }
  _marcas[idx] = { ..._marcas[idx], ...data }
  return _marcas[idx]
}

/** DELETE /api/marcas/:id */
export async function deleteMarca(id) {
  await _delay()
  const m = _marcas.find(m => m.id_marca === id)
  if (!m) throw { status: 404, message: 'Marca no encontrada.' }
  m.activo = 0
}

// ── Productos ────────────────────────────────────────────────────────────────

/** GET /api/productos  — con paginación y filtros */
export async function getProductos({ page = 1, limit = 20, categoria, marca, q } = {}) {
  await _delay()
  let lista = _productos.filter(p => p.activo)
  if (categoria) lista = lista.filter(p => p.id_categoria === Number(categoria))
  if (marca)     lista = lista.filter(p => p.id_marca     === Number(marca))
  if (q) {
    const term = q.toLowerCase()
    lista = lista.filter(p =>
      p.denominacion.toLowerCase().includes(term) ||
      p.codigo_interno.toLowerCase().includes(term) ||
      p.categoria?.nombre_categoria.toLowerCase().includes(term) ||
      p.marca?.nombre_marca.toLowerCase().includes(term),
    )
  }
  const total = lista.length
  const data  = lista.slice((page - 1) * limit, page * limit)
  return { data, total, page, limit }
}

/** GET /api/productos/buscar?q= — búsqueda predictiva (RF06.5) */
export async function buscarProductos(q) {
  await _delay(150)
  if (!q || q.trim().length < 1) return []
  const term = q.toLowerCase()
  return _productos
    .filter(p => p.activo && (
      p.denominacion.toLowerCase().includes(term) ||
      p.codigo_interno.toLowerCase().includes(term)
    ))
    .slice(0, 10)
}

/** POST /api/productos */
export async function createProducto(data) {
  await _delay()
  const codigo_interno = `${PREFIJO}-${_pad(_nextPrefijo++)}`
  const cat  = _categorias.find(c => c.id_categoria === Number(data.id_categoria))
  const marc = _marcas.find(m => m.id_marca === Number(data.id_marca))
  const nuevo = {
    id_producto: _nextId++,
    codigo_interno,
    imagen_url: null,
    activo: 1,
    stock_actual: 0,
    bajo_minimo: 0,
    version_registro: 1,
    ...data,
    id_categoria: Number(data.id_categoria),
    id_marca:     Number(data.id_marca),
    precio_costo:      Number(data.precio_costo),
    precio_minorista:  Number(data.precio_minorista),
    precio_mayorista:  Number(data.precio_mayorista),
    stock_minimo:      Number(data.stock_minimo ?? 0),
    categoria: cat ?? null,
    marca:     marc ?? null,
  }
  _productos.push(nuevo)
  return nuevo
}

/** PUT /api/productos/:id */
export async function updateProducto(id, data) {
  await _delay()
  const idx = _productos.findIndex(p => p.id_producto === id)
  if (idx < 0) throw { status: 404, message: 'Producto no encontrado.' }
  const cat  = _categorias.find(c => c.id_categoria === Number(data.id_categoria))
  const marc = _marcas.find(m => m.id_marca === Number(data.id_marca))
  _productos[idx] = {
    ..._productos[idx],
    ...data,
    version_registro: _productos[idx].version_registro + 1,
    categoria: cat ?? _productos[idx].categoria,
    marca:     marc ?? _productos[idx].marca,
  }
  return _productos[idx]
}

/** DELETE /api/productos/:id  — baja lógica */
export async function deleteProducto(id) {
  await _delay()
  const p = _productos.find(p => p.id_producto === id)
  if (!p) throw { status: 404, message: 'Producto no encontrado.' }
  p.activo = 0
}

/** PUT /api/productos/precios/masivo */
export async function actualizarPreciosMasivo({ porcentaje, id_categoria, id_marca }) {
  await _delay()
  const factor = 1 + Number(porcentaje) / 100
  _productos
    .filter(p => p.activo &&
      (!id_categoria || p.id_categoria === Number(id_categoria)) &&
      (!id_marca     || p.id_marca     === Number(id_marca)))
    .forEach(p => {
      p.precio_minorista = Math.round(p.precio_minorista * factor)
      p.precio_mayorista = Math.round(p.precio_mayorista * factor)
      p.precio_costo     = Math.round(p.precio_costo     * factor)
    })
}
