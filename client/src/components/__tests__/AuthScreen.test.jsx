import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { AuthScreen } from '../AuthScreen.jsx'

// Mock AuthContext
import * as AuthContext from '@/context/AuthContext.jsx'

beforeAll(() => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    login: vi.fn(),
    register: vi.fn(),
    error: null,
    isLoading: false
  })
})

describe('AuthScreen', () => {
  it('renderiza hero e formulário', () => {
    const { container } = render(<AuthScreen />)
    expect(screen.getByRole('heading', { name: /construa, compare/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /entrar agora/i })).toBeTruthy()
    expect(container).toMatchSnapshot()
  })
})
