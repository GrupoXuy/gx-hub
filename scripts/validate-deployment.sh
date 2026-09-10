#!/usr/bin/env bash
# Valida GitHub, Vercel e o projeto conectado antes da publicação.
# Uso: GITHUB_TOKEN=... VERCEL_TOKEN=... ./scripts/validate-deployment.sh
set -euo pipefail

if [ -z "${GITHUB_TOKEN:-}" ]; then echo "ERRO: GITHUB_TOKEN ausente." >&2; exit 2; fi
if [ -z "${VERCEL_TOKEN:-}" ]; then echo "ERRO: VERCEL_TOKEN ausente." >&2; exit 2; fi

OWNER="${GITHUB_OWNER:-GrupoXuy}"
REPO="${GITHUB_REPO:-gx-hub-escritorio}"
PROJECT="${VERCEL_PROJECT_NAME:-gx-hub-escritorio}"
TEAM_QS=""
[ -n "${VERCEL_TEAM_ID:-}" ] && TEAM_QS="?teamId=${VERCEL_TEAM_ID}"

GITHUB_USER=$(curl -fsS -H "Authorization: Bearer ${GITHUB_TOKEN}" -H 'Accept: application/vnd.github+json' https://api.github.com/user | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>console.log(JSON.parse(d).login||""))')
[ -n "$GITHUB_USER" ] || { echo "ERRO: token GitHub inválido." >&2; exit 1; }

REPO_STATUS=$(curl -sS -o /tmp/gx-github-repo.json -w '%{http_code}' -H "Authorization: Bearer ${GITHUB_TOKEN}" -H 'Accept: application/vnd.github+json' "https://api.github.com/repos/${OWNER}/${REPO}")
[ "$REPO_STATUS" = "200" ] || { echo "ERRO: repositório GitHub ${OWNER}/${REPO} não acessível (HTTP ${REPO_STATUS})." >&2; exit 1; }
REPO_BRANCH=$(node -e 'const o=require("/tmp/gx-github-repo.json");console.log(o.default_branch||"")')
[ "$REPO_BRANCH" = "main" ] || { echo "ERRO: o repositório precisa usar a branch main (encontrada: ${REPO_BRANCH})." >&2; exit 1; }

VERCEL_USER=$(curl -fsS -H "Authorization: Bearer ${VERCEL_TOKEN}" https://api.vercel.com/v2/user | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const o=JSON.parse(d);console.log((o.user||o).username||(o.user||o).email||"")})')
[ -n "$VERCEL_USER" ] || { echo "ERRO: token Vercel inválido." >&2; exit 1; }

PROJECT_STATUS=$(curl -sS -o /tmp/gx-vercel-project.json -w '%{http_code}' -H "Authorization: Bearer ${VERCEL_TOKEN}" "https://api.vercel.com/v10/projects/${PROJECT}${TEAM_QS}")
[ "$PROJECT_STATUS" = "200" ] || { echo "ERRO: projeto Vercel ${PROJECT} não acessível (HTTP ${PROJECT_STATUS})." >&2; exit 1; }
PROJECT_ID=$(node -e 'const o=require("/tmp/gx-vercel-project.json");console.log(o.id||"")')
PROJECT_LINK=$(node -e 'const o=require("/tmp/gx-vercel-project.json");const l=o.link||{};console.log((l.org&&l.repo)?l.org+"/"+l.repo:"sem link GitHub")')

printf '\nCredenciais válidas.\n'
printf 'GitHub: %s/%s (branch %s, usuário autenticado %s)\n' "$OWNER" "$REPO" "$REPO_BRANCH" "$GITHUB_USER"
printf 'Vercel: %s (projeto %s, id %s)\n' "$VERCEL_USER" "$PROJECT" "$PROJECT_ID"
printf 'Link GitHub/Vercel: %s\n' "$PROJECT_LINK"
printf 'Pronto para publicar.\n'
