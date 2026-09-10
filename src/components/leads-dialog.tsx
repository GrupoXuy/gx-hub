"use client";
import { useEffect, useState } from "react";
import { CalendarDays, Copy, Download, LoaderCircle, Mail, MessageCircle, Search, Users, X } from "lucide-react";
import { Modal, EmptyState } from "@/components/ui";
import { api } from "@/lib/workspace";

type Lead = { id: string; name: string; gender: string; whatsapp: string; email: string; meetingTitle: string; createdAt: string };
export function LeadsDialog({ notify, onClose }: { notify: (message: string) => void; onClose: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void api<{ leads: Lead[] }>("/api/leads").then(r => setLeads(r.leads)).catch(e => setError(e instanceof Error ? e.message : "Não foi possível carregar os leads.")).finally(() => setLoading(false)); }, []);
  const filtered = leads.filter(lead => `${lead.name} ${lead.email} ${lead.whatsapp} ${lead.meetingTitle}`.toLowerCase().includes(search.toLowerCase()));
  const csv = () => {
    const rows = [["Nome", "Sexo", "WhatsApp", "Email", "Reunião", "Data"], ...leads.map(l => [l.name, l.gender, l.whatsapp, l.email, l.meetingTitle, new Date(l.createdAt).toLocaleString("pt-BR")])];
    const content = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" })); a.download = "leads-grupo-x.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); notify("Base de leads exportada em CSV.");
  };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); notify("Contato copiado."); } catch { notify(text); } };
  return <Modal title="Leads de clientes" eyebrow="BASE GRUPO X" onClose={onClose} wide>
    <p className="modal-description">Contatos capturados através dos convites temporários de reuniões. Somente Henrique Senna pode acessar esta base.</p>
    <div className="leads-toolbar"><label className="search-field users-search"><Search size={16}/><input placeholder="Buscar nome, email, WhatsApp ou reunião" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar leads"/></label><span className="filter-summary">{leads.length} leads</span><button className="button button-secondary" onClick={csv} disabled={!leads.length}><Download size={15}/>Exportar CSV</button></div>
    {error && <div className="form-error" role="alert">{error}</div>}
    {loading ? <div className="users-loading"><LoaderCircle size={22} className="spin"/>Carregando leads…</div> : filtered.length ? <div className="leads-list">{filtered.map(lead => <article className="lead-row" key={lead.id}><span className="lead-avatar"><Users size={17}/></span><div className="lead-info"><strong>{lead.name}<small>{lead.gender === "female" ? "Feminino" : "Masculino"}</small></strong><span><CalendarDays size={12}/>{lead.meetingTitle}</span><time>{new Date(lead.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time></div><div className="lead-contact"><button onClick={() => void copy(lead.whatsapp)} title="Copiar WhatsApp"><MessageCircle size={14}/>{lead.whatsapp}</button><button onClick={() => void copy(lead.email)} title="Copiar email"><Mail size={14}/>{lead.email}</button></div></article>)}</div> : <EmptyState icon={<Users size={26}/>} title="Nenhum lead capturado" description="Os contatos dos clientes aparecem aqui depois que eles aceitam um convite de reunião."/>}
    <p className="modal-footnote">Use os dados somente para os fins informados ao cliente no convite. <button className="text-link" onClick={onClose}><X size={12}/>Fechar</button></p>
  </Modal>;
}
