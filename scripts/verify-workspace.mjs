import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
mkdirSync('artifacts', { recursive: true });
const testUsers = [];
const saveUsers = () => writeFileSync('artifacts/test-users.json', JSON.stringify(testUsers));
const track = (id) => { if (id && id !== 'henrique-senna' && !testUsers.includes(id)) { testUsers.push(id); saveUsers(); } };
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
const errors = [];
const contexts = [];
async function newContext() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['microphone', 'camera', 'clipboard-read', 'clipboard-write'], locale: 'pt-BR' });
  await context.addInitScript(() => {
    window.__gxPeers = [];
    const Native = window.RTCPeerConnection;
    window.RTCPeerConnection = class extends Native { constructor(...args) { super(...args); window.__gxPeers.push(this); } };
  });
  contexts.push(context);
  return context;
}
const contextA = await newContext(); const page = await contextA.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('console', msg => { if (msg.type() === 'warning' && msg.text().includes('WebRTC')) console.log('RTC WARNING:', msg.text()); });
async function state(p = page) { const response = await p.request.get(`${base}/api/workspace`); assert.equal(response.status(), 200); return response.json(); }
async function eventually(fn, timeout = 15000) { const start = Date.now(); let last; while (Date.now() - start < timeout) { try { const result = await fn(); if (result) return result; } catch (e) { last = e; } await new Promise(r => setTimeout(r, 350)); } throw last || new Error('Timed out waiting for condition'); }
async function closeModal(p = page) { await p.getByRole('button', { name: 'Fechar janela', exact: true }).click(); }
try {
  assert.equal((await page.request.get(`${base}/api/health`)).status(), 200);
  // Auto-limpeza: remove sobras de execuções abortadas antes de começar.
  const purgeCtx = await newContext(); const purgeApi = purgeCtx.request;
  const g0 = await (await purgeApi.get(`${base}/api/workspace`)).json();
  if (g0.users) {
    const h0 = g0.users.find(u => u.name === 'Henrique Senna');
    if (h0) {
      await purgeApi.post(`${base}/api/auth/login`, { data: { userId: h0.id } });
      for (const u of g0.users.filter(u => u.name.toLowerCase().startsWith('teste') || u.name === 'Usuario Temporario')) {
        await purgeApi.delete(`${base}/api/users?id=${u.id}`);
      }
    }
  }
  // Sem sessão: a API exige autenticação e expõe a lista pública de acesso.
  const unauth = await page.request.get(`${base}/api/workspace`);
  assert.equal(unauth.status(), 401);
  const gate = await unauth.json();
  assert.equal(gate.needsAuth, true);
  assert.ok(gate.users.some(u => u.name === 'Henrique Senna' && u.isAdmin), 'Henrique admin na lista de acesso');
  assert.equal(gate.users.filter(u => u.name.toLowerCase().startsWith('teste')).length, 0, 'sem usuarios de teste');
  assert.ok(!('accessToken' in (gate.users[0] || {})), 'lista publica sem tokens');
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Seu escritório, sem fronteiras.' }).waitFor();
  await page.screenshot({ path: 'artifacts/gx-auth.png' });
  // Entrar como Henrique pela tela de acesso.
  await page.locator('.auth-user').filter({ hasText: 'Henrique Senna' }).click();
  await page.getByText('Conexão estável', { exact: true }).waitFor({ timeout: 15000 });
  const initial = await state();
  assert.equal(initial.me.name, 'Henrique Senna');
  assert.equal(initial.me.isAdmin, true);
  assert.equal(initial.rooms.length, 5);
  assert.equal(initial.team.filter(m => m.isDemo).length, 0, 'nenhum usuario demo');
  assert.equal(initial.team.filter(m => m.name.toLowerCase().startsWith('teste')).length, 0, 'nenhum teste na equipe');
  assert.ok(!('accessToken' in initial.me), 'workspace sem vazar token');
  console.log('PASS: auth gate, admin login and clean roster');
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1200);
  await page.screenshot({ path: 'artifacts/gx-desktop.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false);
  assert.equal(await page.evaluate(() => document.querySelector('.sidebar-user').getBoundingClientRect().bottom <= innerHeight + 1), true, 'Desktop profile stays visible');
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
  await page.screenshot({ path: 'artifacts/gx-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, 'Mobile overflow');
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page.locator('.nav-item').filter({ hasText: 'Equipe' }).click();
  await page.getByRole('heading', { name: 'Talentos diferentes. Uma só direção.' }).waitFor();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('.nav-item').filter({ hasText: 'Escritório virtual' }).click();
  console.log('PASS: desktop/mobile layout and navigation');

  // Gerenciamento de usuários (admin): cadastrar via interface.
  await page.locator('.sidebar-manage').click();
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await page.getByLabel('Nome completo', { exact: true }).fill('Teste GX A');
  await page.getByLabel('Cargo ou área', { exact: true }).fill('Validação de experiência');
  await page.getByRole('button', { name: 'Cadastrar na equipe', exact: true }).click();
  await page.getByText('Link de acesso pessoal criado:').waitFor();
  assert.ok((await state()).team.some(m => m.name === 'Teste GX A'));
  await closeModal();
  // CRUD completo via API em contexto isolado (admin).
  const contextC = await newContext(); const adminApi = contextC.request;
  const gateC = await (await adminApi.get(`${base}/api/workspace`)).json();
  const henriqueId = gateC.users.find(u => u.name === 'Henrique Senna').id;
  assert.equal((await adminApi.post(`${base}/api/auth/login`, { data: { userId: henriqueId } })).status(), 200);
  const created = await (await adminApi.post(`${base}/api/users`, { data: { name: 'Usuario Temporario', role: 'QA', company: 'Grupo X' } })).json();
  assert.ok(created.member.accessToken, 'cadastro retorna link pessoal');
  const listed = await (await adminApi.get(`${base}/api/users`)).json();
  assert.ok(listed.team.some(m => m.name === 'Usuario Temporario'));
  assert.equal((await adminApi.patch(`${base}/api/users`, { data: { id: created.member.id, role: 'QA Senior' } })).status(), 200);
  const dup = await adminApi.post(`${base}/api/users`, { data: { name: 'Usuario Temporario', role: 'QA', company: 'Grupo X' } });
  assert.equal(dup.status(), 409, 'nome duplicado rejeitado');
  assert.equal((await adminApi.delete(`${base}/api/users?id=${created.member.id}`)).status(), 200);
  const relisted = await (await adminApi.get(`${base}/api/users`)).json();
  assert.ok(!relisted.team.some(m => m.name === 'Usuario Temporario'));
  const selfDel = await adminApi.delete(`${base}/api/users?id=${henriqueId}`);
  assert.equal(selfDel.status(), 400, 'admin nao remove a si mesmo');
  console.log('PASS: user management UI create + full API CRUD with guards');

  // Trocar de identidade: sair e entrar como Teste GX A.
  await page.getByRole('button', { name: 'Sair do escritório', exact: true }).click();
  await page.getByRole('heading', { name: 'Seu escritório, sem fronteiras.' }).waitFor({ timeout: 15000 });
  await page.locator('.auth-user').filter({ hasText: 'Teste GX A' }).click();
  await page.getByText('Conexão estável', { exact: true }).waitFor({ timeout: 15000 });
  track((await state()).me.id);
  const forbidden = await page.request.post(`${base}/api/users`, { data: { name: 'Invasor', role: 'x', company: 'y' } });
  assert.equal(forbidden.status(), 403, 'nao-admin bloqueado no cadastro');
  console.log('PASS: logout, identity switch and admin-only guard');

  await page.getByRole('button', { name: 'Personalizar avatar', exact: true }).click();
  await page.getByLabel('Cargo ou área', { exact: true }).fill('Validação de experiência');
  await page.getByRole('button', { name: 'Azul oceano', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar meu avatar', exact: true }).click();
  await eventually(async () => (await state()).me.color === '#7295a1');
  assert.equal((await state()).me.avatar, '');
  console.log('PASS: persistent profile and avatar');

  await page.locator('.nav-item').filter({ hasText: 'Salas de reunião' }).click();
  await page.getByRole('heading', { name: 'Toda boa conversa tem seu lugar.' }).waitFor();
  assert.equal(await page.locator('.room-card').count(), 5);
  await page.locator('.segmented-tabs').getByRole('button', { name: 'Reuniões', exact: true }).click();
  assert.equal(await page.locator('.room-card').count(), 2);
  await page.getByRole('button', { name: 'Agendar reunião', exact: true }).click();
  const meetingTitle = `Conexão de validação ${Date.now()}`;
  await page.getByLabel('Nome da reunião', { exact: true }).fill(meetingTitle);
  const date = new Date(); date.setDate(date.getDate() + 3); date.setHours(10, 15, 0, 0);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  await page.getByLabel('Data e horário', { exact: true }).fill(local);
  await page.getByLabel('Sobre a conversa', { exact: false }).fill('Validar uma conexão real entre os membros do workspace.');
  await page.getByRole('dialog').getByRole('button', { name: 'Agendar reunião', exact: true }).click();
  await eventually(async () => (await state()).meetings.some(m => m.title === meetingTitle));
  const booked = (await state()).meetings.find(m => m.title === meetingTitle);
  const conflict = await page.request.post(`${base}/api/meetings`, { data: { title: 'Conflito de horário', roomId: booked.roomId, startsAt: booked.startsAt, duration: booked.duration } });
  assert.equal(conflict.status(), 409, 'Overlapping reservations are rejected');
  await page.locator('.nav-item').filter({ hasText: 'Agenda' }).click();
  await page.locator('.agenda-event').filter({ hasText: meetingTitle }).getByRole('button', { name: 'Ver reunião' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Adicionar ao meu calendário' }).click();
  const download = await downloadPromise; assert.equal(download.suggestedFilename(), 'reuniao-gx-hub.ics');
  assert.match(readFileSync(await download.path(), 'utf8'), /BEGIN:VEVENT/);
  await page.getByRole('button', { name: 'Cancelar reunião', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar cancelamento da reunião' }).click();
  await eventually(async () => !(await state()).meetings.some(m => m.title === meetingTitle));
  console.log('PASS: room filtering, scheduling, calendar export and cancellation');

  await page.locator('.sidebar-invite').click();
  const inviteInput = page.getByRole('textbox', { name: 'Link de convite', exact: true });
  await eventually(async () => (await inviteInput.inputValue()).includes('invite='));
  const inviteUrl = await inviteInput.inputValue();
  await page.getByRole('dialog').locator('.button-primary').click();
  await page.getByRole('button', { name: 'Link copiado!', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), inviteUrl);
  await closeModal();
  const contextB = await newContext(); const pageB = await contextB.newPage();
  pageB.on('pageerror', error => errors.push(error.message));
  pageB.on('console', msg => { if (msg.type() === 'warning' && msg.text().includes('WebRTC')) console.log('RTC B WARNING:', msg.text()); });
  await pageB.goto(inviteUrl, { waitUntil: 'networkidle' });
  await pageB.getByRole('heading', { name: 'Seu escritório, sem fronteiras.' }).waitFor();
  await pageB.getByRole('button', { name: 'Primeiro acesso', exact: true }).click();
  await pageB.getByLabel('Seu nome', { exact: true }).fill('Teste GX B');
  await pageB.getByLabel('Cargo ou área', { exact: true }).fill('Validação remota');
  await pageB.getByRole('button', { name: 'Cadastrar e entrar', exact: true }).click();
  await pageB.getByText('Conexão estável', { exact: true }).waitFor({ timeout: 15000 });
  track((await state(pageB)).me.id);
  await eventually(async () => (await state()).members.some(m => m.name === 'Teste GX B'));
  // Link pessoal: acesso direto sem escolher nome.
  const contextD = await newContext(); const pageD = await contextD.newPage();
  const teamD = await (await adminApi.get(`${base}/api/users`)).json();
  const tokenB = teamD.team.find(m => m.name === 'Teste GX B').accessToken;
  await pageD.goto(`${base}/?acesso=${tokenB}`, { waitUntil: 'networkidle' });
  await pageD.getByText('Conexão estável', { exact: true }).waitFor({ timeout: 15000 });
  assert.equal((await state(pageD)).me.name, 'Teste GX B');
  console.log('PASS: invitation, self-registration, personal link and live presence');

  await page.locator('.nav-item').filter({ hasText: 'Escritório virtual' }).click();
  const message = `Conectados para construir. 🚀 ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Escreva uma mensagem', exact: true }).fill(message);
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await pageB.locator('.message-body').filter({ hasText: message }).waitFor({ timeout: 12000 });
  await page.keyboard.press('Control+k');
  await page.getByRole('textbox', { name: 'Buscar no workspace', exact: true }).fill('Henrique');
  await page.locator('.search-results').getByRole('button').filter({ hasText: 'Henrique Senna' }).click();
  await page.getByRole('dialog').getByText('Fundador & CEO').waitFor(); await closeModal();
  const box = await page.locator('.office-world').boundingBox();
  await page.mouse.click(box.x + box.width * .55, box.y + box.height * .70);
  await eventually(async () => Math.abs((await state()).me.x - 55) < 1);
  await page.getByRole('button', { name: 'Acenar para a equipe', exact: true }).click();
  await eventually(async () => (await state()).me.handRaised);
  await page.getByRole('button', { name: 'Abaixar a mão', exact: true }).click();
  const beforeArrow = (await state()).me.x;
  await page.locator('.office-scene').focus(); await page.keyboard.press('ArrowRight');
  await eventually(async () => Math.abs((await state()).me.x - beforeArrow - 2) < .1);
  await page.getByRole('button', { name: 'Aumentar zoom', exact: true }).click();
  await page.getByText('110%', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Centralizar mapa', exact: true }).click();
  await page.getByRole('button', { name: 'Expandir escritório', exact: true }).click();
  await eventually(() => page.evaluate(() => !!document.fullscreenElement));
  await page.evaluate(() => document.exitFullscreen());
  await eventually(async () => await page.locator('.office-expanded').count() === 0);
  console.log('PASS: cross-session chat, search, movement and gestures');

  await page.getByRole('button', { name: 'Configurações de áudio e vídeo', exact: true }).click();
  await page.getByRole('button', { name: 'Detectar dispositivos', exact: true }).click();
  await eventually(async () => (await page.getByRole('combobox', { name: 'Microfone', exact: true }).locator('option').count()) > 1);
  await page.getByRole('slider', { name: 'Volume das chamadas', exact: true }).fill('55');
  await page.getByRole('button', { name: 'Salvar preferências', exact: true }).click();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('gx-preferences')).volume), 55);
  console.log('PASS: real device discovery and local preferences');

  await page.getByRole('button', { name: 'Conectar microfone', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar com vídeo', exact: true }).click();
  await page.locator('.active-call-modal').waitFor({ timeout: 20000 });
  await pageB.getByRole('button', { name: 'Conectar microfone', exact: true }).click();
  await pageB.getByRole('button', { name: 'Entrar com vídeo', exact: true }).click();
  await pageB.locator('.active-call-modal').waitFor({ timeout: 20000 });
  await eventually(() => page.evaluate(() => window.__gxPeers.some(p => p.connectionState === 'connected')), 30000);
  await eventually(() => pageB.evaluate(() => window.__gxPeers.some(p => p.connectionState === 'connected')), 30000);
  await eventually(() => page.locator('.video-tile:not(.local-tile) video').evaluate(v => v.readyState >= 2 && v.videoWidth > 0), 20000);
  await eventually(() => pageB.locator('.video-tile:not(.local-tile) video').evaluate(v => v.readyState >= 2 && v.videoWidth > 0), 20000);
  await page.screenshot({ path: 'artifacts/gx-call.png', fullPage: true });
  await page.locator('.active-call-modal').getByRole('button', { name: 'Desativar microfone', exact: true }).click();
  await eventually(async () => (await state()).me.micEnabled === false);
  await page.evaluate(() => { navigator.mediaDevices.getDisplayMedia = () => navigator.mediaDevices.getUserMedia({ video: true }); });
  await page.locator('.active-call-modal').getByRole('button', { name: 'Compartilhar tela', exact: true }).click();
  await page.locator('.screen-tile').waitFor();
  assert.equal(await page.locator('.screen-tile video').evaluate(v => getComputedStyle(v).transform), 'none');
  await page.locator('.active-call-modal').getByRole('button', { name: 'Desativar câmera', exact: true }).click();
  await page.locator('.active-call-modal').getByRole('button', { name: 'Parar compartilhamento', exact: true }).click();
  await eventually(async () => (await state()).me.cameraEnabled === false);
  await page.locator('.active-call-modal').getByRole('button', { name: 'Sair da chamada', exact: true }).click();
  await eventually(async () => (await state()).me.callRoom === null);
  await pageB.locator('.active-call-modal').getByRole('button', { name: 'Sair da chamada', exact: true }).click();
  console.log('PASS: bidirectional WebRTC, audio/video controls, display-track replacement and cleanup');
  await page.getByRole('button', { name: 'Conectar microfone', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar apenas para ouvir', exact: true }).click();
  await page.locator('.active-call-modal').waitFor();
  assert.equal((await state()).me.micEnabled, false); assert.equal((await state()).me.cameraEnabled, false);
  await page.locator('.active-call-modal').getByRole('button', { name: 'Ativar microfone', exact: true }).click();
  await eventually(async () => (await state()).me.micEnabled === true);
  await page.locator('.active-call-modal').getByRole('button', { name: 'Sair da chamada', exact: true }).click();
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied in permission test', 'NotAllowedError'); }; });
  await page.getByRole('button', { name: 'Conectar microfone', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar com vídeo', exact: true }).click();
  await page.locator('.form-error').filter({ hasText: 'foi bloqueado' }).waitFor();
  assert.equal((await state()).me.callRoom, null); await closeModal();
  console.log('PASS: listening mode, microphone activation and denied-permission recovery');
  assert.deepEqual(errors, [], 'Browser runtime errors');
  console.log('ALL WORKSPACE CHECKS PASSED');
} catch (error) {
  console.error('BROWSER VALIDATION FAILED:', error);
  await page.screenshot({ path: 'artifacts/gx-failure.png', fullPage: true }).catch(() => {});
  console.error('Runtime errors:', errors);
  process.exitCode = 1;
} finally { saveUsers(); await browser.close(); }
