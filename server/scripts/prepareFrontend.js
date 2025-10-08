import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const publicDir = path.resolve(__dirname, '../public')
const indexFile = path.join(publicDir, 'index.html')
const clientDir = path.resolve(__dirname, '../../client')

function hasClientFolder () {
  return fs.existsSync(clientDir) && fs.statSync(clientDir).isDirectory()
}

function buildFrontend () {
  if (!hasClientFolder()) {
    console.warn('[PrepareFrontend] Pasta client não encontrada neste deploy. Pulei build. Certifique-se de que o processo de build inclua o diretório client.')
    return
  }
  console.log('[PrepareFrontend] Gerando build do frontend...')
  try {
    execSync('npm run build --prefix client', { cwd: path.resolve(__dirname, '../..'), stdio: 'inherit' })
    if (fs.existsSync(indexFile)) {
      console.log('[PrepareFrontend] Build concluído com sucesso.')
    } else {
      console.warn('[PrepareFrontend] Build terminou mas index.html não foi encontrado em server/public. Verifique vite.config.js')
    }
  } catch (err) {
    console.error('[PrepareFrontend] Falha ao gerar build do frontend:', err.message)
    process.exit(1)
  }
}

if (fs.existsSync(indexFile)) {
  console.log('[PrepareFrontend] Frontend já está construído. Pulando build.')
} else {
  buildFrontend()
}
