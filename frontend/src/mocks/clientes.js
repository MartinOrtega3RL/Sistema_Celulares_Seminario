// src/mocks/clientes.js
// Forma exacta de: tabla `persona`, `tipo_cliente`, `cliente`

export const TIPOS_CLIENTE = [
  { id_tipo_cliente: 1, nombre_tipo: 'Minorista', lista_precio_aplicable: 'minorista' },
  { id_tipo_cliente: 2, nombre_tipo: 'Mayorista', lista_precio_aplicable: 'mayorista' },
]

export const CLIENTES = [
  {
    id_cliente:      1,
    id_persona:      10,
    id_tipo_cliente: 1,
    activo:          1,
    tipo_cliente:    TIPOS_CLIENTE[0],
    persona: {
      id_persona:         10,
      nombre:             'Diego',
      apellido:           'Fernández',
      tipo_documento:     'DNI',
      numero_documento:   '32.111.222',
      telefono_whatsapp:  '5493815100200',
      correo_electronico: 'diego.fern@gmail.com',
      domicilio:          'Laprida 456',
    },
  },
  {
    id_cliente:      2,
    id_persona:      11,
    id_tipo_cliente: 2,
    activo:          1,
    tipo_cliente:    TIPOS_CLIENTE[1],
    persona: {
      id_persona:         11,
      nombre:             'Accesorios',
      apellido:           'del Norte S.R.L.',
      tipo_documento:     'CUIT',
      numero_documento:   '30-71234567-1',
      telefono_whatsapp:  '5493814509090',
      correo_electronico: 'compras@accdelnorte.com',
      domicilio:          'Ruta 9 Km 12',
    },
  },
  {
    id_cliente:      3,
    id_persona:      12,
    id_tipo_cliente: 1,
    activo:          1,
    tipo_cliente:    TIPOS_CLIENTE[0],
    persona: {
      id_persona:         12,
      nombre:             'Valentina',
      apellido:           'Gómez',
      tipo_documento:     'DNI',
      numero_documento:   '38.900.100',
      telefono_whatsapp:  '5493815770011',
      correo_electronico: null,
      domicilio:          null,
    },
  },
]
