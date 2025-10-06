# Simulador de Futuro Financeiro com IA

Aplicação web full-stack que permite projetar cenários financeiros, visualizar métricas interativas e receber recomendações inteligentes baseadas em uma rede neural leve (TensorFlow.js). O projeto demonstra capacidade de integrar front-end reativo com Vite + React, visualizações com Chart.js, API em Node.js (Express) para cálculos de projeção e geração de recomendações orientadas a dados.

## 🚀 Principais recursos

- **Simulação de cenários** com sliders que permitem avaliar perda temporária de renda, aumento de ganhos e choques de gastos.
- **Dashboards interativos** com gráficos de patrimônio projetado, comparativo de cenários e KPIs relevantes.
- **Testes de estresse** para quedas de mercado e picos de inflação.
- **Recomendações automáticas** vindas do back-end (heurísticas financeiras) e do módulo de IA leve com TensorFlow.js.
- **Exportação em PDF** do plano completo para compartilhamento rápido.

## 📂 Estrutura do projeto

```
├── client/   # Front-end (Vite + React)
└── server/   # Back-end (Node.js + Express)
```

## 🛠️ Pré-requisitos

- Node.js 18+ (recomendado) e npm

## ▶️ Como rodar

### 1. Instalar dependências

```powershell
cd server
npm install
cd ..\client
npm install
```

### 2. Ambiente de desenvolvimento

Em dois terminais separados:

```powershell
cd server
npm run dev
```

```powershell
cd client
npm run dev
```

- API disponível em `http://localhost:4000`
- Front-end disponível em `http://localhost:5173`

### 3. Build de produção

```powershell
cd client
npm run build
```

O diretório `client/dist` conterá os artefatos estáticos do front-end.

## 🧪 Scripts úteis

### Server

- `npm run dev` – inicia o servidor com nodemon
- `npm run start` – inicia o servidor em modo produção
- `npm run lint` – analisa estilo/código (ESLint)

### Client

- `npm run dev` – inicia o front com Vite
- `npm run build` – gera build minificado
- `npm run preview` – pré-visualiza o build
- `npm run lint` – executa ESLint

## 💡 Próximos aprimoramentos sugeridos

- Persistir simulações e perfis de usuário em banco de dados.
- Adicionar autenticação para planos personalizados.
- Criar testes automatizados (Jest / Vitest) para regras financeiras principais.
- Oferecer download em formatos adicionais (Excel/CSV) e salvar presets customizados.

---

Feito para evidenciar domínio em visualização de dados, modelagem financeira e integração de IA leve em aplicações web modernas.
