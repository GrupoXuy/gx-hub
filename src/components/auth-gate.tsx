"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, KeyRound, LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";
import { Avatar, BrandMark } from "@/components/ui";
import { AVATAR_COLORS, COMPANY_DATA, type RosterEntry } from "@/lib/workspace";

type Props = {
  roster: RosterEntry[];
  inviteToken: string;
  accessToken: string;
  onLogin: (userId: string) => Promise<void>;
  onLoginEmail: (email: string, password: string) => Promise<void>;
  onClaim: (token: string) => Promise<void>;
  onRegister: (payload: { name: string; role: string; company: string; color: string; inviteToken: string }) => Promise<void>;
};

export function AuthGate({ roster, inviteToken, accessToken, onLogin, onLoginEmail, onClaim, onRegister }: Props) {
  const [mode, setMode] = useState<"login" | "register" | "email">("login");
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("Grupo X");
  const [color, setColor] = useState(AVATAR_COLORS[0].value);
  const [invite, setInvite] = useState(inviteToken);
  const [personalToken, setPersonalToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [registering, setRegistering] = useState(false);
  const claimed = useRef("");

  useEffect(() => { setInvite(inviteToken); if (inviteToken) setMode("register"); }, [inviteToken]);
  useEffect(() => {
    if (!accessToken || claimed.current === accessToken) return;
    claimed.current = accessToken;
    setNotice("Abrindo seu acesso pessoal…");
    void onClaim(accessToken).catch(err => {
      setNotice("");
      setError(err instanceof Error ? err.message : "Não foi possível entrar com este link.");
    });
  }, [accessToken, onClaim]);

  const enter = async (user: RosterEntry) => {
    setBusyId(user.id); setError("");
    try { await onLogin(user.id); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível entrar."); }
    finally { setBusyId(""); }
  };

  const submitRegister = async (event: FormEvent) => {
    event.preventDefault(); setRegistering(true); setError("");
    try {
      await onRegister({ name: name.trim(), role: role.trim(), company, color, inviteToken: invite.trim() });
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível concluir o cadastro."); }
    finally { setRegistering(false); }
  };

  const submitToken = async (event: FormEvent) => {
    event.preventDefault(); setBusyId("token"); setError("");
    try { await onClaim(personalToken.trim()); }
    catch (err) { setError(err instanceof Error ? err.message : "Link inválido."); }
    finally { setBusyId(""); }
  };

  return <div className="auth-gate">
    <div className="auth-card">
      <div className="auth-brand"><BrandMark size={58} /><div><strong>GX <b>HUB</b></strong><span>VIRTUAL WORKSPACE</span></div></div>
      <h1>Seu escritório, sem fronteiras.</h1>
      <p className="auth-subtitle">Escolha quem está entrando para ocupar seu lugar na equipe.</p>
      {notice && <div className="auth-notice"><LoaderCircle size={15} className="spin" />{notice}</div>}
      <div className="auth-tabs">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Entrar</button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Primeiro acesso</button>
        <button className={mode === "email" ? "active" : ""} onClick={() => setMode("email")}>Email e senha</button>
      </div>
      {mode === "email" ? <EmailLogin email={email} setEmail={setEmail} password={password} setPassword={setPassword} busyId={busyId} setBusyId={setBusyId} setNotice={setNotice} setError={setError} onLoginEmail={onLoginEmail} /> : mode === "login" ? <>
        <div className="auth-roster">
          {roster.map(user => <button key={user.id} className="auth-user" onClick={() => void enter(user)} disabled={!!busyId}>
            <Avatar member={user} size={42} />
            <span className="auth-user-info"><strong>{user.name}{user.isAdmin && <span className="admin-badge" title="Administrador"><ShieldCheck size={11} /></span>}</strong><small>{user.role} · {user.company}</small></span>
            <span className={`auth-online ${user.online ? "on" : ""}`} title={user.online ? "No escritório agora" : "Offline"} />
            {busyId === user.id ? <LoaderCircle size={16} className="spin" /> : <ArrowRight size={16} />}
          </button>)}
          {!roster.length && <p className="auth-empty">Nenhum usuário cadastrado ainda.</p>}
        </div>
        <button className="text-link auth-token-toggle" onClick={() => setShowToken(!showToken)}><KeyRound size={13} />Tenho um link de acesso pessoal</button>
        {showToken && <form className="auth-token-form" onSubmit={submitToken}>
          <input aria-label="Código do link pessoal" placeholder="Cole aqui o código do seu link" value={personalToken} onChange={e => setPersonalToken(e.target.value)} />
          <button className="button button-secondary" type="submit" disabled={!personalToken.trim() || !!busyId}>{busyId === "token" ? <LoaderCircle size={15} className="spin" /> : "Entrar"}</button>
        </form>}
      </> : <>
        <form className="auth-register" onSubmit={submitRegister}>
          <label className="form-field"><span>Seu nome</span><input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="Como a equipe deve chamar você?" autoComplete="name" /></label>
          <div className="form-row">
            <label className="form-field"><span>Cargo ou área</span><input required minLength={2} maxLength={80} value={role} onChange={e => setRole(e.target.value)} placeholder="Seu papel na equipe" /></label>
            <label className="form-field"><span>Empresa</span><select value={company} onChange={e => setCompany(e.target.value)}>{COMPANY_DATA.map(c => <option key={c.name}>{c.name}</option>)}<option>GX Hub</option><option>Empresa parceira</option></select></label>
          </div>
          <div className="form-field"><span className="field-label">A cor do seu avatar</span><div className="color-options">{AVATAR_COLORS.map(c => <button type="button" key={c.value} aria-label={c.name} title={c.name} className={color === c.value ? "selected" : ""} style={{ background: c.value }} onClick={() => setColor(c.value)}>{color === c.value && <Check size={15} />}</button>)}</div></div>
          <label className="form-field"><span>Código do convite</span><input required minLength={10} value={invite} onChange={e => setInvite(e.target.value)} placeholder="Cole o código recebido do administrador" autoComplete="off" /></label>
          <button type="submit" className="button button-primary full-width" disabled={registering}>{registering ? <LoaderCircle size={17} className="spin" /> : <UserPlus size={17} />}Cadastrar e entrar</button>
        </form>
        <p className="auth-hint">O código do convite vem no link compartilhado pelo administrador.</p>
      </>}
      {error && <div className="form-error auth-error" role="alert">{error}</div>}
      <p className="auth-footer">Grupo X · Gestão que direciona. Estratégia que multiplica.</p>
    </div>
  </div>;
}

function EmailLogin({ email, setEmail, password, setPassword, busyId, setBusyId, setNotice, setError, onLoginEmail }: {
  email: string; setEmail: (v: string) => void; password: string; setPassword: (v: string) => void;
  busyId: string; setBusyId: (v: string) => void; setNotice: (v: string) => void; setError: (v: string) => void;
  onLoginEmail: (email: string, password: string) => Promise<void>;
}) {
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusyId("email"); setError("");
    try { await onLoginEmail(email.trim(), password); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível entrar."); }
    finally { setBusyId(""); setNotice(""); }
  };
  return <form className="auth-email-login" onSubmit={submit}>
    <p className="auth-email-hint">Acesso administrativo com email e senha.</p>
    <label className="form-field"><span>Email</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu.email@exemplo.com" autoComplete="email" /></label>
    <label className="form-field"><span>Senha</span><input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" autoComplete="current-password" /></label>
    <button type="submit" className="button button-primary full-width" disabled={!!busyId && busyId !== "email"}>{busyId === "email" ? <LoaderCircle size={17} className="spin" /> : <ShieldCheck size={17} />}Entrar com email e senha</button>
  </form>;
}
