import { responderPlantilla, SIN_PLANTILLA } from './plantilla.js'

// Unico lugar del frontend que sabe de HTTP y de rutas del backend.
// Ningun componente llama a fetch por su cuenta.

const BASE = '/api'
const CLAVE_TOKEN = 'gringo.token'

// El token vive en sessionStorage y no en localStorage: cerrar el navegador
// termina la sesion, que es lo que corresponde a una PC de mostrador
// compartida entre turnos.
export const leerToken = () => {
  try {
    return sessionStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

export const guardarToken = (token) => {
  try {
    if (token) sessionStorage.setItem(CLAVE_TOKEN, token)
    else sessionStorage.removeItem(CLAVE_TOKEN)
  } catch {
    // Navegador con almacenamiento bloqueado: la sesion dura lo que la pestana.
  }
}

/** Error con el mensaje que el backend preparo para el usuario (RNF08). */
export class ErrorDeApi extends Error {
  constructor({ mensaje, codigo, detalles, estado }) {
    super(mensaje)
    this.name = 'ErrorDeApi'
    this.codigo = codigo
    this.detalles = detalles ?? []
    this.estado = estado
  }
}

const SIN_CONEXION = 'No se pudo contactar al servidor. Revisa que este encendido.'

const interpretar = async (respuesta) => {
  const tipo = respuesta.headers.get('content-type') ?? ''

  if (!tipo.includes('application/json')) {
    const texto = await respuesta.text()
    if (respuesta.ok) return texto
    throw new ErrorDeApi({ mensaje: texto || 'Ocurrio un problema.', estado: respuesta.status })
  }

  const cuerpo = await respuesta.json()
  if (respuesta.ok) return cuerpo

  throw new ErrorDeApi({ ...cuerpo.error, estado: respuesta.status })
}

const pedir = async (metodo, ruta, cuerpo) => {
  const token = leerToken()

  // ANDAMIO: si la ruta todavia no existe en el backend, responde la plantilla.
  // Solo ante RUTA_NO_ENCONTRADA y solo en desarrollo. Ver api/plantilla.js.
  const conAndamio = (error) => {
    if (error.codigo !== 'RUTA_NO_ENCONTRADA') throw error
    const plantilla = responderPlantilla(metodo, ruta, cuerpo)
    if (plantilla === SIN_PLANTILLA) throw error
    return plantilla
  }

  let respuesta
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers: {
        ...(cuerpo ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new ErrorDeApi({ mensaje: SIN_CONEXION, codigo: 'SIN_CONEXION', estado: 0 })
  }

  // Token vencido o sesion cerrada desde otro lado: se limpia para que la
  // aplicacion vuelva al ingreso en vez de reintentar contra un token muerto.
  if (respuesta.status === 401) guardarToken(null)

  try {
    return await interpretar(respuesta)
  } catch (error) {
    return conAndamio(error)
  }
}

/**
 * Envio de archivo (RF06.6, la imagen del producto). Va aparte de `pedir`
 * porque NO lleva content-type: el navegador tiene que ponerlo el solo con el
 * limite del multipart, y fijarlo a mano rompe el envio en silencio.
 */
const subir = async (ruta, formulario) => {
  const token = leerToken()

  let respuesta
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: formulario,
    })
  } catch {
    throw new ErrorDeApi({ mensaje: SIN_CONEXION, codigo: 'SIN_CONEXION', estado: 0 })
  }

  if (respuesta.status === 401) guardarToken(null)
  return interpretar(respuesta)
}

export const api = {
  obtener: (ruta) => pedir('GET', ruta),
  enviar: (ruta, cuerpo) => pedir('POST', ruta, cuerpo),
  modificar: (ruta, cuerpo) => pedir('PUT', ruta, cuerpo),
  borrar: (ruta) => pedir('DELETE', ruta),
  subir,
}

/** Arma una cadena de consulta salteando lo vacio, para no ensuciar la URL. */
export const consulta = (parametros) => {
  const partes = Object.entries(parametros)
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(valor)}`)

  return partes.length > 0 ? `?${partes.join('&')}` : ''
}
