import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'fc_panelState'

function loadState () {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) || {}
  } catch (_) {
    return {}
  }
}

function persistState (obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch (_) {
    /* ignore */
  }
}

/**
 * Hook para gerenciar estado persistente de colapso por painel.
 * @param {string} id identificador único do painel
 * @param {boolean} defaultCollapsed estado inicial caso não haja persistido
 */
export function usePanelCollapse (id, defaultCollapsed = false) {
  const [collapsed, setCollapsed] = useState(() => {
    const map = loadState()
    return Object.prototype.hasOwnProperty.call(map, id) ? !!map[id] : defaultCollapsed
  })
  // controla se o conteúdo deve permanecer montado (lazy unmount)
  const [shouldRender, setShouldRender] = useState(!collapsed)

  const toggle = useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  // persist whenever changes
  useEffect(() => {
    const map = loadState()
    map[id] = collapsed
    persistState(map)
  }, [collapsed, id])

  const contentId = `${id}-collapse-content`

  // quando expande, garante render imediato antes da animação
  useEffect(() => {
    if (!collapsed) setShouldRender(true)
  }, [collapsed])

  return { collapsed, toggle, contentId, shouldRender, onAnimationEnd: () => { if (collapsed) setShouldRender(false) } }
}

/**
 * Hook para animar height quando collapsed muda.
 * Retorna ref a ser atribuída ao container que será animado.
 */
export function useAnimatedCollapse (collapsed, onFinish) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // Remover transições temporariamente para ajuste inicial
    el.style.overflow = 'hidden'

    if (collapsed) {
      // Colapsar
      const h = el.scrollHeight
      if (h === 0) {
        el.style.height = '0px'
        return
      }
      el.style.height = h + 'px'
      // force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetHeight
      el.style.transition = 'height 0.24s ease'
      el.style.height = '0px'
    } else {
      // Expandir
      const target = el.scrollHeight
      el.style.height = '0px'
      // force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetHeight
      el.style.transition = 'height 0.24s ease'
      el.style.height = target + 'px'
      const handleEnd = (ev) => {
        if (ev.propertyName === 'height') {
          el.style.height = 'auto'
          el.removeEventListener('transitionend', handleEnd)
          if (typeof onFinish === 'function') onFinish()
        }
      }
      el.addEventListener('transitionend', handleEnd)
    }
    if (collapsed) {
      const handleEndCollapse = (ev) => {
        if (ev.propertyName === 'height') {
          el.removeEventListener('transitionend', handleEndCollapse)
          if (typeof onFinish === 'function') onFinish()
        }
      }
      el.addEventListener('transitionend', handleEndCollapse)
    }
  }, [collapsed])

  // Ajuste inicial (sem animação) após primeiro paint
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (collapsed) {
      el.style.height = '0px'
    } else {
      el.style.height = 'auto'
    }
  }, [])

  return ref
}
