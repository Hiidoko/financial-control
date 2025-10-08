# Financial Future Simulator

> 🚧 **Projeto em construção ativo.** As features, APIs e políticas de segurança ainda estão em evolução — avalie com cuidado antes de utilizar em produção.
>
> ⚠️ **Estado atual:** estamos iterando e estudando novas abordagens. É esperado encontrar falhas visuais provisórias, fluxos incompletos e ajustes funcionais pendentes enquanto validamos hipóteses.

Aplicação full-stack JavaScript que combina planejamento financeiro avançado, recomendações assistidas por IA e experiências colaborativas. A proposta é oferecer uma jornada completa: da prospecção (landing/login) à simulação de cenários, passando por exportações seguras e insights Pro. O foco está em UX polida, acessibilidade desde o início e arquitetura modular pronta para escalar.

## 🌐 Idiomas

- **Português (Brasil)** *(documentação principal)*
- English *(coming soon)*

## 🔗 Demo & Visuals

- **Status:** desenvolvimento local (`npm run dev`), publicação pública em planejamento
- **Preview recomendada:** a nova tela de onboarding/login estilo landing page, com highlights, métricas e seleção de planos

## 🚀 Stack Principal

- **Frontend:** Vite + React 18, Context API, TensorFlow.js (recomendação comportamental), Chart.js, html2canvas + jsPDF, XLSX
- **Backend:** Node.js 20+, Express 4, Mongoose 8, JWT, bcryptjs, Zod para validação declarativa
- **Infra & DX:** Concurrently para orquestração full-stack, nodemon, dotenv, ES Modules first
- **Estilo & UI:** Design system próprio com CSS variables, glassmorphism e gradientes inspirados no ecossistema Tailwind
- **Qualidade:** ESLint (Standard), Vitest (servidor – provisionado), scripts de build integrados

## 🌟 Visão Geral

| Cenário | Como entregamos |
| ------- | --------------- |
| **Planejamento guiado** | Wizard de simulação com múltiplas metas, sliders de eventos extremos e painéis de KPIs dinâmicos. |
| **Recomendações inteligentes** | Modelo TensorFlow.js classifica hábitos (poupar, aportar, otimizar) e gera racional customizado. |
| **Colaboração & Pro** | Metas compartilhadas, presets certificados ANBIMA, relatórios comparativos e snapshot Open Finance. |
| **Compartilhamento seguro** | Exportação para PDF, CSV, Excel e link criptografado (AES-GCM + PBKDF2) protegido por senha. |
| **Autenticação moderna** | Landing/login responsivo com storytelling, métricas e seleção de planos Basic/Pro. |

## ✨ Destaques da Experiência

- **Dashboard vivo:** patrimônio projetado, comparativo baseline/otimista/pessimista, testes de estresse e histórico de simulações.
- **Gestão de metas:** priorização, adoção de recomendações automáticas, timeline completa e integrações de calendário (ICS + Google Calendar).
- **Export & share:** PDF estilizado, planilhas Excel com múltiplas abas (timeline, metas, cenários) e timeline CSV.
- **Suite Pro:** relatório comparativo ANBIMA, planejamento colaborativo com divisão sugerida de aportes e snapshot Open Finance.
- **Focus & Theme:** toggle de dark/light, modo foco sem distrações e tour interativo com Joyride.

## 🧭 Arquitetura em Camadas

| Camada | Descrição |
| ------ | --------- |
| **Interface (client/src)** | React + Context para auth e tema, hooks customizados (`useFinancialSimulation`) e componentes modulares (widget board, timeline, export menu). |
| **Serviços (client/src/services)** | Wrapper `fetch` tipado com fallback de mensagens, suporte a credenciais e token JWT. |
| **ML & utilitários** | TensorFlow carregado sob demanda, datasets sintéticos e pipeline de explicabilidade por regra. Exportadores encapsulam PDF/CSV/XLSX/ICS e criptografia Web Crypto. |
| **API (server/src)** | Express com middlewares globais, rotas `/api/*`, autenticação JWT, orquestração de simulações e endpoints Pro/colaborativos.
| **Persistência** | Mongoose modela usuários, presets e históricos (configuração do `MONGODB_URI` requerida).

### UI & Identidade Visual

- Layout responsivo inspirado em Tailwind: gradientes radiais, glass cards e tipografia Inter.
- Landing/login híbrido (hero + formulário) com badges, métricas e storytelling.
- Widgets reordenáveis, badges temáticos e modo foco para apresentações.
- Tokens CSS centralizados em `global.css`, com suporte a tema claro/escuro e preferências de foco.

### Inteligência & Recomendações

- Modelo leve (três camadas densas) cria clusters comportamentais.
- Regras adicionam explicações transparentes (sinais de poupança, gastos e progresso de metas).
- Componentização permite trocar o modelo por APIs externas ou pipelines mais robustos.

### Segurança & Compartilhamento

- Links protegidos via AES-256 GCM + PBKDF2 (120k iterações) e salt/IV randomizados.
- Tokens de auth persistidos em localStorage com provider central.
- CORS, compressão e JWT prontos para endurecimento adicional.

## � Estrutura de Pastas

```
client/
	src/
		components/     # Painéis, widgets, landing/login, formulários
		context/         # Auth e tema
		hooks/           # useFinancialSimulation, etc.
		ml/              # Modelo TensorFlow.js
		services/        # camadas de API (fetch)
		utils/           # exportadores, formatadores, criptografia
	styles/global.css  # design system e temas
server/
	src/
		index.js         # bootstrap Express + Mongo
		routes/          # rotas públicas e Pro
		controllers/     # regras de simulação e auth
		models/          # mongoose schemas
		middlewares/     # auth, erros, logging
	package.json       # scripts de dev/test/lint
```

