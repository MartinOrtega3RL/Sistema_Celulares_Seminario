// src/mocks/usuarios.js
// Forma exacta de: tabla `persona` + tabla `usuario` + tabla `perfil`
// El id_perfil 1=Admin, 2=Vendedor, 3=Técnico (precargados en datos.sql)

export const PERFILES = [
  { id_perfil: 1, nombre_perfil: 'Administrador', descripcion: 'Control total del sistema' },
  { id_perfil: 2, nombre_perfil: 'Vendedor',      descripcion: 'Punto de venta y catálogo' },
  { id_perfil: 3, nombre_perfil: 'Técnico',        descripcion: 'Órdenes de servicio técnico' },
]

export const PERSONAS_USUARIOS = [
  {
    id_persona: 1,
    nombre:     'Martín',
    apellido:   'Ortega',
    tipo_documento: 'DNI',
    numero_documento: '28.345.678',
    telefono_whatsapp: '5493815001122',
    correo_electronico: 'martin@gringocell.com',
    domicilio: 'Av. Independencia 1450',
  },
  {
    id_persona: 2,
    nombre:     'Laura',
    apellido:   'Britez',
    tipo_documento: 'DNI',
    numero_documento: '31.222.111',
    telefono_whatsapp: '5493815009900',
    correo_electronico: 'laura@gringocell.com',
    domicilio: 'Corrientes 890',
  },
  {
    id_persona: 3,
    nombre:     'Rodrigo',
    apellido:   'Rivero',
    tipo_documento: 'DNI',
    numero_documento: '33.777.444',
    telefono_whatsapp: '5493815008877',
    correo_electronico: 'rodrigo@gringocell.com',
    domicilio: 'Salta 320',
  },
]

export const USUARIOS = [
  {
    id_usuario:     1,
    id_persona:     1,
    id_perfil:      1,
    nombre_usuario: 'martin.admin',
    activo:         1,
    // contrasena_hash omitido en mocks; login siempre aprueba
    persona:        PERSONAS_USUARIOS[0],
    perfil:         PERFILES[0],
  },
  {
    id_usuario:     2,
    id_persona:     2,
    id_perfil:      2,
    nombre_usuario: 'laura.vendedora',
    activo:         1,
    persona:        PERSONAS_USUARIOS[1],
    perfil:         PERFILES[1],
  },
  {
    id_usuario:     3,
    id_persona:     3,
    id_perfil:      3,
    nombre_usuario: 'rodrigo.tecnico',
    activo:         1,
    persona:        PERSONAS_USUARIOS[2],
    perfil:         PERFILES[2],
  },
]

// Matriz de permisos: tabla `permiso` (permite_lectura / permite_escritura por módulo)
// Módulos: 1=Administración, 2=Catálogo, 3=Clientes, 4=Ventas, 5=Servicio Técnico, 6=Reportes
export const PERMISOS = {
  1: { // Administrador — todo habilitado
    1: { permite_lectura: 1, permite_escritura: 1 },
    2: { permite_lectura: 1, permite_escritura: 1 },
    3: { permite_lectura: 1, permite_escritura: 1 },
    4: { permite_lectura: 1, permite_escritura: 1 },
    5: { permite_lectura: 1, permite_escritura: 1 },
    6: { permite_lectura: 1, permite_escritura: 1 },
  },
  2: { // Vendedor
    1: { permite_lectura: 0, permite_escritura: 0 },
    2: { permite_lectura: 1, permite_escritura: 0 },
    3: { permite_lectura: 1, permite_escritura: 1 },
    4: { permite_lectura: 1, permite_escritura: 1 },
    5: { permite_lectura: 0, permite_escritura: 0 },
    6: { permite_lectura: 0, permite_escritura: 0 },
  },
  3: { // Técnico
    1: { permite_lectura: 0, permite_escritura: 0 },
    2: { permite_lectura: 1, permite_escritura: 0 },
    3: { permite_lectura: 1, permite_escritura: 0 },
    4: { permite_lectura: 0, permite_escritura: 0 },
    5: { permite_lectura: 1, permite_escritura: 1 },
    6: { permite_lectura: 0, permite_escritura: 0 },
  },
}
