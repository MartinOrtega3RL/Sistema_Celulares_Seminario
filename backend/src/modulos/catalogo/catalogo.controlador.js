import { z } from 'zod'
import { leerPaginacion, responderPaginado } from '../../http/paginacion.js'
import { listarProductos, buscarProducto } from './catalogo.servicio.js'

const esquemaFiltros = z.object({
  texto: z.string().trim().min(1).max(80).optional(),
  idCategoria: z.coerce.number().int().positive().optional(),
  idMarca: z.coerce.number().int().positive().optional(),
  soloBajoMinimo: z.coerce.boolean().optional(),
})

export const listar = async (peticion, respuesta) => {
  const paginacion = leerPaginacion(peticion.query)
  const filtros = esquemaFiltros.parse(peticion.query)

  const resultado = await listarProductos(
    { ...filtros, limit: paginacion.limit, offset: paginacion.offset },
    peticion.usuario.perfil,
  )

  return respuesta.json(responderPaginado(resultado, paginacion))
}

export const detalle = async (peticion, respuesta) => {
  const idProducto = z.coerce.number().int().positive().parse(peticion.params.idProducto)
  const producto = await buscarProducto(idProducto, peticion.usuario.perfil)

  return respuesta.json({ datos: producto })
}
