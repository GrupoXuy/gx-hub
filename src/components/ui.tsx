"use client";
import { useEffect, useId, useRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import { Armchair, Monitor, Presentation, Coffee, ShieldCheck, X } from "lucide-react";
import { initials, type Member } from "@/lib/workspace";

export function BrandMark({ size = 44 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-label="Grupo X"><defs><linearGradient id={`${id}a`} x1="7" y1="9" x2="45" y2="44" gradientUnits="userSpaceOnUse"><stop stopColor="#F5DFAC"/><stop offset=".36" stopColor="#C6A068"/><stop offset=".53" stopColor="#F0D7A0"/><stop offset="1" stopColor="#957040"/></linearGradient><linearGradient id={`${id}b`} x1="38" y1="7" x2="12" y2="45" gradientUnits="userSpaceOnUse"><stop stopColor="#EBD19A"/><stop offset=".5" stopColor="#99703C"/><stop offset="1" stopColor="#DBBD82"/></linearGradient></defs><path d="M12 8A22 22 0 0 1 40 8M47 17A22 22 0 0 1 46 37M39 46A22 22 0 0 1 13 45M6 36A22 22 0 0 1 6 16" stroke={`url(#${id}a)`} strokeWidth="1.2"/><path d="M36 8H47L16 45H5L36 8Z" fill={`url(#${id}b)`}/><path d="M5 8H17L47 45H35L5 8Z" fill={`url(#${id}a)`}/><path d="M7 9L36 44M17 9L46 44" stroke="#F8E6BD" strokeWidth=".5" opacity=".7"/></svg>;
}
export function Avatar({ member, size = 34, status = false, className = "" }: { member: Pick<Member, "name" | "avatar" | "color"> & Partial<Member>; size?: number; status?: boolean; className?: string }) {
  return <span className={`avatar ${className}`} style={{ width: size, height: size, background: `${member.color}25`, color: member.color }}><span className="avatar-initials" style={{ fontSize: size * .33 }}>{initials(member.name)}</span>{member.avatar && <img src={member.avatar} alt="" width={size} height={size} onError={event => { event.currentTarget.style.display = "none"; }} />}{status && <i className={`presence-dot ${member.status || "available"}`} />}</span>;
}
export function PixelAvatar({ member, size = 46, own = false }: { member: Pick<Member, "color" | "id" | "handRaised" | "gender">; size?: number; own?: boolean }) {
  const hash = [...member.id].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const skin = ["#e4b78e", "#c49170", "#d8a583"][hash % 3];
  const hair = ["#49352a", "#382b28", "#604731"][hash % 3];
  const female = member.gender === "female";
  const bangs = female
    ? <g><path d="M7 1H19V4H21V8H7V4H7Z" fill={hair}/><path d="M7 5H23" stroke={hair} strokeWidth="1.6"/></g>
    : <path d="M9 4H19V5H22V9H23V12H20V8H13V10H8V14H6V8H8V5H9Z" fill={hair}/>;
  const ponytail = female
    ? <path d="M21 12H24V26H21V22H22V16H21Z" fill={hair}/>
    : null;
  return <span className={`pixel-avatar ${own ? "own-pixel" : ""}`} style={{ width: size * .7, height: size }}>
    <svg height={size} width={size * .7} viewBox="0 0 30 44" aria-hidden="true"><ellipse cx="15" cy="40" rx="12" ry="3.6" fill={own ? "#d7b576" : "#000"} opacity={own ? .38 : .3}/><g shapeRendering="crispEdges"><path d="M10 29H16V39H9V36H10V29ZM16 29H21V39H16V29Z" fill="#30343b"/><path d="M8 38H15V41H7V39H8ZM17 38H23V41H16V39H17Z" fill="#ddd8cd"/><path d="M8 19H21V30H8Z" fill={member.color}/><path d="M8 19H11V29H8Z" fill="#000" opacity=".16"/><path d="M11 19H18V22H11Z" fill="#fff" opacity=".1"/><path d="M5 21H8V29H4V25H5ZM21 21H24V29H21Z" fill={member.color}/><path d="M4 28H8V33H4ZM21 28H25V33H21Z" fill={skin}/><path d="M12 16H18V21H12Z" fill={skin}/><path d="M9 5H20V8H23V15H21V18H10V16H7V9H9Z" fill={skin}/>{bangs}{ponytail}<path d="M10 11H12V13H10ZM18 11H20V13H18Z" fill="#352b29"/><path d="M14 15H18V16H14Z" fill="#a36e54"/><path d="M8 10H10V15H8Z" fill="#fff" opacity=".12"/>{female && <path d="M19 22.5H20.5V24.5H19Z" fill="#e8d5a4"/>}</g></svg>
    {member.handRaised && <span className="wave-bubble">👋</span>}
  </span>;
}
export function RoomIcon({ kind, size = 18 }: { kind: string; size?: number }) {
  const Icon = ({ reception: Armchair, work: Monitor, meeting: Presentation, lounge: Coffee, private: ShieldCheck })[kind] || Armchair;
  return <Icon size={size} strokeWidth={1.65} />;
}
export function IconButton({ label, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}
export function Modal({ title, eyebrow, children, onClose, wide = false, className = "" }: { title: string; eyebrow?: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []);
    const timeout = setTimeout(() => focusable()[0]?.focus(), 40);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = focusable(); const first = nodes[0]; const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handler);
    return () => { clearTimeout(timeout); document.body.style.overflow = overflow; document.removeEventListener("keydown", handler); previous?.focus(); };
  }, []);
  return <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} className={`modal-shell ${wide ? "modal-wide" : ""} ${className}`}><div className="modal-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={id}>{title}</h2></div><IconButton label="Fechar janela" onClick={onClose}><X size={20}/></IconButton></div>{children}</div></div>;
}
export function EmptyState({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{description}</p>{children}</div>;
}
