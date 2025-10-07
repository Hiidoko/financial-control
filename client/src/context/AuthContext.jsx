import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'

import { loginUser, registerUser, fetchCurrentUser } from '@/services/api.js'

const AuthContext = createContext(null)
const TOKEN_STORAGE_KEY = 'ffs:auth-token'

export function AuthProvider ({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(TOKEN_STORAGE_KEY)
  })
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(token))
  const [error, setError] = useState(null)

  const persistToken = useCallback((value) => {
    setToken(value)
    if (typeof window !== 'undefined') {
      if (value) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, value)
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      }
    }
  }, [])

  const refreshProfile = useCallback(async (overrideToken) => {
    const activeToken = overrideToken ?? token
    if (!activeToken) {
      setUser(null)
      return null
    }
    try {
      setIsLoading(true)
      const response = await fetchCurrentUser(activeToken)
      setUser(response.user)
      setError(null)
      return response.user
    } catch (err) {
      console.error('Falha ao obter perfil', err)
      persistToken(null)
      setUser(null)
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [token, persistToken])

  useEffect(() => {
    if (token) {
      refreshProfile(token)
    }
  }, [token, refreshProfile])

  const handleAuthSuccess = useCallback((response) => {
    persistToken(response.token)
    setUser(response.user)
    setError(null)
  }, [persistToken])

  const login = useCallback(async ({ email, password }) => {
    const result = await loginUser({ email, password })
    handleAuthSuccess(result)
    return result
  }, [handleAuthSuccess])

  const register = useCallback(async (payload) => {
    const result = await registerUser(payload)
    handleAuthSuccess(result)
    return result
  }, [handleAuthSuccess])

  const logout = useCallback(() => {
    persistToken(null)
    setUser(null)
  }, [persistToken])

  const value = {
    user,
    token,
    isPro: user?.role === 'pro',
    isLoading,
    error,
    login,
    register,
    logout,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node
}

export function useAuth () {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
