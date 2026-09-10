#!/usr/bin/env bash
# Valida credenciais, envia a main ao GitHub e acompanha o deploy da Vercel.
# Uso: GITHUB_TOKEN=... VERCEL_TOKEN=... ./scripts/publish-production.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

./scripts/validate-deployment.sh

OWNER="${GITHUB_OWNER:-GrupoXuy}"
REPO="${GITHUB_REPO:-gx-hub-escritorio}"
PROJECT="${VERCEL_PROJECT_NAME:-gx-hub-escritorio}"
TEAM_QS="?limit=10"
[ -n "${VERCEL_TEAM_ID:-}" ] && TEAM_QS="?teamId=${VERCEL_TEAM_ID}&limit=10"

if [ -n "$(git status --short)" ]; then
  echo "ERRO: existem alterações não commitadas. Faça commit antes de publicar." >&2
  git status --short
  exit 1
fi

ASKPASS="$(mktemp)"
cleanup() { rm -f "$ASKPASS"; }
trap cleanup EXIT
cat > "$ASKPASS" <<'ASKPASS_SCRIPT'
#!/usr/bin/env bash
case "$1" in
  *Username*) printf '%s' "${GITHUB_OWNER:-GrupoXuy}" ;;
  *) printf '%s' "${GITHUB_TOKEN}" ;;
esac
ASKPASS_SCRIPT
chmod 700 "$ASKPASS"

REMOTE_URL="https://github.com/${OWNER}/${REPO}.git"
GIT_TERMINAL_PROMPT=0 GIT_ASKPASS="$ASKPASS" git push "$REMOTE_URL" HEAD:main

echo "Código publicado no GitHub. Aguardando o deploy automático da Vercel..."
for attempt in $(seq 1 36); do
  DEPLOY=$(curl -fsS -H "Authorization: Bearer ${VERCEL_TOKEN}" "https://api.vercel.com/v2/deployments${TEAM_QS}" 2>/dev/null | GX_PROJECT="$PROJECT" node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{const o=JSON.parse(d);const x=(o.deployments||[]).find(y=>y.name===process.env.GX_PROJECT);console.log(x?`${x.readyState}|${x.url||""}|${x.uid||""}`:"WAITING")}catch{console.log("WAITING")}})')
  STATE="${DEPLOY%%|*}"
  REST="${DEPLOY#*|}"
  URL="${REST%%|*}"
  echo "[$attempt/36] estado: $STATE"
  case "$STATE" in
    READY)
      echo "PUBLICADO EM PRODUÇÃO: https://${URL}"
      echo "Domínio oficial do projeto: https://gxhubofficemeet.vercel.app"
      exit 0
      ;;
    ERROR|CANCELED|CANCELLED)
      echo "ERRO: o deploy da Vercel terminou em $STATE." >&2
      exit 1
      ;;
  esac
  sleep 5
done

echo "Tempo excedido aguardando a Vercel. Acompanhe o projeto no painel." >&2
exit 1
