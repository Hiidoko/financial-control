import { useState } from 'react'
import { format } from 'date-fns'

import { useAuth } from '@/context/AuthContext.jsx'

const DEFAULT_BIRTHDATE = '1995-01-01'

const HERO_FEATURES = [
  {
    title: 'Metas inteligentes',
    description: 'Algoritmos certificados sugerem aportes e prazos realistas com base no seu perfil.'
  },
  {
    title: 'Comparativos ANBIMA',
    description: 'Visualize cenários base, otimista e conservador com benchmark de mercado.'
  },
  {
    title: 'Open Finance integrado',
    description: 'Sincronize carteiras e mantenha seu fluxo de caixa atualizado automaticamente.'
  }
]

const HERO_METRICS = [
  { label: 'Planos simulados', value: '32 mil+' },
  { label: 'Metas atingidas', value: '87%' },
  { label: 'Tempo economizado', value: '12h / mês' }
]

export function AuthScreen () {
  const { login, register, error, isLoading } = useAuth()
  const [mode, setMode] = useState('login')
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    birthDate: DEFAULT_BIRTHDATE,
    householdMembers: 1,
    role: 'basic'
  })
  const [submitError, setSubmitError] = useState(null)

  const handleChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setSubmitError(null)
      if (mode === 'login') {
        await login({ email: formState.email, password: formState.password })
      } else {
        await register({
          name: formState.name,
          email: formState.email,
          password: formState.password,
          birthDate: formState.birthDate,
          householdMembers: Number(formState.householdMembers) || 1,
          role: formState.role
        })
      }
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
    setSubmitError(null)
  }

  return (
    <div className="auth-landing">
      <div className="auth-landing__gradient" aria-hidden="true" />

      <header className="auth-landing__nav">
        <div className="auth-brand">
          <span className="auth-brand__mark">FF</span>
          <div>
            <strong>Financial Future Simulator</strong>
            <span>Planejamento financeiro certificado</span>
          </div>
        </div>
        <div className="auth-nav-actions">
          <span className="auth-nav-badge">Nova versão Pro 2025</span>
          <button type="button" className="auth-nav-link" onClick={switchMode}>
            {mode === 'login' ? 'Criar conta agora' : 'Entrar com minha conta'}
          </button>
        </div>
      </header>

      <main className="auth-landing__grid">
        <section className="auth-hero">
          <span className="auth-hero__badge">Planejamento inteligente para a próxima década</span>
          <h1>Transforme sua vida financeira com simulações orientadas por dados</h1>
          <p>
            Monte planos confiáveis em minutos, compare cenários certificados pela ANBIMA e receba recomendações
            de IA para alcançar independência financeira com consistência.
          </p>

          <ul className="auth-hero__highlights">
            {HERO_FEATURES.map((feature) => (
              <li key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </li>
            ))}
          </ul>

          <div className="auth-hero__metrics">
            {HERO_METRICS.map((metric) => (
              <div key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="auth-signup panel">
          <div className="auth-signup__header">
            <span className="auth-signup__eyebrow">Acesso exclusivo</span>
            <h2>{mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta gratuita'}</h2>
            <p>
              {mode === 'login'
                ? 'Entre para continuar monitorando suas metas e explorar novos cenários.'
                : 'Cadastre-se em menos de 2 minutos e libere projeções avançadas, recomendações de especialistas e ferramentas colaborativas.'}
            </p>
          </div>

          <form className="auth-form stack-space" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label className="input-field">
                  <span className="input-label">Nome completo</span>
                  <input
                    type="text"
                    className="input-control"
                    value={formState.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    placeholder="Ana Marques"
                    required
                  />
                </label>
                <div className="form-grid">
                  <label className="input-field">
                    <span className="input-label">Data de nascimento</span>
                    <input
                      type="date"
                      className="input-control"
                      value={formState.birthDate}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(event) => handleChange('birthDate', event.target.value)}
                      required
                    />
                  </label>
                  <label className="input-field">
                    <span className="input-label">Pessoas na casa</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="input-control"
                      value={formState.householdMembers}
                      onChange={(event) => handleChange('householdMembers', event.target.value)}
                    />
                  </label>
                </div>
                <div className="plan-selector">
                  <button
                    type="button"
                    className={`plan-option ${formState.role === 'basic' ? 'plan-option--active' : ''}`}
                    onClick={() => handleChange('role', 'basic')}
                  >
                    <span>Plano Essencial</span>
                    <small>Acesso ao simulador, relatórios padrão e presets certificados.</small>
                  </button>
                  <button
                    type="button"
                    className={`plan-option ${formState.role === 'pro' ? 'plan-option--active' : ''}`}
                    onClick={() => handleChange('role', 'pro')}
                  >
                    <span>Plano Pro</span>
                    <small>Comparativos avançados, metas colaborativas e integração Open Finance.</small>
                  </button>
                </div>
              </>
            )}

            <label className="input-field">
              <span className="input-label">Email</span>
              <input
                type="email"
                className="input-control"
                value={formState.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="voce@empresa.com"
                required
              />
            </label>
            <label className="input-field">
              <span className="input-label">Senha</span>
              <input
                type="password"
                className="input-control"
                value={formState.password}
                onChange={(event) => handleChange('password', event.target.value)}
                minLength={8}
                placeholder="Mínimo de 8 caracteres"
                required
              />
            </label>

            {(submitError || error) && (
              <span className="text-danger">{submitError || error}</span>
            )}

            <button type="submit" className="button-primary" disabled={isLoading}>
              {mode === 'login' ? 'Entrar agora' : 'Criar minha conta'}
            </button>
          </form>

          <div className="auth-switch-mode">
            <span>{mode === 'login' ? 'Ainda não tem acesso?' : 'Já possui uma conta?'}</span>
            <button type="button" onClick={switchMode}>
              {mode === 'login' ? 'Comece gratuitamente' : 'Entrar com email e senha'}
            </button>
          </div>

          <div className="auth-signup__footnote">
            <span>Proteção de dados com criptografia AES-256 e autenticação em dois fatores opcional.</span>
          </div>
        </aside>
      </main>
    </div>
  )
}
