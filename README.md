# GX Hub — Escritório virtual Grupo X

Um workspace em português inspirado em ambientes isométricos, com a identidade grafite e dourada do Grupo X.

## Funcionalidades

- Mapa interativo com avatares, movimentação por clique ou teclado, status, gestos, zoom e tela cheia.
- Presença de visitantes e chat por ambiente, sincronizados entre dispositivos e persistidos em PostgreSQL.
- Chamadas de áudio e vídeo WebRTC entre participantes reais, com microfone, câmera, modo ouvinte e compartilhamento de tela.
- Diretório da equipe, busca global, personalização do avatar e preferências locais de dispositivos.
- Agenda persistente, proteção contra reservas sobrepostas, cancelamento pelo organizador e exportação iCalendar.
- Convites de visitante com validade de sete dias e entrada com nome personalizado.
- Interface responsiva e navegação por teclado.

## Deploy permanente (GitHub + Vercel + Neon)

Este projeto é full-stack com banco de dados, por isso **não pode** ser publicado no GitHub Pages (apenas sites estáticos). O caminho recomendado, 100% gratuito:

1. **GitHub (código):** crie um repositório em [github.com/new](https://github.com/new) e envie o código do projeto. O repositório fica em `https://github.com/seu-usuario/gx-hub`.
2. **Banco de dados:** crie um Postgres gratuito no [Neon](https://neon.tech) ou [Supabase](https://supabase.com).
   - Abra o **SQL editor** do banco e cole todo o conteúdo de `migrations/0001_init.sql` e execute uma vez. O app preenche as salas e os perfis de demonstração automaticamente no primeiro acesso.
3. **Vercel (link permanente):** entre em [vercel.com](https://vercel.com) com sua conta GitHub e clique em **Add New → Project** para importar o repositório `gx-hub`. O Next.js é detectado automaticamente.
4. **Variável de ambiente:** no projeto da Vercel, adicione `DATABASE_URL` com a string de conexão direta do seu banco (no Neon: Database → Connect → Direct connection string). Copie `TURN_SERVER_URL`, `TURN_USERNAME` e `TURN_CREDENTIAL` para o `.env` local apenas se for usar um servidor TURN.
5. **Deploy:** clique em **Deploy**. Em menos de 2 minutos o app ficará em `https://gx-hub.vercel.app` (ou o subdomínio escolhido). Todo push no GitHub gera deploy automático — o link permanece o mesmo.

O arquivo `.env` com segredos nunca é enviado ao GitHub (protegido pelo `.gitignore`); use `.env.example` como modelo local.

## Tecnologia

Next.js App Router, React, TypeScript, Drizzle ORM e PostgreSQL. A conexão usa `DATABASE_URL` e o cliente de `src/db/index.ts`. As tabelas estão em `src/db/schema.ts`.

O ambiente da plataforma prepara o PostgreSQL automaticamente. Após o bootstrap, aplique o schema com `npx drizzle-kit push`. Os dados ilustrativos são inicializados de forma idempotente pela API do workspace.

## Chamadas em produção

Câmera, microfone e compartilhamento de tela exigem HTTPS (ou localhost). Cada pessoa deve abrir o workspace em uma sessão própria e entrar no mesmo ambiente de chamada. Os perfis demonstrativos não entram em chamadas.

O transporte de mídia é ponto a ponto e a sinalização passa por APIs autenticadas pela sessão de visitante. STUN é configurado por padrão. Para participantes atrás de firewalls corporativos ou NATs restritivos, configure um servidor TURN usando variáveis do ambiente:

- `TURN_SERVER_URL`: endereço TURN/TURNS fornecido pelo seu serviço.
- `TURN_USERNAME`: usuário de autenticação do serviço TURN.
- `TURN_CREDENTIAL`: credencial do serviço TURN.

Não coloque segredos no código ou em variáveis `NEXT_PUBLIC_*`. As configurações de ICE são entregues apenas às sessões que entram em uma chamada.

## Modelo de acesso

Este workspace utiliza sessões de visitante com cookie HTTP-only e SameSite=Lax. Os convites são links compartilháveis; não há login corporativo nem controle organizacional de documentos. Não utilize o ambiente demonstrativo para informações sensíveis. Para um escritório privado, conecte um provedor corporativo de identidade e políticas de acesso antes de disponibilizar dados empresariais.

Cinco perfis, três mensagens de boas-vindas e dois encontros iniciais apresentam a experiência. Seus detalhes os identificam como ilustrativos. Novos participantes, mensagens e reuniões são reais e persistidos no banco.

## Validação

A sequência de validação da aplicação é: `npx next typegen`, `npm exec tsc -- --noEmit --pretty false`, `npm run build` e o healthcheck da plataforma em `/api/health`.

O roteiro `scripts/verify-workspace.mjs` usa Playwright para verificar desktop, celular, perfil, agenda, convites, chat entre sessões, dispositivos e vídeo WebRTC bidirecional com dispositivos sintéticos do navegador. Requer o preview ativo, Chromium e suas dependências. Use `TEST_BASE_URL` para alterar o endereço padrão de teste. `scripts/cleanup-tests.ts` remove exclusivamente as sessões e os dados criados pelo roteiro.

## Identidade e recursos

Conteúdo institucional baseado em https://grupox.lovable.app/. Ilustração do escritório criada para esta aplicação. Tipografia Manrope distribuída sob a licença SIL Open Font License, disponível em `public/fonts/OFL.txt`. Fotografias ilustrativas de perfil servidas pelo Unsplash.
