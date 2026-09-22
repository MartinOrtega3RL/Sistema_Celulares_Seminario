// Personas y registros no son productos: no van en paneles pintados sino en
// renglones. Renglon, no celda: sin bordes verticales y con aire, porque una
// grilla de celdas con lineas en los dos ejes es la planilla que el titular
// descarto (H16). El orden lo dan la tipografia y el espacio, no las rayas.

export const Listado = ({ children, className = '' }) => (
  <ul className={`border-2 border-black bg-azul-hondo ${className}`}>{children}</ul>
)

/**
 * Un renglon. `alAbrir` lo vuelve interactivo entero; `acciones` va a la
 * derecha y no se traga el clic del renglon.
 */
export const Fila = ({ principal, secundario, derecha, acciones, alAbrir, atenuado = false }) => {
  const Contenido = (
    <>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-semibold ${atenuado ? 'text-crema/45' : 'text-crema'}`}>
          {principal}
        </span>
        {secundario && (
          <span className="mt-0.5 block truncate text-xs text-crema/55">{secundario}</span>
        )}
      </span>
      {derecha && <span className="shrink-0 text-right">{derecha}</span>}
    </>
  )

  return (
    <li className="group flex items-center gap-3 border-b-2 border-crema/10 px-4 py-3 last:border-b-0">
      {/* El filo izquierdo se pinta al pasar por encima: marca el renglon
          activo sin cambiarle el color al texto. */}
      <span
        aria-hidden="true"
        className="-ms-4 h-10 w-1 shrink-0 bg-transparent transition-colors group-hover:bg-escarlata"
      />

      {alAbrir ? (
        <button
          type="button"
          onClick={alAbrir}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {Contenido}
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-3">{Contenido}</span>
      )}

      {acciones && <span className="flex shrink-0 items-center gap-1">{acciones}</span>}
    </li>
  )
}

/** Boton chico de accion dentro de un renglon. */
export const AccionFila = ({ etiqueta, peligrosa = false, children, ...resto }) => (
  <button
    type="button"
    {...resto}
    title={etiqueta}
    aria-label={etiqueta}
    className={`grid size-8 place-items-center border-2 border-transparent text-crema/45 hover:border-crema/25 ${
      peligrosa ? 'hover:text-escarlata' : 'hover:text-crema'
    } disabled:opacity-30`}
  >
    {children}
  </button>
)

/** Etiqueta de estado. Marca, no color: lleva texto y borde, no un punto. */
export const Marca = ({ children, tono = 'neutro' }) => (
  <span
    className={`inline-block border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
      tono === 'alerta'
        ? 'border-escarlata bg-escarlata/20 text-crema'
        : tono === 'destacado'
          ? 'border-ambar bg-ambar/15 text-ambar'
          : 'border-crema/30 text-crema/65'
    }`}
  >
    {children}
  </span>
)
