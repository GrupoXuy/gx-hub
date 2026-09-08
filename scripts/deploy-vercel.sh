#!/usr/bin/env bash
# Publica o GX Hub na Vercel via API oficial (upload por SHA1 + POST /v13/deployments).
# Uso: VERCEL_TOKEN=*** ./scripts/deploy-vercel.sh
# Variaveis opcionais: VERCEL_PROJECT (padrao: gx-hub-escritorio), VERCEL_TEAM_ID, GX_NOWAIT=1 (cria o deploy sem aguardar o build).
set -euo pipefail
: "${VERCEL_TOKEN:?VERCEL_TOKEN e obrigatorio. Crie um token em https://vercel.com/account/tokens}"
API="https://api.vercel.com"
PROJECT_NAME="${VERCEL_PROJECT:-gx-hub-escritorio}"
AUTH=(-H "Authorization: Bearer $VERCEL_TOKEN")
TEAM_QS=""
[ -n "${VERCEL_TEAM_ID:-}" ] && TEAM_QS="?teamId=$VERCEL_TEAM_ID"
cd "$(dirname "$0")/.."
MANIFEST=/tmp/gx-manifest.tsv

echo "==> Selecionando arquivos..."
> "$MANIFEST"
while IFS= read -r -d '' f; do
  rel="${f#./}"
  sha=$(sha1sum "$f" | cut -d' ' -f1)
  size=$(stat -c%s "$f")
  printf '%s\t%s\t%s\n' "$sha" "$rel" "$size" >> "$MANIFEST"
done < <(find . -type f \
  -not -path './node_modules/*' -not -path './.next/*' -not -path './.git/*' \
  -not -path './artifacts/*' -not -path './scripts/*' -not -path './.env*' \
  -not -name '*.log' -not -name '.DS_Store' -print0)
TOTAL=$(wc -l < "$MANIFEST")
echo "    $TOTAL arquivos prontos."

echo "==> Enviando arquivos a $API/v2/files ..."
i=0
while IFS=$'\t' read -r sha rel size; do
  i=$((i+1))
  code=$(curl -s -o /tmp/up-resp.json -w '%{http_code}' -X POST "${AUTH[@]}" \
    -H 'Content-Type: application/octet-stream' \
    -H "Content-Length: $size" \
    -H "x-now-digest: $sha" \
    -H "x-now-size: $size" \
    --data-binary "@$rel" "$API/v2/files")
  if [ "$code" != "200" ]; then
    echo "    FALHA ao enviar $rel (HTTP $code): $(head -c 200 /tmp/up-resp.json)"; exit 1
  fi
  if [ $((i % 10)) -eq 0 ] || [ "$i" -eq "$TOTAL" ]; then printf '\r    enviados: %d/%d' "$i" "$TOTAL"; fi
done < "$MANIFEST"
echo ""

echo "==> Criando o deployment (projeto: $PROJECT_NAME)..."
BODY=$(node -e '
const fs = require("fs");
const lines = fs.readFileSync(process.argv[1], "utf8").trim().split("\n");
const files = [];
for (const line of lines) {
  const [sha, rel, size] = line.split("\t");
  files.push({ file: rel, sha, size: Number(size) });
}
console.log(JSON.stringify({ name: process.argv[2], target: "production", projectSettings: { framework: "nextjs" }, files }));
' "$MANIFEST" "$PROJECT_NAME")
RESP=$(echo "$BODY" | curl -s -X POST "${AUTH[@]}" -H 'Content-Type: application/json' --data-binary @- "$API/v13/deployments$TEAM_QS")
DEPLOY_URL=$(echo "$RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const o=JSON.parse(d);console.log(o.url||'')}catch{console.log('')}})")
DEPLOY_ID=$(echo "$RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const o=JSON.parse(d);console.log(o.id||'')}catch{console.log('')}})")
if [ -z "$DEPLOY_ID" ]; then echo "    Resposta da API:"; echo "$RESP" | head -c 500; exit 1; fi
echo "    Deployment: $DEPLOY_URL (id $DEPLOY_ID)"

if [ "${GX_NOWAIT:-0}" = "1" ]; then
  echo "DEPLOY_ID=$DEPLOY_ID"
  echo "DEPLOY_URL=https://$DEPLOY_URL"
  echo "    (saindo agora; acompanhe o build com polling separado)"
  exit 0
fi

echo "==> Aguardando o build (1-3 minutos)..."
for _ in $(seq 1 60); do
  STATE=$(curl -s "${AUTH[@]}" "$API/v2/deployments/$DEPLOY_ID$TEAM_QS" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const o=JSON.parse(d);console.log((o.readyState||o.state||'')+' '+(o.alias||'').join(','))}catch{console.log('')}})")
  NAME="${STATE%% *}"
  case "$NAME" in
    READY)
      ALIAS="${STATE#* }"
      if [ -n "$ALIAS" ] && [ "$ALIAS" != "$DEPLOY_URL" ]; then PROD_URL="https://$ALIAS"; else PROD_URL="$DEPLOY_URL"; fi
      echo ""
      echo "✅ PUBLICADO EM PRODUÇÃO!"
      echo "🔗 $PROD_URL"
      exit 0 ;;
    ERROR|CANCELED|CANCELLED)
      echo ""; echo "❌ O build falhou. Inspeção: https://vercel.com/d/$DEPLOY_ID"; exit 1 ;;
  esac
  printf "\r    estado: %s ..." "$NAME"
  sleep 8
done
echo ""; echo "⏱ Tempo excedido. Acompanhe em https://vercel.com/d/$DEPLOY_ID"; exit 1
