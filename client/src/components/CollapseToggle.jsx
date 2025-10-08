import PropTypes from 'prop-types'
import { useCallback } from 'react'

export function CollapseToggle ({ collapsed, onToggle, labelCollapse, labelExpand, size, controls }) {
  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }, [onToggle])

  return (
    <button
      type="button"
      className="panel-collapse-btn"
      aria-expanded={!collapsed}
      aria-label={collapsed ? labelExpand : labelCollapse}
      aria-controls={controls}
      onClick={onToggle}
      onKeyDown={handleKey}
      data-size={size}
    >
      <span aria-hidden="true">{collapsed ? '+' : '−'}</span>
    </button>
  )
}

CollapseToggle.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  labelCollapse: PropTypes.string,
  labelExpand: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md']),
  controls: PropTypes.string
}

CollapseToggle.defaultProps = {
  labelCollapse: 'Recolher',
  labelExpand: 'Expandir',
  size: 'md',
  controls: undefined
}