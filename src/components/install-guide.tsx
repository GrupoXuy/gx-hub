"use client";
import { useState } from "react";
import { ArrowRight, Check, Copy, ExternalLink, Globe2, KeyRound, Rocket, ShieldCheck, Terminal, TriangleAlert, Database, GitBranch, Cloud } from "lucide-react";

const LINKS = {
  codespaces: "https://codespaces.new/GrupoXuy/gx-hub-escritorio?quickstart=1",
  repository: "https://github.com/GrupoXuy/gx-hub-escritorio",
  githubToken: "https://github.com/settings/personal-access-tokens/new",
  vercelToken: "https://vercel.com/account/tokens",
  vercelProject: "https://vercel.com/grupohsx-9774s-projects/gx-hub-escritorio",
  vercelDomains: "https://vercel.com/grupohsx-9774s-projects/gx-hub-escritorio/settings/domains",
  neon: "https://console.neon.tech/",
  live: "https://gxhubofficemeet.vercel.app/",
};

function ExternalButton({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return <a className={`install-button ${primary ? "install-button-primary" : ""}`} href={href} target="_blank" rel="noopener noreferrer">{children}<ExternalLink size={14}/></a>;
}
function CopyButton({ value, label = "Copiar comando" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };
  return <button className="install-copy" onClick={() => void copy()}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Copiado" : label}</button>;
}
function CommandBlock({ command, description }: { command: string; description: string }) {
  return <div className="install-command"><div><span className="install-prompt">$</span><code>{command}</code></div><CopyButton value={command}/><small>{description}</small></div>;
}

export default function InstallGuide() {
  return <main className="install-page">
    <header className="install-header"><a className="install-logo" href="/"><span className="install-logo-mark">X</span><span><strong>GX <b>HUB</b></strong><small>PUBLICAÇÃO SEGURA</small></span></a><a className="install-live-link" href={LINKS.live} target="_blank" rel="noopener noreferrer"><span className="install-live-dot"/>Abrir workspace atual<ExternalLink size={14}/></a></header>
    <section className="install-hero"><p className="install-eyebrow"><span/>GUIA OFICIAL DE PUBLICAÇÃO</p><h1>Coloque o GX Hub no ar<br/><em>com um caminho claro.</em></h1><p className="install-lede">Siga as etapas nesta ordem. Cada botão leva diretamente ao lugar certo para executar a ação.</p><div className="install-hero-actions"><ExternalButton href={LINKS.codespaces} primary><GitBranch size={17}/>Abrir Codespaces agora</ExternalButton><ExternalButton href={LINKS.repository}><GitBranch size={16}/>Ver repositório</ExternalButton></div></section>
    <div className="install-warning"><TriangleAlert size={17}/><p><strong>Segurança primeiro:</strong> não cole tokens no chat, no código ou no repositório. Use os tokens somente no terminal do Codespaces e revogue-os após concluir a publicação.</p></div>
    <section className="install-steps">
      <article className="install-step"><div className="install-step-number">01</div><div className="install-step-content"><div className="install-step-heading"><span className="install-step-icon"><GitBranch size={19}/></span><div><p className="install-step-kicker">ABRIR O AMBIENTE</p><h2>Abra o terminal do projeto</h2></div></div><p>O Codespaces abre um VS Code no navegador já conectado ao repositório. Não instale nada no computador.</p><ExternalButton href={LINKS.codespaces} primary><Rocket size={15}/>Abrir Codespaces do GX Hub</ExternalButton><span className="install-hint">Quando abrir, use o terminal na parte inferior da tela.</span></div></article>
      <article className="install-step"><div className="install-step-number">02</div><div className="install-step-content"><div className="install-step-heading"><span className="install-step-icon"><KeyRound size={19}/></span><div><p className="install-step-kicker">CRIAR ACESSOS TEMPORÁRIOS</p><h2>Crie os dois tokens</h2></div></div><p>Abra cada botão, crie um token e volte ao terminal do Codespaces. O token do GitHub precisa permitir leitura e escrita de conteúdo.</p><div className="install-two-actions"><ExternalButton href={LINKS.githubToken}><GitBranch size={15}/>Token do GitHub</ExternalButton><ExternalButton href={LINKS.vercelToken}><Cloud size={15}/>Token da Vercel</ExternalButton></div><span className="install-hint">GitHub: Contents Read and write · Vercel: token pessoal do projeto.</span></div></article>
      <article className="install-step"><div className="install-step-number">03</div><div className="install-step-content"><div className="install-step-heading"><span className="install-step-icon"><ShieldCheck size={19}/></span><div><p className="install-step-kicker">VALIDAR ANTES DE PUBLICAR</p><h2>Exporte os tokens no terminal</h2></div></div><p>Substitua os dois valores pelos tokens criados. Eles ficam apenas na sessão atual do terminal.</p><CommandBlock command="export GITHUB_TOKEN='COLE_TOKEN_GITHUB'" description="Cole somente o token do GitHub nesta linha."/><CommandBlock command="export VERCEL_TOKEN='COLE_TOKEN_VERCEL'" description="Cole somente o token da Vercel nesta linha."/><CommandBlock command="./scripts/validate-deployment.sh" description="Confirma acesso às contas e ao projeto antes do push."/></div></article>
      <article className="install-step"><div className="install-step-number">04</div><div className="install-step-content"><div className="install-step-heading"><span className="install-step-icon"><Terminal size={19}/></span><div><p className="install-step-kicker">PUBLICAR PRODUÇÃO</p><h2>Execute um único comando</h2></div></div><p>Este comando envia a versão atual para a branch <code>main</code> e acompanha o deploy automático da Vercel.</p><CommandBlock command="./scripts/publish-production.sh" description="Publica GitHub + Vercel e aguarda o status READY."/><div className="install-success-note"><Check size={15}/><span>Ao terminar, o site atualizado estará no domínio oficial.</span></div></div></article>
      <article className="install-step"><div className="install-step-number">05</div><div className="install-step-content"><div className="install-step-heading"><span className="install-step-icon"><Globe2 size={19}/></span><div><p className="install-step-kicker">CONFIRMAR O RESULTADO</p><h2>Abra o site publicado</h2></div></div><p>Use estes botões para confirmar o deploy, configurar o domínio e acessar o GX Hub.</p><div className="install-two-actions"><ExternalButton href={LINKS.live} primary><Globe2 size={15}/>Abrir GX Hub oficial</ExternalButton><ExternalButton href={LINKS.vercelProject}><Cloud size={15}/>Abrir projeto na Vercel</ExternalButton><ExternalButton href={LINKS.vercelDomains}><Globe2 size={15}/>Configurar domínio</ExternalButton></div></div></article>
    </section>
    <section className="install-database"><div className="install-database-icon"><Database size={22}/></div><div><p className="install-step-kicker">BANCO DE DADOS</p><h2>Neon já está conectado</h2><p>O projeto usa Postgres Neon. Se precisar criar outro banco para uma nova conta, abra o console e use o arquivo <code>migrations/0001_init.sql</code>.</p></div><ExternalButton href={LINKS.neon}>Abrir Neon<ExternalLink size={14}/></ExternalButton></section>
    <footer className="install-footer"><span>GX Hub · Grupo X</span><span>Publicação segura · <a href={LINKS.repository} target="_blank" rel="noopener noreferrer">GitHub</a> · <a href={LINKS.live} target="_blank" rel="noopener noreferrer">Produção</a></span></footer>
  </main>;
}
