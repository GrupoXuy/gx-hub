"use client";
import { ArrowLeft, DoorOpen, Maximize2, Monitor, PhoneCall, ShieldCheck, Users } from "lucide-react";
import type { Room } from "@/lib/workspace";
import type { CallController } from "@/hooks/use-call";

export function DirectorRoom({ room, call, onBack, onJoin }: { room: Room; call: CallController; onBack: () => void; onJoin: () => void }) {
  const inCall = !!call.roomId;
  return <section className="director-room-page">
    <div className="director-room-top"><button className="button button-secondary" onClick={onBack}><ArrowLeft size={16}/>Voltar ao escritório</button><span><ShieldCheck size={14}/>Sala restrita · Administradores</span></div>
    <div className="director-room-scene"><img src="/images/director-room.jpg" alt="Sala da diretoria com mesa de vidro, computador e mobília executiva"/><div className="director-room-overlay"><span className="eyebrow"><span/>AMBIENTE EXECUTIVO GX HUB</span><h2>Sala da diretoria</h2><p>Um espaço reservado para decisões estratégicas, conversas confidenciais e os próximos grandes passos.</p><div className="director-room-meta"><span><Users size={15}/>Até {room.capacity} pessoas</span><span><Monitor size={15}/>Voz, vídeo e compartilhamento</span></div><button className="button button-primary" onClick={onJoin}>{inCall ? <Maximize2 size={16}/> : <PhoneCall size={16}/>} {inCall ? "Ver chamada" : "Entrar na sala"}</button></div></div>
    <div className="director-room-note"><DoorOpen size={16}/><span>Este ambiente não aparece para membros comuns. O acesso é validado no servidor para proteger reuniões de diretoria.</span></div>
  </section>;
}
