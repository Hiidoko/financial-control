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
  } catch (_) {}
}

export function usePanelCollapse (id, defaultCollapsed = false) {
  const [collapsed, setCollapsed] = useState(() => {
    const map = loadState()
    return Object.prototype.hasOwnProperty.call(map, id) ? !!map[id] : defaultCollapsed
  })
  const [shouldRender, setShouldRender] = useState(!collapsed)

  const toggle = useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  useEffect(() => {
    const map = loadState()
    map[id] = collapsed
    persistState(map)
  }, [collapsed, id])

  const contentId = `${id}-collapse-content`

  useEffect(() => {
    if (!collapsed) setShouldRender(true)
  }, [collapsed])

  return { collapsed, toggle, contentId, shouldRender, onAnimationEnd: () => { if (collapsed) setShouldRender(false) } }
}

export function useAnimatedCollapse (collapsed, onFinish) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.overflow = 'hidden'

    if (collapsed) {
      const h = el.scrollHeight
      if (h === 0) {
        el.style.height = '0px'
        return
      }
      el.style.height = h + 'px'
      el.offsetHeight
      el.style.transition = 'height 0.24s ease'
      el.style.height = '0px'
    } else {
      const target = el.scrollHeight
      el.style.height = '0px'
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