## � Começando Localmente

Pré-requisito: [Node.js 18 ou superior](https://nodejs.org/)

```bash
# instalar dependências do monorepo
npm install
npm install --prefix server
npm install --prefix client

# copiar variáveis de ambiente
cp .env.example .env            # ajuste conforme necessário
cp server/.env.example server/.env

# subir client + server juntos
npm run dev

# acessos padrão
# Frontend: http://localhost:5173 (ajusta para 5174 se a porta estiver em uso)
# API:      http://localhost:4000 (fallback automático para 4001)
```

### Build de Produção

```bash
npm run build --prefix client
```

Os artefatos agora (padrão atualizado) são emitidos em `server/public` para facilitar deploy integrado (um único serviço Node servindo API + frontend).

Se você já tinha um fluxo antigo usando `client/dist`, ele ainda é suportado: o servidor procura em `CLIENT_DIST_PATH`, depois `server/public`, depois `client/dist`.

### Deploy (evitando "Cannot GET /")

1. Gere o build: `npm run build`
2. Inicie o servidor em modo produção: `npm run serve` (ou `npm run build:and:start` para ambos)
3. Garanta que a plataforma (Render, Railway, Fly, etc.) execute o comando `npm run build:and:start`
4. Se usar build separado (CI):
	- Passo de build: `npm run build`
	- Passo de start: `npm run serve`

Se ainda obtiver `Cannot GET /`:
 - Verifique logs: deve aparecer `[Static] Servindo client de: ...`
 - Confirme existência de `index.html` em um dos diretórios esperados.
 - Defina explicitamente `CLIENT_DIST_PATH` apontando para a pasta do bundle se o layout for personalizado.
 - Confirme que nenhuma regra de rewrite da plataforma está interceptando `/` antes do Node.

Resposta de fallback quando o build está ausente agora é: `API online. Build do frontend ausente. Rode: npm run build` — indicando claramente o problema.

## 🔧 Variáveis de Ambiente

- `MONGODB_URI` – string de conexão (MongoDB Atlas/local). Sem ela, os recursos persistentes ficam indisponíveis.
- `JWT_SECRET` – chave para geração/validação de tokens.
- `VITE_API_BASE_URL` – URL base usada pelo front (default `''`, assume mesmo host).

Consulte `.env.example` e `server/.env.example` para mais detalhes.

## 🧪 Scripts Importantes

| Contexto | Script | Descrição |
| -------- | ------ | --------- |
| monorepo | `npm run dev` | Orquestra cliente + servidor com concurrently. |
| client   | `npm run dev` | Vite com HMR. |
|          | `npm run build` | Build minificado do front. |
|          | `npm run preview` | Preview do bundle. |
| server   | `npm run dev` | Nodemon + Express. |
|          | `npm start` | Servidor em modo produção. |
|          | `npm run lint` | ESLint (Standard). |
|          | `npm test` | Vitest (placeholder preparado). |

## 📡 Endpoints Essenciais

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| POST | `/api/auth/register` | Cria usuário (Basic ou Pro). |
| POST | `/api/auth/login` | Autentica e retorna JWT. |
| GET  | `/api/auth/me` | Perfil autenticado. |
| POST | `/api/simulations` | Roda a simulação financeira com payload completo. |
| GET  | `/api/presets` | Lista presets certificados. |
| POST | `/api/pro/reports/comparative` | Gera relatório comparativo (Pro). |
| POST | `/api/pro/goals/collaborative` | Calcula plano colaborativo (Pro). |
| GET  | `/api/pro/open-finance/snapshot` | Snapshot de contas (Pro). |

Payload típico de simulação (resumo):

```json
{
	"monthlyIncome": 9000,
	"monthlyExpenses": 5800,
	"currentSavings": 18000,
	"expectedReturnRate": 8,
	"inflationRate": 4.5,
	"additionalContribution": 400,
	"riskTolerance": 3,
	"expensesBreakdown": [{ "category": "Moradia", "amount": 2500 }],
	"goals": [{ "name": "Aposentadoria", "amount": 300000, "targetYears": 15 }],
	"scenario": { "incomeGrowthRate": 3, "jobLossMonths": 2 },
	"taxes": { "incomeTaxRate": 12, "investmentTaxRate": 15 },
	"annualBonuses": [{ "label": "13º", "month": 12, "amount": 9000 }]
}
```

## 🧭 Roadmap & Backlog

- [ ] Deploy público (Render/Vercel + Atlas) com CI/CD.
- [ ] Autenticação multifator e recuperação segura.
- [ ] Persistência de histórico e presets customizados por usuário.
- [ ] Testes ponta a ponta (Playwright) cobrindo landing ➜ login ➜ simulação.
- [ ] Monitoramento (Pino, OpenTelemetry) e observabilidade pró-ativa.
- [ ] Automação de relatórios PDF + assinatura digital.

## ♿ Acessibilidade & UX

- Navegação por teclado com foco visível e atalhos para modo foco.
- Semântica ARIA aplicada em widgets interativos e timeline.
- Landing responsiva com contraste testado e microinterações discretas.
- Backlog inclui auditorias contínuas (axe-core/NVDA) e preferências de redução de movimento.

## ⚠️ Aviso Importante

Projeto educacional/portfolio. Não armazene dados sensíveis em produção sem reforçar autenticação, rate limiting, observabilidade, backups e governança de acesso.

## 📄 Licença

Distribuído sob licença **MIT**. Consulte `LICENSE` para detalhes.

## 🙌 Créditos

Criado por **Caio Marques (Hiidoko)**  
[LinkedIn](https://linkedin.com/in/hiidoko)

Se este simulador te ajudou, deixe uma ⭐️ e compartilhe feedbacks! Melhorias e contribuições são bem-vindas.
