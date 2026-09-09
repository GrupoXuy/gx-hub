"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";
import { BrandMark, PixelAvatar } from "@/components/ui";
import { AVATAR_COLORS, COMPANY_DATA } from "@/lib/workspace";

type Props = {
  inviteToken: string;
  onLoginEmail: (email: string, password: string) => Promise<void>;
  onRegister: (payload: { name: string; role: string; company: string; color: string; inviteToken: string; email: string; password: string; gender: string }) => Promise<void>;
};

export function AuthGate({ inviteToken, onLoginEmail, onRegister }: Props) {
  const [mode, setMode] = useState<"login" | "register">(inviteToken ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("Grupo X");
  const [color, setColor] = useState(AVATAR_COLORS[0].value);
  const [gender, setGender] = useState("male");
  const [invite, setInvite] = useState(inviteToken);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const attemptedToken = useRef("");

  useEffect(() => { setInvite(inviteToken); if (inviteToken) setMode("register"); }, [inviteToken]);

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await onLoginEmail(email.trim(), password); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível entrar."); }
    finally { setBusy(false); }
  };

  const submitRegister = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await onRegister({ name: name.trim(), role: role.trim(), company, color, gender, inviteToken: invite.trim(), email: email.trim(), password }); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível concluir o cadastro."); }
    finally { setBusy(false); }
  };

  return <div className="auth-gate">
    <div className="auth-card">
      <div className="auth-brand"><BrandMark size={58} /><div><strong>GX <b>HUB</b></strong><span>VIRTUAL WORKSPACE</span></div></div>
      <h1>Seu escritório, sem fronteiras.</h1>
      <p className="auth-subtitle">Entre com suas próprias credenciais. Cada membro possui um acesso individual e intransferível.</p>
      <div className="auth-tabs">
        <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Entrar</button>
        <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Primeiro acesso</button>
      </div>
      {mode === "login" ? <form className="auth-email-login" onSubmit={submitLogin}>
        <p className="auth-email-hint"><ShieldCheck size={14} />Acesso individual protegido por email e senha.</p>
        <label className="form-field"><span>Email</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu.email@empresa.com" autoComplete="email" /></label>
        <label className="form-field"><span>Senha</span><input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha pessoal" autoComplete="current-password" /></label>
        <button type="submit" className="button button-primary full-width" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <ArrowRight size={17} />}Entrar no escritório</button>
      </form> : <form className="auth-register" onSubmit={submitRegister}>
        <label className="form-field"><span>Seu nome</span><input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="Como a equipe deve chamar você?" autoComplete="name" /></label>
        <div className="form-row"><label className="form-field"><span>Cargo ou área</span><input required minLength={2} maxLength={80} value={role} onChange={e => setRole(e.target.value)} placeholder="Seu papel na equipe" /></label><label className="form-field"><span>Empresa</span><select value={company} onChange={e => setCompany(e.target.value)}>{COMPANY_DATA.map(c => <option key={c.name}>{c.name}</option>)}<option>GX Hub</option><option>Empresa parceira</option></select></label></div>
        <label className="form-field"><span>Email pessoal de acesso</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu.email@empresa.com" autoComplete="email" /></label>
        <label className="form-field"><span>Senha pessoal</span><input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" /></label>
        <div className="form-field"><span>Avatar</span><div className="gender-options">{["male", "female"].map(option => <button type="button" key={option} className={gender === option ? "selected" : ""} onClick={() => setGender(option)}><PixelAvatar member={{ id: `register-${option}`, color, gender, handRaised: false }} size={48} own /><span>{option === "female" ? "Feminino" : "Masculino"}</span></button>)}</div></div>
        <div className="form-field"><span className="field-label">Cor do seu avatar</span><div className="color-options">{AVATAR_COLORS.map(c => <button type="button" key={c.value} aria-label={c.name} title={c.name} className={color === c.value ? "selected" : ""} style={{ background: c.value }} onClick={() => setColor(c.value)}>{color === c.value && <Check size={15} />}</button>)}</div></div>
        <label className="form-field"><span>Código do convite</span><input required minLength={10} value={invite} onChange={e => setInvite(e.target.value)} placeholder="Cole o código recebido do administrador" autoComplete="off" /></label>
        <button type="submit" className="button button-primary full-width" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <UserPlus size={17} />}Cadastrar e entrar</button>
      </form>}
      {error && <div className="form-error auth-error" role="alert">{error}</div>}
      <p className="auth-footer">Grupo X · Gestão que direciona. Estratégia que multiplica.</p>
    </div>
  </div>;
}
