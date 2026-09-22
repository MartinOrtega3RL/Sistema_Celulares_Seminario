import { Sequelize } from 'sequelize'
import { entorno } from './entorno.js'

// El esquema lo crea gestion_comercial_ddl.sql. Sequelize solo se mapea encima.
//
// NUNCA llamar a sequelize.sync(): no reproduce las restricciones CHECK, la
// columna generada bajo_minimo ni los indices FULLTEXT. Si se sincronizara,
// el esquema real dejaria de coincidir con el diagrama documentado en la carpeta.
export const sequelize = new Sequelize(
  entorno.DB_NAME,
  entorno.DB_USER,
  entorno.DB_PASSWORD,
  {
    host: entorno.DB_HOST,
    port: entorno.DB_PORT,
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: false,
      freezeTableName: true,
      underscored: false,
    },
    pool: {
      max: 10,
      min: 0,
      idle: 10_000,
      acquire: 30_000,
    },
    dialectOptions: {
      // Devolver DECIMAL como cadena y convertirlo a proposito, en vez de
      // dejar que el punto flotante redondee importes de dinero.
      decimalNumbers: false,
      dateStrings: false,
    },
  },
)

export const conectar = async () => {
  await sequelize.authenticate()
  const [[fila]] = await sequelize.query('SELECT VERSION() AS version')
  return fila.version
}
