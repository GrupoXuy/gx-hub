"use client";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Building2, Grid2X2, Radio, Maximize2, Minimize2, Minus, Plus, LocateFixed, MousePointer2, Mic, MicOff, Video, VideoOff, MonitorUp, Hand, Smile, Settings2, ChevronDown, Check, MapPin, ArrowUpRight, PhoneOff } from "lucide-react";
import { Avatar, PixelAvatar, IconButton, RoomIcon } from "@/components/ui";
import { STATUS_LABELS, type Workspace, type Member, type Room } from "@/lib/workspace";
import type { CallController } from "@/hooks/use-call";

type Props = {
  data: Workspace; activeRoom: string; onRoom: (id: string) => void; onMove: (x: number, y: number) => void;
  onMember: (member: Member) => void; onJoin: (room: Room) => void; onProfile: () => void;
  onStatus: (status: string) => void; onSettings: () => void; onHand: () => void;
  onReaction: (emoji: string) => void; reaction: string; call: CallController; onOpenCall: () => void;
};
const labels = [
  { id: "estrategia", x: 31, y: 24 }, { id: "coworking", x: 70, y: 26 },
  { id: "lounge", x: 23, y: 70 }, { id: "recepcao", x: 70, y: 80 },
];
export function OfficeMap({ data, activeRoom, onRoom, onMove, onMember, onJoin, onProfile, onStatus, onSettings, onHand, onReaction, reaction, call, onOpenCall }: Props) {
  const [zoom, setZoom] = useState(1);
  const [statusOpen, setStatusOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const room = data.rooms.find(r => r.id === data.me.roomId) || data.rooms[0];
  const inCall = !!call.roomId;
  const selected = data.rooms.find(r => r.id === activeRoom);
  const move = (clientX: number, clientY: number) => {
    if (!world.current) return;
    const rect = world.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width * 100;
    const y = (clientY - rect.top) / rect.height * 100;
    if (Math.abs((x - 50) / 46) + Math.abs((y - 56) / 36) > 1 || y < 30) return;
    onMove(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  };
  const keyMove = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -2], ArrowDown: [0, 2], ArrowLeft: [-2, 0], ArrowRight: [2, 0], w: [0, -2], s: [0, 2], a: [-2, 0], d: [2, 0] };
    const delta = moves[e.key]; if (!delta || e.target !== e.currentTarget) return;
    e.preventDefault(); const x = data.me.x + delta[0]; const y = data.me.y + delta[1];
    if (Math.abs((x - 50) / 46) + Math.abs((y - 56) / 36) < 1 && y > 29) onMove(x, y);
  };
  const toggleFullscreen = async () => {
    try {
      if (fullscreen || document.fullscreenElement) {
        if (document.fullscreenElement) await document.exitFullscreen();
        setFullscreen(false);
      } else { await container.current?.requestFullscreen(); setFullscreen(true); }
    } catch { setFullscreen(value => !value); }
  };
  return <section ref={container} className={`office-card ${fullscreen ? "office-expanded" : ""}`} aria-label="Mapa do escritório virtual">
    <div className="office-card-heading"><div className="office-heading-left"><span className="office-building-icon"><Building2 size={21} strokeWidth={1.5}/></span><div><h2>Escritório Grupo X <span className="live-dot" /></h2><p>Onde a nossa cultura ganha vida.</p></div></div><div className="office-occupancy"><div className="avatar-stack">{data.members.slice(0, 3).map(member => <Avatar key={member.id} member={member} size={25}/>)}</div><span>{data.members.length} pessoas</span></div></div>
    <div className="office-tabs" aria-label="Ambientes do escritório"><button className={activeRoom === "all" ? "active" : ""} onClick={() => onRoom("all")}><Grid2X2 size={14}/>Visão geral</button>{data.rooms.filter(r => r.id !== "diretoria").map(r => <button key={r.id} className={activeRoom === r.id ? "active" : ""} onClick={() => onRoom(r.id)}><RoomIcon kind={r.kind} size={14}/>{r.id === "lounge" ? "Lounge" : r.name}</button>)}{data.me.isAdmin && <button className="director-switch-tab" onClick={() => onRoom("diretoria")} title="Acessar Andar 02 (Sala da Diretoria)"><RoomIcon kind="private" size={14}/>Diretoria (Andar 02)</button>}<span className="office-tabs-spacer"/><span className="floor-caption">ANDAR 01 · WORKSPACE</span></div>
    <div className="office-scene" tabIndex={0} role="application" aria-label="Clique no chão ou use as setas para mover seu avatar" onKeyDown={keyMove}>
      <div className="scene-caption"><span className="tiny-live"><Radio size={12}/> AMBIENTE AO VIVO</span></div>
      <div className="scene-top-tools"><IconButton label={fullscreen ? "Sair da tela cheia" : "Expandir escritório"} onClick={toggleFullscreen}>{fullscreen ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}</IconButton></div>
      <div className="office-world" ref={world} style={{ transform: `translate(-50%, -50%) scale(${zoom})` }} onClick={e => { if ((e.target as HTMLElement).closest("button")) return; e.currentTarget.parentElement?.focus({ preventScroll: true }); move(e.clientX, e.clientY); }}>
        <img className="office-illustration" src="/images/gx-office.jpg" alt="Escritório isométrico do Grupo X com recepção, coworking, sala de estratégia e lounge" draggable={false}/>
        {labels.map(label => { const r = data.rooms.find(item => item.id === label.id)!; return <button key={label.id} className={`room-map-label ${activeRoom === label.id ? "selected" : ""}`} style={{ left: `${label.x}%`, top: `${label.y}%` }} onClick={e => { e.stopPropagation(); onRoom(label.id); }}><RoomIcon kind={r.kind} size={11}/><span>{r.name}</span><span className="room-label-dot"/></button>; })}
        {data.members.map(member => <button key={member.id} className={`map-person ${member.id === data.me.id ? "is-me" : ""} ${activeRoom !== "all" && member.roomId !== activeRoom ? "person-muted" : ""}`} style={{ left: `${member.x}%`, top: `${member.y}%`, zIndex: Math.round(member.y) + 5, "--person-color": member.color } as CSSProperties} aria-label={member.id === data.me.id ? "Seu avatar — personalizar" : `Ver perfil de ${member.name}`} onClick={e => { e.stopPropagation(); if (member.id === data.me.id) onProfile(); else onMember(member); }}><PixelAvatar member={member} size={47} own={member.id === data.me.id}/><span className="person-name">{member.id === data.me.id ? "Você" : `${member.name.split(" ")[0]} ${member.name.split(" ")[1]?.[0] || ""}.`}{member.id === data.me.id && <span className="me-marker"/>}</span>{member.id === data.me.id && reaction && <span className="floating-reaction" key={reaction}>{reaction}</span>}</button>)}
      </div>
      {selected && <div className="room-focus-card"><span className="room-focus-icon"><RoomIcon kind={selected.kind}/></span><div><strong>{selected.name}</strong><span>Até {selected.capacity} pessoas · voz e vídeo</span></div><button onClick={() => onJoin(selected)} aria-label={`Entrar em ${selected.name}`}><ArrowUpRight size={17}/></button></div>}
      <div className="map-hint"><MousePointer2 size={12}/><span>Clique no chão para se mover</span></div>
      <div className="map-zoom"><IconButton label="Diminuir zoom" disabled={zoom <= .8} onClick={() => setZoom(z => Math.max(.8, +(z - .1).toFixed(1)))}><Minus size={14}/></IconButton><span>{Math.round(zoom * 100)}%</span><IconButton label="Aumentar zoom" disabled={zoom >= 1.5} onClick={() => setZoom(z => Math.min(1.5, +(z + .1).toFixed(1)))}><Plus size={14}/></IconButton><i/><IconButton label="Centralizar mapa" onClick={() => setZoom(1)}><LocateFixed size={14}/></IconButton></div>
    </div>
    <div className="office-toolbar"><div className="toolbar-profile"><button className="plain-button" onClick={onProfile} aria-label="Editar seu perfil"><Avatar member={data.me} size={33} status/></button><div className="toolbar-location"><strong title={room.name}>{inCall ? "Em chamada" : room.id === "recepcao" ? "Você na recepção" : room.name}</strong><div className="status-dropdown"><button onClick={() => setStatusOpen(!statusOpen)}><span className={`small-status-dot ${data.me.status}`}/>{STATUS_LABELS[data.me.status]}<ChevronDown size={11}/></button>{statusOpen && <div className="dropdown-menu status-menu">{Object.entries(STATUS_LABELS).map(([id, label]) => <button key={id} onClick={() => { onStatus(id); setStatusOpen(false); }}><span className={`small-status-dot ${id}`}/>{label}{data.me.status === id && <Check size={13}/>}</button>)}</div>}</div></div></div>
      <div className="media-toolbar"><IconButton label={inCall ? call.micOn ? "Desativar microfone" : "Ativar microfone" : "Conectar microfone"} className={call.micOn ? "enabled" : ""} onClick={() => inCall ? void call.toggleMic() : onJoin(room)}>{call.micOn ? <Mic size={17}/> : <MicOff size={17}/>}</IconButton><IconButton label={inCall ? call.cameraOn ? "Desativar câmera" : "Ativar câmera" : "Conectar câmera"} className={call.cameraOn ? "enabled" : ""} onClick={() => inCall ? void call.toggleCamera() : onJoin(room)}>{call.cameraOn ? <Video size={18}/> : <VideoOff size={18}/>}</IconButton><IconButton label="Compartilhar tela" className={call.screenStream ? "enabled" : ""} onClick={() => inCall ? void call.shareScreen() : onJoin(room)}><MonitorUp size={17}/></IconButton><span className="toolbar-divider"/><IconButton label={data.me.handRaised ? "Abaixar a mão" : "Acenar para a equipe"} className={data.me.handRaised ? "enabled" : ""} onClick={onHand}><Hand size={17}/></IconButton><div className="reaction-control"><IconButton label="Enviar uma reação" onClick={() => setReactionsOpen(!reactionsOpen)}><Smile size={17}/></IconButton>{reactionsOpen && <div className="reaction-picker">{["👋", "👏", "🚀", "💛", "☕", "🎉"].map(emoji => <button key={emoji} onClick={() => { onReaction(emoji); setReactionsOpen(false); }}>{emoji}</button>)}</div>}</div></div>
      <div className="toolbar-end">{inCall ? <><button className="return-call" onClick={onOpenCall}>Ver chamada</button><IconButton label="Sair da chamada" className="danger-soft" onClick={() => void call.leave()}><PhoneOff size={16}/></IconButton></> : <IconButton label="Configurações de áudio e vídeo" onClick={onSettings}><Settings2 size={17}/></IconButton>}</div>
    </div>
  </section>;
}
