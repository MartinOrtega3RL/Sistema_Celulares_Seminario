import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { entorno } from './config/entorno.js'
import { conectar, sequelize } from './config/base-de-datos.js'
import './modelos/index.js'
import { manejarErrores, rutaNoEncontrada } from './http/middlewares/manejar-errores.js'
import { rutasAcceso } from './modulos/acceso/acceso.rutas.js'
import { rutasCatalogo } from './modulos/catalogo/catalogo.rutas.js'
import { rutasClientes } from './modulos/clientes/clientes.rutas.js'
import { crearRutasVentas } from './modulos/ventas/ventas.rutas.js'
import { verificarGenerador } from './modulos/ventas/comprobante/comprobante.puerto.js'
import { generadorHtml } from './modulos/ventas/comprobante/comprobante.html.js'

// Punto de armado. Es el unico lugar donde se elige una implementacion
// concreta; ningun modulo instancia sus propias dependencias.
const armarAplicacion = () => {
  const generadorComprobante = verificarGenerador(generadorHtml)

  const aplicacion = express()

  aplicacion.set('trust proxy', true)
  aplicacion.use(helmet())
  aplicacion.use(cors({ origin: entorno.ORIGEN_FRONTEND, credentials: true }))
  aplicacion.use(express.json({ limit: '1mb' }))

  aplicacion.get('/api/estado', async (_peticion, respuesta) => {
    await sequelize.query('SELECT 1')
    respuesta.json({ estado: 'ok', comprobante: generadorComprobante.formato })
  })

  aplicacion.use('/api/acceso', rutasAcceso)
  aplicacion.use('/api/catalogo', rutasCatalogo)
  aplicacion.use('/api/clientes', rutasClientes)
  aplicacion.use('/api/ventas', crearRutasVentas({ generadorComprobante }))

  aplicacion.use(rutaNoEncontrada)
  aplicacion.use(manejarErrores)

  return aplicacion
}

const arrancar = async () => {
  try {
    const version = await conectar()
    console.log(`Base de datos conectada: MySQL ${version} / ${entorno.DB_NAME}`)
  } catch (error) {
    console.error('\nNo se pudo conectar a la base de datos.')
    console.error(`  ${error.message}\n`)
    console.error('Revisar que el servicio MySQL este corriendo y que los datos del .env sean correctos.')
    console.error('El esquema lo crea gestion_comercial_ddl.sql: la aplicacion no lo crea.\n')
    process.exit(1)
  }

  armarAplicacion().listen(entorno.PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${entorno.PORT}`)
  })
}

const cerrarOrdenado = async (senal) => {
  console.log(`\n${senal} recibida, cerrando conexiones...`)
  await sequelize.close()
  process.exit(0)
}

process.on('SIGINT', () => cerrarOrdenado('SIGINT'))
process.on('SIGTERM', () => cerrarOrdenado('SIGTERM'))

arrancar()

export { armarAplicacion }
