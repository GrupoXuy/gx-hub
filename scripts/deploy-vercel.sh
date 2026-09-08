#!/usr/bin/env bash
# Publica o GX Hub diretamente na Vercel usando a API REST (sem CLI).
# Uso: VERCEL_TOKEN=*** ./scripts/deploy-vercel.sh
set -euo pipefail
: "${VERCEL_TOKEN:?VERCEL_TOKEN e obrigatorio. Crie um token em https://vercel.com/account/tokens (Permissoes: Project Read/Write + Deployments)}"
API="https://api.vercel.com"
PROJECT_NAME="${VERCEL_PROJECT:-gx-hub}"
AUTH=(-H "Authorization: Bearer $VERCEL_TOKEN")
json() { node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(eval('d.'+'$1')||'')}catch{console.log('')}})"; }

echo "==> Localizando ou criando o projeto $PROJECT_NAME..."
PROJECT_ID="$(curl -sf "${AUTH[@]}" "$API/v10/projects?search=$PROJECT_NAME&limit=20" | json "projects.find(p=>p.name==='$PROJECT_NAME').id" || true)"
if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID="$(curl -sf -X POST "${AUTH[@]}" -H "Content-Type: application/json" -d "{\"name\":\"$PROJECT_NAME\"}" "$API/v10/projects" | json "id")"
  echo "    Projeto criado: $PROJECT_ID"
else
  echo "    Projeto existente: $PROJECT_ID"
fi

echo "==> Preparando os arquivos (node_modules, .git, .env e testes fora do pacote)..."
FILES_ARGS=()
while IFS= read -r -d '' f; do
  rel="${f#./}"
  FILES_ARGS+=(-F "files=@${f};filename=${rel}")
done < <(find . -type f \
  -not -path './node_modules/*' -not -path './.next/*' -not -path './.git/*' \
  -not -path './artifacts/*' -not -path './scripts/*' -not -path './.env*' \
  -not -name '*.log' -not -name '.DS_Store' -print0)
echo "    $((${#FILES_ARGS[@]} / 2)) arquivos prontos."

echo "==> Enviando para a Vercel (producao)..."
DEPLOY_ID="$(curl -sf -X POST "${AUTH[@]}" "${FILES_ARGS[@]}" -F "target=production" "$API/v12/projects/$PROJECT_ID/deploys" | json "id")"
[ -n "$DEPLOY_ID" ] || { echo "Falha ao criar o deploy."; exit 1; }
echo "    Deploy iniciado: $DEPLOY_ID"

echo "==> Aguardando o build (podem levar 1-3 minutos)..."
for _ in $(seq 1 90); do
  STATE_INFO="$(curl -sf "${AUTH[@]}" "$API/v12/deployments/$DEPLOY_ID")"
  STATE="$(echo "$STATE_INFO" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const o=JSON.parse(d);console.log(o.state+' '+o.url)})")"
  STATE_NAME="$(echo "$STATE_INFO" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).state))")"
  case "$STATE_NAME" in
    READY) echo ""; echo "✅ PUBLICADO! Link permanente:"; echo "🔗 $STATE"; exit 0 ;;
    ERROR|ERROR_BUILD) echo ""; echo "❌ O build falhou na Vercel. Veja os logs em https://vercel.com (projeto $PROJECT_NAME)."; echo "$STATE_INFO" | tail -c 3000; exit 1 ;;
  esac
  printf "\r    estado: %s ..." "$STATE_NAME"
  sleep 5
done
echo ""; echo "⏱ Tempo excedido aguardando o build. Acompanhe em https://vercel.com."; exit 1
