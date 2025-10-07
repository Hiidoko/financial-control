import { useEffect, useState } from 'react'
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

const DEMO_CREDENTIALS = {
  email: 'demo.pro@financialfuture.dev',
  password: 'Pro!Demo2025'
}

const PLAN_COMPARISON = {
  basic: [
    'Simulações ilimitadas com presets certificados e exportação padrão (PDF/CSV).',
    'Dashboards com KPIs essenciais, metas individuais e linha do tempo automática.',
    'Suporte por email em horário comercial e segurança com criptografia AES-256.'
  ],
  pro: [
    'Comparativos ANBIMA avançados, testes de estresse e recomendações assistidas por IA.',
    'Integração Open Finance, metas colaborativas e relatórios com assinatura digital.',
    'Exportação avançada (Excel multi-aba, links criptografados) e suporte prioritário 24/7.'
  ]
}

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
  const [showProModal, setShowProModal] = useState(false)

  const handleChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDemoLogin = async () => {
    setSubmitError(null)
    setMode('login')
    setFormState((prev) => ({
      ...prev,
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
      role: 'pro'
    }))

    try {
      await login(DEMO_CREDENTIALS)
    } catch (err) {
      setSubmitError(err.message)
    }
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

  useEffect(() => {
    if (!showProModal) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowProModal(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showProModal])

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
          <button
            type="button"
            className="auth-nav-badge auth-nav-badge--button"
            onClick={() => setShowProModal(true)}
          >
            Nova versão Pro 2025
          </button>
          <button type="button" className="auth-nav-demo" onClick={handleDemoLogin}>
            Testar demo agora
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

      {showProModal && (
        <div className="pro-modal" role="dialog" aria-modal="true" aria-labelledby="proModalTitle">
          <div className="pro-modal__overlay" onClick={() => setShowProModal(false)} />
          <div className="pro-modal__content">
            <header className="pro-modal__header">
              <div>
                <span className="pro-modal__badge">Nova versão Pro 2025</span>
                <h2 id="proModalTitle">Comparativo de planos</h2>
              </div>
              <button type="button" className="pro-modal__close" onClick={() => setShowProModal(false)} aria-label="Fechar comparação">
                ✕
              </button>
            </header>

            <p className="pro-modal__intro">
              Descubra o que a experiência Pro adiciona ao simulador essencial. Recursos colaborativos, exportações avançadas e IA comportamental elevam seus planos ao próximo nível.
            </p>

            <div className="pro-modal__comparison">
              <article className="pro-modal__card pro-modal__card--basic">
                <header>
                  <span>Plano Essencial</span>
                  <strong>Tudo o que você precisa para começar</strong>
                </header>
                <ul>
                  {PLAN_COMPARISON.basic.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>

              <article className="pro-modal__card pro-modal__card--pro">
                <header>
                  <span>Plano Pro</span>
                  <strong>Experiência completa para estrategistas</strong>
                  <small>Inclui tudo do Essencial + benefícios exclusivos</small>
                </header>
                <ul>
                  {PLAN_COMPARISON.pro.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            </div>

            <footer className="pro-modal__footer">
              <button
                type="button"
                className="button-primary pro-modal__cta"
                onClick={() => {
                  setShowProModal(false)
                  handleDemoLogin()
                }}
              >
                Vivenciar versão Pro agora
              </button>
              <button
                type="button"
                className="button-ghost"
                onClick={() => {
                  setShowProModal(false)
                  if (mode === 'login') {
                    switchMode()
                  }
                }}
              >
                Criar conta básica gratuita
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
