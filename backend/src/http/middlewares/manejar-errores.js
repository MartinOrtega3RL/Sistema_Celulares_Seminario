import { ZodError } from 'zod'
import {
  BaseError as ErrorSequelize,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  OptimisticLockError,
} from 'sequelize'
import { ErrorDeDominio, DatosInvalidos, ConflictoDeConcurrencia } from '../../errores.js'

// RNF08: mensajes comprensibles, sin exponer informacion tecnica interna.
// Todo lo que no sea un error de dominio previsto sale como un 500 generico,
// y el detalle queda en el registro del servidor, no en la respuesta.

const desdeZod = (error) => new DatosInvalidos(
  'Hay datos incompletos o mal cargados. Revisa el formulario.',
  error.issues.map((problema) => ({
    campo: problema.path.join('.'),
    mensaje: problema.message,
  })),
)

const desdeSequelize = (error) => {
  if (error instanceof OptimisticLockError) return new ConflictoDeConcurrencia()

  if (error instanceof UniqueConstraintError) {
    const campo = error.errors?.[0]?.path ?? 'uno de los datos'
    return new DatosInvalidos(`Ya existe un registro con ese valor en ${campo}.`)
  }

  if (error instanceof ForeignKeyConstraintError) {
    return new DatosInvalidos('El registro esta relacionado con otros y no se puede modificar o eliminar.')
  }

  return null
}

const normalizar = (error) => {
  if (error instanceof ErrorDeDominio) return error
  if (error instanceof ZodError) return desdeZod(error)
  if (error instanceof ErrorSequelize) return desdeSequelize(error)
  return null
}

// eslint-disable-next-line no-unused-vars -- Express reconoce el manejador de
// errores por su aridad de cuatro parametros; quitar `siguiente` lo rompe.
export const manejarErrores = (error, peticion, respuesta, siguiente) => {
  const conocido = normalizar(error)

  if (!conocido) {
    console.error(`[${peticion.method} ${peticion.originalUrl}]`, error)
    return respuesta.status(500).json({
      error: {
        codigo: 'ERROR_INTERNO',
        mensaje: 'Ocurrio un problema inesperado. Si se repite, avisa al administrador.',
      },
    })
  }

  return respuesta.status(conocido.estado).json({
    error: {
      codigo: conocido.codigo,
      mensaje: conocido.message,
      ...(conocido.detalles?.length ? { detalles: conocido.detalles } : {}),
    },
  })
}

// 404 de ruta inexistente. Va montado despues de todas las rutas.
export const rutaNoEncontrada = (peticion, respuesta) => respuesta.status(404).json({
  error: {
    codigo: 'RUTA_NO_ENCONTRADA',
    mensaje: `No existe la ruta ${peticion.method} ${peticion.originalUrl}.`,
  },
})
