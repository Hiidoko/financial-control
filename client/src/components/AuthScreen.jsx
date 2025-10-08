import { useEffect, useState, useId, useRef } from 'react'
import { format } from 'date-fns'
import { useAuth } from '@/context/AuthContext.jsx'

const DEFAULT_BIRTHDATE = '1995-01-01'

const HERO_FEATURES = [
  {
    icon: '📊',
    title: 'Simulações avançadas',
    description: 'Monte cenários realistas em minutos com baseline, otimista e estresse side‑by‑side.'
  },
  {
    icon: '🤖',
    title: 'Recomendações de IA',
    description: 'Insights acionáveis priorizados por impacto e explicados em linguagem simples.'
  },
  {
    icon: '🔒',
    title: 'Segurança Enterprise',
    description: 'Criptografia AES‑256, tokens rotativos e preparação para MFA e auditoria.'
  },
  {
    icon: '⚡',
    title: 'Exportação poderosa',
    description: 'PDF temático, Excel multi-aba, CSV e compartilhamento criptografado com expiração.'
  }
]

const HERO_METRICS = [
  { label: 'Planos simulados', value: '32k+' },
  { label: 'Taxa de conclusão', value: '87%' },
  { label: 'Tempo economizado', value: '12h/mês' }
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
  const [emailStatus, setEmailStatus] = useState('idle')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Fraca' })
  const emailCheckTimer = useRef(null)
  const formId = useId()

  const handleChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }))

    if (field === 'email' && mode === 'register') {
      if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current)
      setEmailStatus('idle')
      emailCheckTimer.current = setTimeout(() => {
        validateEmail(value)
      }, 450)
    }

    if (field === 'password') {
      evaluatePassword(value)
    }
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
    setEmailStatus('idle')
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

  function evaluatePassword (pwd) {
    if (!pwd) return setPasswordStrength({ score: 0, label: 'Fraca' })
    let score = 0
    const tests = [
      /.{8,}/.test(pwd),
      /[A-Z]/.test(pwd),
      /[a-z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd)
    ]
    score = tests.filter(Boolean).length
    const labels = ['Fraca', 'Fraca', 'Média', 'Boa', 'Forte', 'Excelente']
    setPasswordStrength({ score, label: labels[score] })
  }

  async function validateEmail (email) {
    if (!email || !/.+@.+\..+/.test(email)) {
      setEmailStatus(email ? 'invalid' : 'idle')
      return
    }
    try {
      setEmailStatus('checking')
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (data.exists) setEmailStatus('exists')
      else setEmailStatus('available')
    } catch {
      setEmailStatus('idle')
    }
  }

  return (
    <div className="auth-shell" aria-labelledby={`${formId}-title`}>
      <div className="auth-shell__bg" aria-hidden="true" />
      <header className="auth-header">
        <div className="auth-header__brand" aria-label="Identidade do produto">
          <span className="brand-mark" aria-hidden="true">FF</span>
          <div className="brand-text">
            <strong>Financial Future</strong>
            <span>Planejamento inteligente & seguro</span>
          </div>
        </div>
        <nav className="auth-header__nav" aria-label="Ações primárias">
          <button type="button" className="pill pill--outline" onClick={() => setShowProModal(true)}>Plano Pro 2025</button>
        </nav>
      </header>

      <main className="auth-layout" role="main">
        <section className="hero-pane">
          <div className="hero-pane__content">
            <span className="hero-badge">Nova geração de planejamento financeiro</span>
            <h1 id={`${formId}-title`}>Construa, compare e evolua sua estratégia com precisão</h1>
            <p className="hero-lead">
              Uma plataforma única para simular cenários certificados, antecipar riscos, receber recomendações
              de alto impacto e exportar relatórios profissionais em segundos.
            </p>
            <ul className="feature-grid" aria-label="Principais benefícios">
              {HERO_FEATURES.map(f => (
                <li key={f.title} className="feature-item">
                  <div className="feature-icon" aria-hidden="true">{f.icon}</div>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="metrics-bar" aria-label="Indicadores de confiança">
              {HERO_METRICS.map(m => (
                <div key={m.label} className="metric-box--hero">
                  <strong>{m.value}</strong>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="auth-pane" aria-label={mode === 'login' ? 'Formulário de acesso' : 'Formulário de criação de conta'}>
          <div className="auth-pane__inner auth-pane__inner--revamp">
            <div className="auth-tabs" role="tablist" aria-label="Alternar modo de autenticação">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={mode === 'login' ? 'is-active' : ''}
                onClick={() => { if (mode !== 'login') setMode('login') }}
              >Entrar</button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                className={mode === 'register' ? 'is-active' : ''}
                onClick={() => { if (mode !== 'register') setMode('register') }}
              >Criar conta</button>
              <div className="auth-tabs__glow" aria-hidden="true" />
            </div>

            <header className="auth-pane__header auth-pane__header--center">
              <h2 className="auth-title">{mode === 'login' ? 'Bem-vindo de volta' : 'Comece sua evolução financeira'}</h2>
              <p className="auth-subtext">
                {mode === 'login'
                  ? 'Acesse seu painel e continue de onde parou.'
                  : 'Crie uma conta gratuita e libere simulações avançadas, metas inteligentes e recomendações de IA.'}
              </p>
            </header>

            <div className="social-buttons" aria-label="Opções sociais (em breve)">
              <button type="button" className="social-btn revamp" onClick={() => alert('Integração Google em desenvolvimento')}>
                <span className="social-icon g" aria-hidden="true">G</span>
                <span>Google</span>
              </button>
              <button type="button" className="social-btn revamp" onClick={() => alert('Integração Microsoft em desenvolvimento')}>
                <span className="social-icon ms" aria-hidden="true">MS</span>
                <span>Microsoft</span>
              </button>
              <button type="button" className="social-btn revamp demo" onClick={handleDemoLogin}>
                <span className="social-icon demo" aria-hidden="true">⚡</span>
                <span>Entrar como Demo Pro</span>
              </button>
            </div>
            <div className="divider divider--sub"><span>Ou e-mail {mode === 'login' ? 'para acessar' : 'para criar sua conta'}</span></div>

            <form className="auth-form auth-form--revamp" onSubmit={handleSubmit} noValidate>
              {mode === 'register' && (
                <>
                  <label className="input-field span-2">
                    <span className="input-label">Nome completo</span>
                    <input
                      type="text"
                      className="input-control"
                      value={formState.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Ana Marques"
                      required
                    />
                  </label>
                  <label className="input-field">
                    <span className="input-label">Nascimento</span>
                    <input
                      type="date"
                      className="input-control"
                      value={formState.birthDate}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => handleChange('birthDate', e.target.value)}
                      required
                    />
                  </label>
                  <label className="input-field">
                    <span className="input-label">Pessoas no lar</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="input-control"
                      value={formState.householdMembers}
                      onChange={(e) => handleChange('householdMembers', e.target.value)}
                    />
                  </label>
                  <div className="plan-select span-2" role="radiogroup" aria-label="Selecione o plano">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={formState.role === 'basic'}
                      className={`plan-pill ${formState.role === 'basic' ? 'is-active' : ''}`}
                      onClick={() => handleChange('role', 'basic')}
                    >Essencial</button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={formState.role === 'pro'}
                      className={`plan-pill ${formState.role === 'pro' ? 'is-active' : ''}`}
                      onClick={() => handleChange('role', 'pro')}
                    >Pro</button>
                    <small className="plan-hint" aria-live="polite">{formState.role === 'pro' ? 'Inclui comparativos, IA avançada e exportações premium.' : 'Você pode evoluir para Pro depois.'}</small>
                  </div>
                </>
              )}

              <label className="input-field span-2">
                <span className="input-label">Email</span>
                <input
                  type="email"
                  className="input-control"
                  value={formState.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="voce@empresa.com"
                  required
                />
                {mode === 'register' && <EmailStatus status={emailStatus} />}
              </label>

              <label className="input-field span-2">
                <span className="input-label">Senha</span>
                <div className="password-wrapper">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    className="input-control password-input"
                    value={formState.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    aria-describedby={`${formId}-pwd-strength`}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setPasswordVisible(v => !v)}
                  >
                    {passwordVisible ? '🙈' : '👁️'}
                  </button>
                </div>
                {mode === 'register' && (
                  <div
                    id={`${formId}-pwd-strength`}
                    className={`pwd-strength pwd-strength--${passwordStrength.score}`}
                    aria-live="polite"
                  >
                    Força: {passwordStrength.label}
                    <span className="pwd-bar" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i key={i} className={i < passwordStrength.score ? 'on' : ''} />
                      ))}
                    </span>
                  </div>
                )}
              </label>

              {(submitError || error) && (
                <div className="form-error span-2" role="alert">{submitError || error}</div>
              )}

              <button type="submit" className="button-primary auth-submit span-2" disabled={isLoading}>
                {isLoading ? 'Processando...' : mode === 'login' ? 'Entrar agora' : 'Criar minha conta'}
              </button>
            </form>

            <div className="auth-extra">
              <button type="button" onClick={switchMode} className="link-inline">
                {mode === 'login' ? 'Criar conta gratuita' : 'Já tenho conta – entrar'}
              </button>
              <span className="sep">•</span>
              <button type="button" className="link-inline" onClick={handleDemoLogin}>Usar conta demo Pro</button>
            </div>
            <div className="auth-footnote">Criptografia AES‑256 • Tokens rotativos • Roadmap: MFA & auditoria</div>
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

            {/* CTAs removidos do comparativo de planos por solicitação */}
          </div>
        </div>
      )}
    </div>
  )
}

function EmailStatus ({ status }) {
  if (status === 'idle') return null
  const map = {
    checking: { text: 'Verificando email...', className: 'status status--checking' },
    exists: { text: 'Email já cadastrado', className: 'status status--error' },
    available: { text: 'Email disponível', className: 'status status--ok' },
    invalid: { text: 'Formato de email inválido', className: 'status status--error' }
  }
  const cfg = map[status]
  return <div className={cfg.className} role={status === 'exists' ? 'alert' : undefined}>{cfg.text}</div>
}
