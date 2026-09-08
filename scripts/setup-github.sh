#!/usr/bin/env bash
# Cria o repositório no GitHub e publica o código automaticamente via API.
# Uso: GITHUB_TOKEN=*** ./scripts/setup-github.sh
set -euo pipefail
: "${GITHUB_TOKEN:?GITHUB_TOKEN e obrigatorio. Crie em https://github.com/settings/tokens/new com escopo 'repo' (token classico)}"
REPO_NAME="${GITHUB_REPO:-gx-hub}"
PRIVATE="${GITHUB_PRIVATE:-false}"
API="https://api.github.com"
AUTH=(-H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json")
json() { node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{let o={};try{o=JSON.parse(d)}catch{};try{console.log(eval('o.'+'$1')||'')}catch{console.log('')}})"; }

LOGIN="$(curl -sf "${AUTH[@]}" "$API/user" | json "login")"
[ -n "$LOGIN" ] || { echo "Token GitHub invalido."; exit 1; }
echo "==> Usuário GitHub: $LOGIN"

if [ "$(curl -s -o /dev/null -w '%{http_code}' "${AUTH[@]}" "$API/repos/$LOGIN/$REPO_NAME")" != "200" ]; then
  curl -sf -X POST "${AUTH[@]}" -H "Content-Type: application/json" \
    -d "{\"name\":\"$REPO_NAME\",\"private\":$PRIVATE,\"description\":\"GX Hub - escritorio virtual do ecossistema Grupo X\"}" \
    "$API/user/repos" > /dev/null
  echo "    Repositorio $REPO_NAME criado (visibilidade: $PRIVATE)."
else
  echo "    Repositorio $REPO_NAME ja existe."
fi

git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/$LOGIN/$REPO_NAME.git"
git push -u origin main
git remote set-url origin "https://github.com/$LOGIN/$REPO_NAME.git"
echo ""
echo "✅ Código publicado em: https://github.com/$LOGIN/$REPO_NAME"
