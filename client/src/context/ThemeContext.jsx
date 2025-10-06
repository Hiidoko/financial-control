import PropTypes from 'prop-types'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  focusMode: false,
  toggleFocusMode: () => {}
})

const THEME_KEY = 'ffs:theme'
const FOCUS_KEY = 'ffs:focus-mode'

export function ThemeProvider ({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return window.localStorage.getItem(THEME_KEY) ?? 'dark'
  })

  const [focusMode, setFocusMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(FOCUS_KEY) === 'true'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-focus-mode', focusMode ? 'on' : 'off')
    window.localStorage.setItem(FOCUS_KEY, focusMode ? 'true' : 'false')
  }, [focusMode])

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    focusMode,
    toggleFocusMode: () => setFocusMode((prev) => !prev)
  }), [theme, focusMode])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

ThemeProvider.propTypes = {
  children: PropTypes.node
}

export function useThemeContext () {
  return useContext(ThemeContext)
}
