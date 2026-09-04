// src/contexts/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useReducer } from 'react'
import { getMe, login as svcLogin, logout as svcLogout } from '../services/authService'

// ── State ─────────────────────────────────────────────────────────────────
const initialState = {
  usuario:  null,
  permisos: {},
  token:    null,
  status:   'loading', // 'loading' | 'authenticated' | 'unauthenticated'
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATED':
      return { ...state, ...action.payload, status: 'authenticated' }
    case 'UNAUTHENTICATED':
      return { ...initialState, status: 'unauthenticated' }
    case 'LOGOUT':
      return { ...initialState, status: 'unauthenticated' }
    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Rehidratar sesión al montar (GET /api/auth/me)
  useEffect(() => {
    getMe()
      .then(({ usuario, permisos, token }) =>
        dispatch({ type: 'HYDRATED', payload: { usuario, permisos, token } }),
      )
      .catch(() => dispatch({ type: 'UNAUTHENTICATED' }))
  }, [])

  const login = useCallback(async (credenciales) => {
    const { usuario, permisos, token } = await svcLogin(credenciales)
    dispatch({ type: 'HYDRATED', payload: { usuario, permisos, token } })
  }, [])

  const logout = useCallback(async () => {
    await svcLogout()
    dispatch({ type: 'LOGOUT' })
  }, [])

  /**
   * Comprueba si el usuario tiene acceso a un módulo.
   * @param {number} idModulo  — 1 Admin, 2 Catálogo, 3 Clientes, 4 Ventas, 5 ST, 6 Reportes
   * @param {'lectura'|'escritura'} tipo
   */
  const tienePermiso = useCallback(
    (idModulo, tipo = 'lectura') => {
      const p = state.permisos?.[idModulo]
      if (!p) return false
      return tipo === 'escritura' ? !!p.permite_escritura : !!p.permite_lectura
    },
    [state.permisos],
  )

  const esPerfil = useCallback(
    (nombrePerfil) => state.usuario?.perfil?.nombre_perfil === nombrePerfil,
    [state.usuario],
  )

  const value = {
    ...state,
    login,
    logout,
    tienePermiso,
    esPerfil,
    esAdmin:    esPerfil('Administrador'),
    isLoading:  state.status === 'loading',
    isAuth:     state.status === 'authenticated',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
