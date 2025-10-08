import { describe, it, expect, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { AuthScreen } from '../AuthScreen.jsx'
import * as AuthContext from '@/context/AuthContext.jsx'
import { configureAxe } from 'jest-axe'

// Minimal axe integration with jsdom
const axe = configureAxe({
  rules: {
    region: { enabled: false } // skip some noisy rules for prototype
  }
})

beforeAll(() => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    login: vi.fn(),
    register: vi.fn(),
    error: null,
    isLoading: false
  })
})

describe('AuthScreen A11y', () => {
  it('não possui violações de acessibilidade críticas na renderização inicial', async () => {
    const { container } = render(<AuthScreen />)
    const results = await axe(container)
    expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0)
  })
})
