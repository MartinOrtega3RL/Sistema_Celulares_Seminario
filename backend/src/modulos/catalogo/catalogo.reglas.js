// Reglas del catalogo que se deciden sin consultar la base.

// RF04.2 — el precio de costo revela la rentabilidad del negocio y no se
// muestra a cualquiera.
//
// Los tres perfiles vienen precargados (H13) porque RF03, que los haria
// configurables, esta diferido. Cuando RF03 entre, esta lista se reemplaza
// por una bandera en la matriz de permisos y este archivo no cambia mas.
const PERFILES_CON_ACCESO_A_COSTOS = new Set(['Administrador'])

export const puedeVerCosto = (perfil) => PERFILES_CON_ACCESO_A_COSTOS.has(perfil)

const CAMPOS_SENSIBLES = ['precioCosto']

/**
 * Devuelve el producto tal como puede verlo ese perfil. Es lo unico que sale
 * hacia el controlador: asi el costo no se filtra por olvido en un endpoint.
 */
export const productoVisible = (producto, perfil) => {
  const plano = typeof producto?.get === 'function' ? producto.get({ plain: true }) : { ...producto }

  if (puedeVerCosto(perfil)) return plano

  for (const campo of CAMPOS_SENSIBLES) delete plano[campo]
  return plano
}

export const catalogoVisible = (productos, perfil) =>
  productos.map((producto) => productoVisible(producto, perfil))

/**
 * Prepara el texto para MATCH ... AGAINST en modo booleano. Los operadores
 * (+ - * " ~ < > ( )) se quitan: si el usuario escribe "funda -azul", la
 * consulta no debe interpretarlo como sintaxis.
 * El comodin final habilita la busqueda predictiva de RF16.2.
 */
export const prepararBusqueda = (texto) => {
  const limpio = String(texto ?? '')
    .replace(/[+\-*~<>()"@]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((palabra) => palabra.length > 0)

  if (limpio.length === 0) return null
  return limpio.map((palabra) => `+${palabra}*`).join(' ')
}
