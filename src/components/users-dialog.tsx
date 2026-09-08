"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Copy, KeyRound, Link2, LoaderCircle, Pencil, Plus, Search, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { Avatar, EmptyState, IconButton, Modal, PixelAvatar } from "@/components/ui";
import { api, AVATAR_COLORS, COMPANY_DATA, GENDER_OPTIONS, isOnline, type Member } from "@/lib/workspace";

type Props = { me: Member; onChanged: () => void; notify: (message: string) => void; onClose: () => void };

export function UsersDialog({ me, onChanged, notify, onClose }: Props) {
  const [team, setTeam] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("Grupo X");
  const [color, setColor] = useState(AVATAR_COLORS[0].value);
  const [admin, setAdmin] = useState(false);
  const [gender, setGender] = useState("male");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdLink, setCreatedLink] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", role: "", company: "", color: "", gender: "male", isAdmin: false });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState("");
  const started = useRef(false);

  const load = async () => {
    try {
      const result = await api<{ team: Member[] }>("/api/users");
      setTeam(result.team);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar a equipe."); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (!started.current) { started.current = true; void load(); } }, []);

  const personalLink = (member: Member) => `${window.location.origin}/?acesso=${member.accessToken || ""}`;
  const copy = async (text: string, done: string) => {
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(text);
      else throw new Error("clipboard");
      notify(done);
    } catch { notify("Copie manualmente: " + text); }
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setCreatedLink("");
    try {
      const result = await api<{ member: Member }>("/api/users", { method: "POST", body: JSON.stringify({ name: name.trim(), role: role.trim(), company, color, gender, isAdmin: admin }) });
      setTeam(previous => [...previous, result.member].sort((a, b) => a.name.localeCompare(b.name)));
      setCreatedLink(personalLink(result.member));
      setName(""); setRole(""); setAdmin(false);
      onChanged();
      notify(`${result.member.name} cadastrado na equipe.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível cadastrar."); }
    finally { setBusy(false); }
  };

  const startEdit = (member: Member) => {
    setEditing(member.id); setConfirmDelete(null);
    setDraft({ name: member.name, role: member.role, company: member.company, color: member.color, gender: member.gender || "male", isAdmin: member.isAdmin });
  };

  const submitEdit = async (event: FormEvent, member: Member) => {
    event.preventDefault(); setRowBusy(member.id); setError("");
    try {
      const result = await api<{ member: Member }>("/api/users", { method: "PATCH", body: JSON.stringify({ id: member.id, ...draft }) });
      setTeam(previous => previous.map(item => item.id === member.id ? { ...result.member } : item));
      setEditing(null); onChanged();
      notify("Cadastro atualizado.");
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar."); }
    finally { setRowBusy(""); }
  };

  const remove = async (member: Member) => {
    if (confirmDelete !== member.id) { setConfirmDelete(member.id); return; }
    setRowBusy(member.id); setError("");
    try {
      await api(`/api/users?id=${encodeURIComponent(member.id)}`, { method: "DELETE" });
      setTeam(previous => previous.filter(item => item.id !== member.id));
      setConfirmDelete(null); onChanged();
      notify(`${member.name} foi removido da equipe.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível remover."); }
    finally { setRowBusy(""); }
  };

  const regenerate = async (member: Member) => {
    setRowBusy(member.id); setError("");
    try {
      const result = await api<{ accessToken: string }>("/api/users", { method: "POST", body: JSON.stringify({ action: "regenerate", id: member.id }) });
      setTeam(previous => previous.map(item => item.id === member.id ? { ...item, accessToken: result.accessToken } : item));
      onChanged();
      notify("Novo link de acesso gerado. O link antigo deixou de funcionar.");
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível gerar o link."); }
    finally { setRowBusy(""); }
  };

  const filtered = team.filter(member => `${member.name} ${member.role} ${member.company}`.toLowerCase().includes(search.toLowerCase()));

  return <Modal title="Quem constrói com a gente." eyebrow="GERENCIAR USUÁRIOS" onClose={onClose} wide>
    <p className="modal-description">Cadastre pessoas, ajuste perfis e compartilhe o acesso pessoal de cada membro.</p>
    <div className="users-toolbar">
      <label className="search-field users-search"><Search size={16} /><input placeholder="Buscar na equipe" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar usuários" /></label>
      <span className="filter-summary">{team.length} cadastrados</span>
      <button className="button button-primary" onClick={() => { setCreating(!creating); setCreatedLink(""); }}><Plus size={16} />{creating ? "Fechar cadastro" : "Cadastrar usuário"}</button>
    </div>
    {creating && <form className="user-create-form" onSubmit={submitCreate}>
      <div className="form-row">
        <label className="form-field"><span>Nome completo</span><input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="Nome da pessoa" autoComplete="off" /></label>
        <label className="form-field"><span>Cargo ou área</span><input required minLength={2} maxLength={80} value={role} onChange={e => setRole(e.target.value)} placeholder="Papel na equipe" autoComplete="off" /></label>
      </div>
      <div className="form-row">
        <label className="form-field"><span>Empresa</span><select value={company} onChange={e => setCompany(e.target.value)}>{COMPANY_DATA.map(c => <option key={c.name}>{c.name}</option>)}<option>GX Hub</option><option>Empresa parceira</option></select></label>
        <div className="form-field"><span>Cor do avatar</span><div className="color-options color-options-small">{AVATAR_COLORS.map(c => <button type="button" key={c.value} aria-label={c.name} title={c.name} className={color === c.value ? "selected" : ""} style={{ background: c.value }} onClick={() => setColor(c.value)}>{color === c.value && <Check size={13} />}</button>)}</div></div>
      </div>
      <div className="user-gender-picker" role="radiogroup" aria-label="Sexo">
        <span className="form-field-label">Sexo</span>
        <div className="gender-options">{GENDER_OPTIONS.map(option => <button type="button" key={option.value} className={gender === option.value ? "selected" : ""} onClick={() => setGender(option.value)}><PixelAvatar member={{ id: "pixel-" + option.value, name: option.label, avatar: "", color, gender: option.value } as Member} size={52} own/><span>{option.label}</span></button>)}</div>
      </div>
      <label className="admin-check"><input type="checkbox" checked={admin} onChange={e => setAdmin(e.target.checked)} /><ShieldCheck size={15} />Tornar administrador<span>Pode cadastrar e remover usuários.</span></label>
      <button type="submit" className="button button-primary full-width" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <UserPlus size={16} />}Cadastrar na equipe</button>
      {createdLink && <div className="created-link"><span><Link2 size={15} />Link de acesso pessoal criado:</span><div className="invite-link-field"><input readOnly value={createdLink} aria-label="Link de acesso pessoal" onFocus={e => e.target.select()} /><button type="button" onClick={() => void copy(createdLink, "Link de acesso copiado.")} aria-label="Copiar link"><Copy size={16} /></button></div><button type="button" className="button button-secondary full-width" onClick={() => void copy(createdLink, "Link de acesso copiado.")}><Copy size={15} />Copiar link de acesso</button></div>}
    </form>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="users-list">
      {loading ? <div className="users-loading"><LoaderCircle size={22} className="spin" />Carregando equipe…</div>
        : filtered.length ? filtered.map(member => <article key={member.id} className={`user-row ${editing === member.id ? "editing" : ""}`}>
          <Avatar member={member} size={40} />
          {editing === member.id ? <form className="user-edit-form" onSubmit={e => void submitEdit(e, member)}>
            <div className="form-row">
              <label className="form-field"><span>Nome</span><input required minLength={2} maxLength={80} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
              <label className="form-field"><span>Cargo</span><input required minLength={2} maxLength={80} value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value })} /></label>
            </div>
            <div className="form-row">
              <label className="form-field"><span>Empresa</span><select value={draft.company} onChange={e => setDraft({ ...draft, company: e.target.value })}>{COMPANY_DATA.map(c => <option key={c.name}>{c.name}</option>)}<option>GX Hub</option><option>Empresa parceira</option></select></label>
              <div className="form-field"><span>Cor</span><div className="color-options color-options-small">{AVATAR_COLORS.map(c => <button type="button" key={c.value} aria-label={c.name} className={draft.color === c.value ? "selected" : ""} style={{ background: c.value }} onClick={() => setDraft({ ...draft, color: c.value })}>{draft.color === c.value && <Check size={13} />}</button>)}</div></div>
            <div className="user-gender-picker user-gender-edit" role="radiogroup" aria-label="Sexo">
              <span className="form-field-label">Sexo</span>
              <div className="gender-options">{GENDER_OPTIONS.map(option => <button type="button" key={option.value} className={draft.gender === option.value ? "selected" : ""} onClick={() => setDraft({ ...draft, gender: option.value })}><PixelAvatar member={{ id: "pixel-" + option.value, name: option.label, avatar: "", color: draft.color, gender: option.value } as Member} size={52} own/><span>{option.label}</span></button>)}</div>
            </div>
            </div>
            <label className="admin-check"><input type="checkbox" checked={draft.isAdmin} disabled={member.id === me.id} onChange={e => setDraft({ ...draft, isAdmin: e.target.checked })} /><ShieldCheck size={15} />Administrador</label>
            <div className="user-edit-actions">
              <button type="submit" className="button button-primary" disabled={rowBusy === member.id}>{rowBusy === member.id ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}Salvar</button>
              <button type="button" className="button button-secondary" onClick={() => setEditing(null)}>Cancelar</button>
            </div>
          </form>
            : <>
              <div className="user-row-info">
                <strong>{member.name}{member.id === me.id && <span className="you-chip">você</span>}{member.isAdmin && <span className="admin-chip"><ShieldCheck size={11} />admin</span>}</strong>
                <small>{member.role} · {member.company}{member.gender && <span className={`gender-chip ${member.gender}`} title={GENDER_OPTIONS.find(o => o.value === member.gender)?.label}>{member.gender === "female" ? "♀" : "♂"}</span>}</small>
                <small className={`user-online ${isOnline(member.lastSeen) ? "on" : ""}`}><span />{isOnline(member.lastSeen) ? "No escritório agora" : "Offline"}</small>
              </div>
              <div className="user-row-actions">
                <IconButton label={`Copiar link de acesso de ${member.name}`} onClick={() => void copy(personalLink(member), `Link de ${member.name.split(" ")[0]} copiado.`)}><Link2 size={16} /></IconButton>
                <IconButton label={`Gerar novo link para ${member.name}`} onClick={() => void regenerate(member)}><KeyRound size={16} /></IconButton>
                <IconButton label={`Editar ${member.name}`} onClick={() => startEdit(member)}><Pencil size={16} /></IconButton>
                {member.id !== me.id && <IconButton label={confirmDelete === member.id ? `Confirmar remoção de ${member.name}` : `Remover ${member.name}`} className={confirmDelete === member.id ? "danger-soft confirm-delete" : "danger-soft"} onClick={() => void remove(member)}>{rowBusy === member.id && confirmDelete === member.id ? <LoaderCircle size={16} className="spin" /> : confirmDelete === member.id ? <Check size={16} /> : <Trash2 size={16} />}</IconButton>}
              </div>
              {confirmDelete === member.id && <span className="delete-confirm-hint">Clique novamente para confirmar a remoção.</span>}
            </>}
        </article>)
          : <EmptyState icon={<Search size={26} />} title="Nenhum usuário encontrado" description="Tente outro nome ou cadastre uma nova pessoa." />}
    </div>
    <p className="modal-footnote">O link pessoal dá acesso direto ao escritório. Compartilhe apenas com o dono do cadastro. <button className="text-link" onClick={onClose}><X size={12} />Fechar</button></p>
  </Modal>;
}
