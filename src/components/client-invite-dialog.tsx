"use client";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, Clipboard, ExternalLink, Link2, LoaderCircle, ShieldCheck, Users } from "lucide-react";
import { Modal } from "@/components/ui";
import { api, type Meeting } from "@/lib/workspace";

export function ClientInviteDialog({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const [link, setLink] = useState("");
  const [expires, setExpires] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const create = async () => {
    setError("");
    try {
      const result = await api<{ token: string; expiresAt: string }>("/api/client-invites", { method: "POST", body: JSON.stringify({ meetingId: meeting.id }) });
      setLink(`${window.location.origin}/?cliente=${result.token}`);
      setExpires(new Date(result.expiresAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }));
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível criar o convite."); }
  };
  useEffect(() => {
    let active = true;
    void api<{ token: string; expiresAt: string }>("/api/client-invites", {
      method: "POST",
      body: JSON.stringify({ meetingId: meeting.id }),
    })
      .then((result) => {
        if (!active) return;
        setLink(`${window.location.origin}/?cliente=${result.token}`);
        setExpires(
          new Date(result.expiresAt).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Não foi possível criar o convite.");
      });
    return () => {
      active = false;
    };
  }, [meeting.id]);
  const copy = async () => { if (!link) return; try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2400); } catch { setError("Selecione o link para copiar manualmente."); } };
  return <Modal title="Convide seu cliente para a reunião." eyebrow="CONVITE TEMPORÁRIO" onClose={onClose}>
    <p className="modal-description">Este acesso vale somente para <strong>{meeting.title}</strong>. O cliente preencherá os dados antes de entrar e não terá acesso ao workspace.</p>
    <div className="client-invite-summary"><CalendarDays size={18}/><div><strong>{meeting.title}</strong><span>{new Date(meeting.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {meeting.duration} minutos</span></div></div>
    <label className="field-label">Link único do cliente</label>
    <div className="invite-link-field"><Link2 size={16}/><input readOnly value={link} aria-label="Link temporário do cliente" onFocus={e => e.target.select()} placeholder="Gerando convite…"/><button type="button" onClick={() => void copy()} aria-label="Copiar convite"><Clipboard size={16}/></button></div>
    {error && <div className="form-error" role="alert">{error}<button className="text-link" onClick={() => void create()}>Tentar novamente</button></div>}
    <div className="client-invite-actions"><button className="button button-primary full-width" disabled={!link} onClick={() => void copy()}>{copied ? <Check size={16}/> : <Clipboard size={16}/>} {copied ? "Convite copiado" : "Copiar convite"}</button><a className={`button button-secondary full-width ${!link ? "disabled" : ""}`} href={link || "#"} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/>Testar convite</a></div>
    <div className="client-invite-rules"><p><ShieldCheck size={14}/>Uso único: depois do primeiro preenchimento, o link é invalidado.</p><p><Users size={14}/>O cliente vê somente esta reunião e a chamada de voz/vídeo.</p><p><span>⏱</span>Expira automaticamente ao final da reunião ou ao fechar a página.</p></div>
    <p className="modal-footnote">Válido até {expires || "o final da reunião"}. Os dados entram na base de leads do Grupo X.</p>
  </Modal>;
}
