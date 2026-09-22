import { Op } from 'sequelize'
import { sequelize } from '../../config/base-de-datos.js'
import { Producto, Categoria, Marca } from '../../modelos/index.js'
import { NoEncontrado } from '../../errores.js'
import { catalogoVisible, productoVisible, prepararBusqueda } from './catalogo.reglas.js'

const RELACIONES = [
  { model: Categoria, as: 'categoria', attributes: ['idCategoria', 'nombre'] },
  { model: Marca, as: 'marca', attributes: ['idMarca', 'nombre'] },
]

// RF06.5 / RNF02 — la busqueda por texto usa el indice FULLTEXT que ya define
// el DDL. Un LIKE '%...%' no puede aprovechar ningun indice y sobre 3.000
// articulos (S01) no entra en los dos segundos.
const MATCH_FULLTEXT = 'MATCH (denominacion, descripcion) AGAINST (:texto IN BOOLEAN MODE)'

const armarFiltro = ({ texto, idCategoria, idMarca, soloBajoMinimo }) => {
  const filtro = { activo: true }

  if (idCategoria) filtro.idCategoria = idCategoria
  if (idMarca) filtro.idMarca = idMarca
  if (soloBajoMinimo) filtro.bajoMinimo = true

  if (texto) {
    // El codigo interno se compara exacto: al tipearlo entero, el operador
    // espera ese producto y no una lista de parecidos (RF16.2).
    filtro[Op.or] = [
      { codigoInterno: texto },
      sequelize.literal(MATCH_FULLTEXT),
    ]
  }

  return filtro
}

/**
 * RF06.4 / RF06.5 — listado paginado del catalogo, con busqueda opcional.
 * Nunca devuelve el conjunto completo.
 */
export const listarProductos = async ({ texto, idCategoria, idMarca, soloBajoMinimo, limit, offset }, perfil) => {
  const busqueda = prepararBusqueda(texto)

  const resultado = await Producto.findAndCountAll({
    where: armarFiltro({ texto: busqueda ? texto : null, idCategoria, idMarca, soloBajoMinimo }),
    include: RELACIONES,
    replacements: busqueda ? { texto: busqueda } : undefined,
    order: [['denominacion', 'ASC']],
    limit,
    offset,
    // findAndCountAll con include necesita esto para no contar filas repetidas.
    distinct: true,
    subQuery: false,
  })

  return { count: resultado.count, rows: catalogoVisible(resultado.rows, perfil) }
}

export const buscarProducto = async (idProducto, perfil) => {
  const producto = await Producto.findOne({
    where: { idProducto, activo: true },
    include: RELACIONES,
  })
  if (!producto) throw new NoEncontrado('El producto')

  return productoVisible(producto, perfil)
}
