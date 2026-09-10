"use client";
import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowUpRight, DoorOpen, Maximize2, Minimize2, Monitor, MousePointer2, PhoneCall, ShieldCheck, Users } from "lucide-react";
import { PixelAvatar, IconButton, RoomIcon } from "@/components/ui";
import type { CallController } from "@/hooks/use-call";
import type { Member, Room, Workspace } from "@/lib/workspace";

type Props = { room: Room; data: Workspace; call: CallController; onBack: () => void; onJoin: () => void; onMove: (x: number, y: number) => void };

export function DirectorRoom({ room, data, call, onBack, onJoin, onMove }: Props) {
  const scene = useRef<HTMLDivElement>(null);
  const inCall = call.roomId === room.id;
  const admins = data.team.filter(member => member.isAdmin && member.id !== data.me.id && member.roomId === room.id);
  const move = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(10, Math.min(90, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(29, Math.min(87, ((event.clientY - rect.top) / rect.height) * 100));
    onMove(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  };
  const keyMove = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -2], ArrowDown: [0, 2], ArrowLeft: [-2, 0], ArrowRight: [2, 0], w: [0, -2], a: [-2, 0], s: [0, 2], d: [2, 0] };
    const delta = moves[event.key];
    if (!delta) return;
    event.preventDefault();
    onMove(Math.max(10, Math.min(90, data.me.x + delta[0])), Math.max(29, Math.min(87, data.me.y + delta[1])));
  };
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await scene.current?.requestFullscreen();
  };
  const personStyle = (member: Member): CSSProperties => ({ left: `${member.x}%`, top: `${member.y}%`, zIndex: Math.round(member.y) + 5 });

  return <section className="director-room-page">
    <div className="director-room-top"><button className="button button-secondary" onClick={onBack}><ArrowLeft size={16}/>Voltar ao escritório</button><span><ShieldCheck size={14}/>Sala restrita · Administradores</span></div>
    <div ref={scene} className="director-interactive-scene" tabIndex={0} role="application" aria-label="Sala da diretoria interativa. Clique para mover ou use as setas." onClick={move} onKeyDown={keyMove}>
      <img src="/images/director-room.jpg" alt="Sala da diretoria com mesa de vidro, computador e mobília executiva" draggable={false}/>
      <div className="director-scene-shade" />
      <div className="director-scene-caption"><span className="tiny-live"><ShieldCheck size={12}/> AMBIENTE RESTRITO AO ADMINISTRADOR</span></div>
      <div className="director-scene-tools"><IconButton label="Expandir sala da diretoria" onClick={() => void toggleFullscreen()}><Maximize2 size={15}/></IconButton></div>
      <div className="director-world">
        {admins.map(member => <button key={member.id} className="director-person" style={personStyle(member)} onClick={e => e.stopPropagation()} aria-label={`Administrador ${member.name}`}><PixelAvatar member={member} size={48}/><span>{member.name.split(" ")[0]}</span></button>)}
        <button className="director-person director-me" style={personStyle(data.me)} onClick={e => e.stopPropagation()} aria-label="Seu avatar na sala da diretoria"><PixelAvatar member={data.me} size={52} own/><span>Você</span></button>
      </div>
      <div className="director-scene-info"><span className="eyebrow"><span/>AMBIENTE EXECUTIVO GX HUB</span><h2>Sala da diretoria</h2><p>Uma sala reservada para decisões estratégicas e conversas que movem o próximo capítulo.</p><div className="director-room-meta"><span><Users size={15}/>Até {room.capacity} pessoas</span><span><Monitor size={15}/>Voz, vídeo e compartilhamento</span></div><button className="button button-primary" onClick={e => { e.stopPropagation(); onJoin(); }}>{inCall ? <Maximize2 size={16}/> : <PhoneCall size={16}/>} {inCall ? "Ver chamada" : "Entrar na sala"}</button></div>
      <div className="director-map-hint"><MousePointer2 size={12}/>Clique no ambiente para mover · use as setas ou W A S D</div>
    </div>
    <div className="director-room-note"><DoorOpen size={16}/><span>O ambiente, o chat e as chamadas são exclusivos para administradores. O acesso é validado no servidor.</span><span className="director-room-badge"><RoomIcon kind="private" size={13}/>DIRETORIA</span></div>
  </section>;
}
