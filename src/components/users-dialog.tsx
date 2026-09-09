"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, LoaderCircle, Pencil, Plus, Search, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { Avatar, EmptyState, Modal, PixelAvatar } from "@/components/ui";
import { api, AVATAR_COLORS, COMPANY_DATA, GENDER_OPTIONS, isOnline, type Member } from "@/lib/workspace";

type Props = { me: Member; onChanged: () => void; notify: (message: string) => void; onClose: () => void };
const EMPTY_FORM = { name: "", role: "", company: "Grupo X", email: "", password: "", color: AVATAR_COLORS[0].value, gender: "male", canAccessGroupSystem: false };

export function UsersDialog({ me, onChanged, notify, onClose }: Props) {
  const [team, setTeam] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...EMPTY_FORM });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const started = useRef(false);

  const load = async () => {
    try { const result = await api<{ team: Member[] }>("/api/users"); setTeam(result.team); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar a equipe."); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (!started.current) { started.current = true; void load(); } }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault(); setBusy("create"); setError("");
    try {
      const result = await api<{ member: Member }>("/api/users", { method: "POST", body: JSON.stringify({ ...form, name: form.name.trim(), role: form.role.trim(), email: form.email.trim(), password: form.password }) });
      setTeam(prev => [...prev, result.member].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(EMPTY_FORM); setCreating(false); onChanged(); notify(`${result.member.name} cadastrado com email e senha.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível cadastrar o usuário."); }
    finally { setBusy(""); }
  };

  const beginEdit = (member: Member) => {
    setEditing(member.id); setConfirmDelete(null); setError(""); setDraft({
      name: member.name, role: member.role, company: member.company, email: member.email || "", password: "",
      color: member.color, gender: member.gender || "male", canAccessGroupSystem: member.canAccessGroupSystem === true,
    });
  };

  const save = async (event: FormEvent, member: Member) => {
    event.preventDefault(); setBusy(member.id); setError("");
    try {
      const result = await api<{ member: Member }>("/api/users", { method: "PATCH", body: JSON.stringify({ id: member.id, ...draft, name: draft.name.trim(), role: draft.role.trim(), email: draft.email.trim(), ...(draft.password ? { password: draft.password } : {}) }) });
      setTeam(prev => prev.map(item => item.id === member.id ? result.member : item)); setEditing(null); onChanged(); notify("Usuário atualizado.");
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível atualizar o usuário."); }
    finally { setBusy(""); }
  };

  const remove = async (member: Member) => {
    if (confirmDelete !== member.id) { setConfirmDelete(member.id); return; }
    setBusy(member.id); setError("");
    try { await api(`/api/users?id=${encodeURIComponent(member.id)}`, { method: "DELETE" }); setTeam(prev => prev.filter(item => item.id !== member.id)); setConfirmDelete(null); onChanged(); notify(`${member.name} foi removido.`); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível remover o usuário."); }
    finally { setBusy(""); }
  };

  const updateForm = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) => setForm(prev => ({ ...prev, [key]: value }));
  const updateDraft = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) => setDraft(prev => ({ ...prev, [key]: value }));
  const filtered = team.filter(member => `${member.name} ${member.email || ""} ${member.role} ${member.company}`.toLowerCase().includes(search.toLowerCase()));

  const Fields = ({ value, update, editingMode = false }: { value: typeof EMPTY_FORM; update: <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) => void; editingMode?: boolean }) => (
    <>
      <div className="form-row"><label className="form-field"><span>Nome completo</span><input required minLength={2} maxLength={80} value={value.name} onChange={e => update("name", e.target.value)} /></label><label className="form-field"><span>Cargo ou área</span><input required minLength={2} maxLength={80} value={value.role} onChange={e => update("role", e.target.value)} /></label></div>
      <div className="form-row"><label className="form-field"><span>Email de acesso</span><input required type="email" value={value.email} onChange={e => update("email", e.target.value)} placeholder="pessoa@empresa.com" autoComplete="off" /></label><label className="form-field"><span>{editingMode ? "Nova senha" : "Senha"}<small>{editingMode ? "opcional" : "mín. 8 caracteres"}</small></span><input required={!editingMode} minLength={8} type="password" value={value.password} onChange={e => update("password", e.target.value)} placeholder={editingMode ? "Deixe vazio para manter" : "Senha individual"} autoComplete="new-password" /></label></div>
      <div className="form-row"><label className="form-field"><span>Empresa</span><select value={value.company} onChange={e => update("company", e.target.value)}>{COMPANY_DATA.map(c => <option key={c.name}>{c.name}</option>)}<option>GX Hub</option><option>Empresa parceira</option></select></label><div className="form-field"><span>Cor do avatar</span><div className="color-options color-options-small">{AVATAR_COLORS.map(c => <button type="button" key={c.value} aria-label={c.name} className={value.color === c.value ? "selected" : ""} style={{ background: c.value }} onClick={() => update("color", c.value)}>{value.color === c.value && <Check size={13} />}</button>)}</div></div></div>
      <div className="user-gender-picker" role="radiogroup" aria-label="Sexo"><span className="form-field-label">Avatar</span><div className="gender-options">{GENDER_OPTIONS.map(option => <button type="button" key={option.value} className={value.gender === option.value ? "selected" : ""} onClick={() => update("gender", option.value)}><PixelAvatar member={{ id: `admin-${option.value}`, color: value.color, gender: option.value, handRaised: false }} size={44} own /><span>{option.label}</span></button>)}</div></div>
      <label className="admin-check group-system-check"><input type="checkbox" checked={value.canAccessGroupSystem} onChange={e => update("canAccessGroupSystem", e.target.checked)} /><span className="group-system-mark">GX</span>Acesso ao sistema Grupo X<span>Mostra o botão exclusivo na barra lateral.</span></label>
    </>
  );

  return <Modal title="Painel administrativo" eyebrow="HENRIQUE SENNA · CONTROLE EXCLUSIVO" onClose={onClose} wide>
    <p className="modal-description">Cadastre, edite e remova membros. Cada pessoa entra somente com seu próprio email e senha.</p>
    <div className="users-toolbar"><label className="search-field users-search"><Search size={16} /><input placeholder="Buscar membro por nome, email ou empresa" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar usuários" /></label><span className="filter-summary">{team.length} membros</span><button className="button button-primary" onClick={() => { setCreating(v => !v); setError(""); }}><Plus size={16} />{creating ? "Fechar cadastro" : "Cadastrar usuário"}</button></div>
    {creating && <form className="user-create-form" onSubmit={create}><Fields value={form} update={updateForm} /><button type="submit" className="button button-primary full-width" disabled={busy === "create"}>{busy === "create" ? <LoaderCircle size={16} className="spin" /> : <UserPlus size={16} />}Cadastrar usuário</button></form>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="users-list">{loading ? <div className="users-loading"><LoaderCircle size={22} className="spin" />Carregando equipe…</div> : filtered.length ? filtered.map(member => <article key={member.id} className={`user-row ${editing === member.id ? "editing" : ""}`}>
      <Avatar member={member} size={40} />
      {editing === member.id ? <form className="user-edit-form" onSubmit={e => void save(e, member)}><Fields value={draft} update={updateDraft} editingMode /><div className="user-edit-actions"><button type="submit" className="button button-primary" disabled={busy === member.id}>{busy === member.id ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}Salvar</button><button type="button" className="button button-secondary" onClick={() => setEditing(null)}>Cancelar</button></div></form> : <><div className="user-row-info"><strong>{member.name}{member.id === me.id && <span className="you-chip">você</span>}<span className="admin-chip"><ShieldCheck size={11} />admin único</span></strong><small>{member.role} · {member.company}</small><small>{member.email}</small><small className={`user-online ${isOnline(member.lastSeen) ? "on" : ""}`}><span />{isOnline(member.lastSeen) ? "No escritório agora" : "Offline"}{member.canAccessGroupSystem && <b className="system-access-chip">GX Hub</b>}</small></div><div className="user-row-actions"><button className="icon-button" aria-label={`Editar ${member.name}`} onClick={() => beginEdit(member)}><Pencil size={16} /></button>{member.id !== me.id && <button className={`icon-button danger-soft ${confirmDelete === member.id ? "confirm-delete" : ""}`} aria-label={confirmDelete === member.id ? `Confirmar remoção de ${member.name}` : `Remover ${member.name}`} onClick={() => void remove(member)}>{confirmDelete === member.id ? <Check size={16} /> : <Trash2 size={16} />}</button>}</div>{confirmDelete === member.id && <span className="delete-confirm-hint">Clique novamente para confirmar.</span>}</>}
    </article>) : <EmptyState icon={<Search size={26} />} title="Nenhum usuário encontrado" description="Cadastre um membro ou ajuste a busca." />}</div>
    <p className="modal-footnote">Apenas Henrique Senna possui acesso a este painel. Links individuais antigos foram desativados: o acesso é exclusivamente por email e senha.</p>
  </Modal>;
}
