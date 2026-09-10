"use client";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ShieldCheck, ArrowLeft, Maximize2, Minimize2, Minus, Plus, LocateFixed, MousePointer2, Mic, MicOff, Video, VideoOff, MonitorUp, Hand, Smile, Settings2, ChevronDown, Check, ArrowUpRight, PhoneOff, Lock } from "lucide-react";
import { Avatar, PixelAvatar, IconButton, RoomIcon } from "@/components/ui";
import { STATUS_LABELS, type Workspace, type Member, type Room } from "@/lib/workspace";
import type { CallController } from "@/hooks/use-call";

type Props = {
  room: Room;
  data: Workspace;
  call: CallController;
  onBack: () => void;
  onJoin: () => void;
  onMove: (x: number, y: number) => void;
  onProfile: () => void;
  onStatus: (status: string) => void;
  onSettings: () => void;
  onHand: () => void;
  onReaction: (emoji: string) => void;
  reaction: string;
  onOpenCall: () => void;
};

export function DirectorRoom({
  room,
  data,
  call,
  onBack,
  onJoin,
  onMove,
  onProfile,
  onStatus,
  onSettings,
  onHand,
  onReaction,
  reaction,
  onOpenCall,
}: Props) {
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

  const inCall = call.roomId === room.id;
  const adminsInRoom = data.team.filter((m) => m.isAdmin && m.id !== data.me.id && m.roomId === "diretoria");

  const move = (clientX: number, clientY: number) => {
    if (!world.current) return;
    const rect = world.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    if (Math.abs((x - 50) / 46) + Math.abs((y - 56) / 36) > 1 || y < 30) return;
    onMove(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  };

  const keyMove = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -2],
      ArrowDown: [0, 2],
      ArrowLeft: [-2, 0],
      ArrowRight: [2, 0],
      w: [0, -2],
      s: [0, 2],
      a: [-2, 0],
      d: [2, 0],
    };
    const delta = moves[e.key];
    if (!delta || e.target !== e.currentTarget) return;
    e.preventDefault();
    const x = data.me.x + delta[0];
    const y = data.me.y + delta[1];
    if (Math.abs((x - 50) / 46) + Math.abs((y - 56) / 36) < 1 && y > 29) onMove(x, y);
  };

  const toggleFullscreen = async () => {
    try {
      if (fullscreen || document.fullscreenElement) {
        if (document.fullscreenElement) await document.exitFullscreen();
        setFullscreen(false);
      } else {
        await container.current?.requestFullscreen();
        setFullscreen(true);
      }
    } catch {
      setFullscreen((value) => !value);
    }
  };

  return (
    <section ref={container} className={`office-card ${fullscreen ? "office-expanded" : ""}`} aria-label="Sala da Diretoria Executiva">
      <div className="office-card-heading">
        <div className="office-heading-left">
          <span className="office-building-icon director-building-icon">
            <ShieldCheck size={21} strokeWidth={1.5} />
          </span>
          <div>
            <h2>
              Sala da Diretoria <span className="live-dot" />
            </h2>
            <p>Ambiente executivo exclusivo Grupo X.</p>
          </div>
        </div>
        <div className="office-occupancy">
          <span className="director-room-badge-top">
            <Lock size={12} /> RESTRITA
          </span>
          <span>{adminsInRoom.length + 1} administrador{adminsInRoom.length ? "es" : ""}</span>
        </div>
      </div>

      <div className="office-tabs" aria-label="Navegação da sala da diretoria">
        <button onClick={onBack} className="director-back-tab">
          <ArrowLeft size={14} /> Andar 01 (Escritório)
        </button>
        <button className="active">
          <RoomIcon kind="private" size={14} /> Sala da Diretoria
        </button>
        <span className="office-tabs-spacer" />
        <span className="floor-caption">ANDAR EXECUTIVO</span>
      </div>

      <div
        className="office-scene"
        tabIndex={0}
        role="application"
        aria-label="Clique no chão ou use as setas para mover seu avatar na sala da diretoria"
        onKeyDown={keyMove}
      >
        <div className="scene-caption">
          <span className="tiny-live">
            <ShieldCheck size={12} /> AMBIENTE EXECUTIVO AO VIVO
          </span>
        </div>
        <div className="scene-top-tools">
          <IconButton label={fullscreen ? "Sair da tela cheia" : "Expandir sala"} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </IconButton>
        </div>

        <div
          className="office-world"
          ref={world}
          style={{ transform: `translate(-50%, -50%) scale(${zoom})` }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            e.currentTarget.parentElement?.focus({ preventScroll: true });
            move(e.clientX, e.clientY);
          }}
        >
          <img
            className="office-illustration"
            src="/images/director-room.jpg"
            alt="Mesa de vidro executiva, computador, cadeiras e mobílias da Sala da Diretoria"
            draggable={false}
          />

          <button
            className="room-map-label selected"
            style={{ left: "48%", top: "34%" }}
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
          >
            <RoomIcon kind="private" size={11} />
            <span>Mesa da Diretoria</span>
            <span className="room-label-dot" />
          </button>

          {adminsInRoom.map((member) => (
            <button
              key={member.id}
              className="map-person"
              style={
                {
                  left: `${member.x}%`,
                  top: `${member.y}%`,
                  zIndex: Math.round(member.y) + 5,
                  "--person-color": member.color,
                } as CSSProperties
              }
              aria-label={`Ver perfil de ${member.name}`}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <PixelAvatar member={member} size={47} />
              <span className="person-name">
                {member.name.split(" ")[0]} {member.name.split(" ")[1]?.[0] || ""}.
              </span>
            </button>
          ))}

          <button
            className="map-person is-me"
            style={
              {
                left: `${data.me.x}%`,
                top: `${data.me.y}%`,
                zIndex: Math.round(data.me.y) + 5,
                "--person-color": data.me.color,
              } as CSSProperties
            }
            aria-label="Seu avatar na sala da diretoria — personalizar"
            onClick={(e) => {
              e.stopPropagation();
              onProfile();
            }}
          >
            <PixelAvatar member={data.me} size={47} own />
            <span className="person-name">
              Você
              <span className="me-marker" />
            </span>
            {reaction && (
              <span className="floating-reaction" key={reaction}>
                {reaction}
              </span>
            )}
          </button>
        </div>

        <div className="room-focus-card">
          <span className="room-focus-icon">
            <RoomIcon kind="private" />
          </span>
          <div>
            <strong>Sala da Diretoria</strong>
            <span>Até {room.capacity} pessoas · voz, vídeo e tela</span>
          </div>
          <button onClick={onJoin} aria-label="Entrar na chamada da Sala da Diretoria">
            <ArrowUpRight size={17} />
          </button>
        </div>

        <div className="map-hint">
          <MousePointer2 size={12} />
          <span>Clique no chão para se mover</span>
        </div>

        <div className="map-zoom">
          <IconButton label="Diminuir zoom" disabled={zoom <= 0.8} onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(1)))}>
            <Minus size={14} />
          </IconButton>
          <span>{Math.round(zoom * 100)}%</span>
          <IconButton label="Aumentar zoom" disabled={zoom >= 1.5} onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(1)))}>
            <Plus size={14} />
          </IconButton>
          <i />
          <IconButton label="Centralizar mapa" onClick={() => setZoom(1)}>
            <LocateFixed size={14} />
          </IconButton>
        </div>
      </div>

      <div className="office-toolbar">
        <div className="toolbar-profile">
          <button className="plain-button" onClick={onProfile} aria-label="Editar seu perfil">
            <Avatar member={data.me} size={33} status />
          </button>
          <div className="toolbar-location">
            <strong title="Sala da Diretoria">{inCall ? "Em chamada" : "Sala da Diretoria"}</strong>
            <div className="status-dropdown">
              <button onClick={() => setStatusOpen(!statusOpen)}>
                <span className={`small-status-dot ${data.me.status}`} />
                {STATUS_LABELS[data.me.status]}
                <ChevronDown size={11} />
              </button>
              {statusOpen && (
                <div className="dropdown-menu status-menu">
                  {Object.entries(STATUS_LABELS).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => {
                        onStatus(id);
                        setStatusOpen(false);
                      }}
                    >
                      <span className={`small-status-dot ${id}`} />
                      {label}
                      {data.me.status === id && <Check size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="media-toolbar">
          <IconButton
            label={inCall ? (call.micOn ? "Desativar microfone" : "Ativar microfone") : "Conectar microfone"}
            className={call.micOn ? "enabled" : ""}
            onClick={() => (inCall ? void call.toggleMic() : onJoin())}
          >
            {call.micOn ? <Mic size={17} /> : <MicOff size={17} />}
          </IconButton>
          <IconButton
            label={inCall ? (call.cameraOn ? "Desativar câmera" : "Ativar câmera") : "Conectar câmera"}
            className={call.cameraOn ? "enabled" : ""}
            onClick={() => (inCall ? void call.toggleCamera() : onJoin())}
          >
            {call.cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
          </IconButton>
          <IconButton
            label="Compartilhar tela"
            className={call.screenStream ? "enabled" : ""}
            onClick={() => (inCall ? void call.shareScreen() : onJoin())}
          >
            <MonitorUp size={17} />
          </IconButton>
          <span className="toolbar-divider" />
          <IconButton
            label={data.me.handRaised ? "Abaixar a mão" : "Acenar para a equipe"}
            className={data.me.handRaised ? "enabled" : ""}
            onClick={onHand}
          >
            <Hand size={17} />
          </IconButton>
          <div className="reaction-control">
            <IconButton label="Enviar uma reação" onClick={() => setReactionsOpen(!reactionsOpen)}>
              <Smile size={17} />
            </IconButton>
            {reactionsOpen && (
              <div className="reaction-picker">
                {["👋", "👏", "🚀", "💛", "☕", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReaction(emoji);
                      setReactionsOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-end">
          {inCall ? (
            <>
              <button className="return-call" onClick={onOpenCall}>
                Ver chamada
              </button>
              <IconButton label="Sair da chamada" className="danger-soft" onClick={() => void call.leave()}>
                <PhoneOff size={16} />
              </IconButton>
            </>
          ) : (
            <IconButton label="Configurações de áudio e vídeo" onClick={onSettings}>
              <Settings2 size={17} />
            </IconButton>
          )}
        </div>
      </div>
    </section>
  );
}
