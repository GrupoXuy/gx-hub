"use client";
import { useEffect, useId, useRef, useState, type ReactNode, type ButtonHTMLAttributes } from "react";
import { Armchair, Monitor, Presentation, Coffee, ShieldCheck, X } from "lucide-react";
import { initials, type Member, type Direction, type AvatarAction } from "@/lib/workspace";

export function BrandMark({ size = 44 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-label="Grupo X">
      <defs>
        <linearGradient id={`${id}a`} x1="7" y1="9" x2="45" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5DFAC" />
          <stop offset=".36" stopColor="#C6A068" />
          <stop offset=".53" stopColor="#F0D7A0" />
          <stop offset="1" stopColor="#957040" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="38" y1="7" x2="12" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EBD19A" />
          <stop offset=".5" stopColor="#99703C" />
          <stop offset="1" stopColor="#DBBD82" />
        </linearGradient>
      </defs>
      <path d="M12 8A22 22 0 0 1 40 8M47 17A22 22 0 0 1 46 37M39 46A22 22 0 0 1 13 45M6 36A22 22 0 0 1 6 16" stroke={`url(#${id}a)`} strokeWidth="1.2" />
      <path d="M36 8H47L16 45H5L36 8Z" fill={`url(#${id}b)`} />
      <path d="M5 8H17L47 45H35L5 8Z" fill={`url(#${id}a)`} />
      <path d="M7 9L36 44M17 9L46 44" stroke="#F8E6BD" strokeWidth=".5" opacity=".7" />
    </svg>
  );
}

export function Avatar({
  member,
  size = 34,
  status = false,
  className = "",
}: {
  member: {
    color: string;
    gender?: string | null;
    status?: string;
    id?: string;
    handRaised?: boolean;
    name?: string;
    avatar?: string;
    action?: AvatarAction;
    direction?: Direction;
  };
  size?: number;
  status?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`avatar ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, ${member.color}35, ${member.color}12)`,
        border: `1px solid ${member.color}60`,
        borderRadius: Math.round(size * 0.3),
      }}
    >
      <PixelAvatar
        member={{
          id: member.id,
          color: member.color,
          gender: member.gender,
          handRaised: member.handRaised,
          action: member.action || "idle",
          direction: member.direction || "dr",
        }}
        size={Math.max(14, Math.round(size * 0.95))}
      />
      {status && <i className={`presence-dot ${member.status || "available"}`} />}
    </span>
  );
}

export function PixelAvatar({
  member,
  size = 48,
  own = false,
  action,
  direction,
  isMoving = false,
}: {
  member: {
    id?: string;
    color: string;
    gender?: string | null;
    handRaised?: boolean;
    action?: AvatarAction;
    direction?: Direction;
    micEnabled?: boolean;
  };
  size?: number;
  own?: boolean;
  action?: AvatarAction;
  direction?: Direction;
  isMoving?: boolean;
}) {
  const currentAction = action || member.action || "idle";
  const currentDir = direction || member.direction || "dr";
  const female = member.gender === "female";

  const hash = member.id ? [...member.id].reduce((sum, c) => sum + c.charCodeAt(0), 0) : 0;
  const skins = ["#e6b990", "#c79372", "#dca786"];
  const skin = skins[hash % 3];
  const maleHairs = ["#473228", "#2a2220", "#5c432d"];
  const femaleHairs = ["#443026", "#231c1a", "#63442f", "#846549"];
  const hair = female ? femaleHairs[hash % 4] : maleHairs[hash % 3];

  const suitColor = member.color || "#c7a66e";
  const isSitting = currentAction === "sit";
  const isWalking = isMoving || currentAction === "walk";
  const isWaving = member.handRaised || currentAction === "wave";
  const isBack = currentDir === "ul" || currentDir === "ur";
  const isFlipped = currentDir === "dl" || currentDir === "ul";

  return (
    <span
      className={`pixel-avatar-wrapper ${own ? "is-own" : ""} ${isSitting ? "is-sitting" : ""} ${isWalking ? "is-walking" : ""} ${isWaving ? "is-waving" : ""}`}
      style={{ width: size * 0.72, height: size }}
    >
      <svg
        height={size}
        width={size * 0.72}
        viewBox="0 0 32 46"
        shapeRendering="crispEdges"
        aria-hidden="true"
        className="pixel-avatar-svg"
      >
        {/* Isometric ground shadow */}
        <ellipse
          cx="16"
          cy={isSitting ? "42" : "42"}
          rx={isSitting ? "13" : "11"}
          ry={isSitting ? "4.2" : "3.4"}
          fill={own ? "#dfbe7a" : "#000000"}
          opacity={own ? 0.45 : 0.32}
          className="avatar-ground-shadow"
        />

        {/* Character group (with optional flip for left-facing directions) */}
        <g transform={isFlipped ? "translate(32, 0) scale(-1, 1)" : undefined}>
          {isBack ? (
            /* ============================================================
               BACK FACING SPRITE (ul / ur)
               ============================================================ */
            <g className="avatar-body-group">
              {/* Legs / Lower body */}
              {isSitting ? (
                <g className="avatar-legs-seated-back">
                  <path d="M9 28H23V36H9Z" fill="#24282e" />
                  <path d="M9 36H15V42H9Z" fill="#181a1f" />
                  <path d="M17 36H23V42H17Z" fill="#181a1f" />
                </g>
              ) : (
                <g className={`avatar-legs-back ${isWalking ? "anim-walk-legs" : ""}`}>
                  <path d="M10 29H15V41H9V36H10V29Z" fill="#25292f" />
                  <path d="M17 29H22V41H16V36H17V29Z" fill="#1d2126" />
                  <path d="M8 39H15V43H8Z" fill="#111315" />
                  <path d="M16 39H23V43H16Z" fill="#111315" />
                </g>
              )}

              {/* Back Torso / Suit Jacket */}
              <path d="M8 18H24V30H8Z" fill={suitColor} />
              <path d="M8 18H10V30H8Z" fill="#000" opacity=".22" />
              <path d="M15 20H17V30H15Z" fill="#000" opacity=".18" /> {/* Center jacket vent */}
              <path d="M5 20H8V29H5Z" fill={suitColor} />
              <path d="M24 20H27V29H24Z" fill={suitColor} />
              <path d="M5 28H8V33H5Z" fill={skin} />
              <path d="M24 28H27V33H24Z" fill={skin} />

              {/* Shirt Collar back */}
              <path d="M12 16H20V19H12Z" fill="#f2efe9" />

              {/* Head / Hair Back */}
              <path d="M8 4H24V18H8Z" fill={hair} />
              <path d="M6 7H9V16H6Z" fill={hair} />
              <path d="M23 7H26V16H23Z" fill={hair} />
              <path d="M9 4H23V6H9Z" fill="#fff" opacity=".12" />

              {/* Female long ponytail / hair down back */}
              {female && (
                <g>
                  <path d="M11 15H21V25H11Z" fill={hair} />
                  <path d="M13 25H19V28H13Z" fill={hair} />
                  <path d="M14 15H18V17H14Z" fill="#d9b66c" /> {/* Gold hair tie */}
                </g>
              )}
            </g>
          ) : (
            /* ============================================================
               FRONT FACING SPRITE (dl / dr)
               ============================================================ */
            <g className="avatar-body-group">
              {/* Legs / Lower body */}
              {isSitting ? (
                <g className="avatar-legs-seated-front">
                  {/* Seated Thighs (extended horizontally) */}
                  <path d="M8 26H24V32H8Z" fill="#2c3038" />
                  <path d="M8 26H24V28H8Z" fill="#3a404a" />
                  {/* Lower calves bent down */}
                  <path d="M10 32H16V40H10Z" fill="#22262c" />
                  <path d="M17 32H23V40H17Z" fill="#1b1e23" />
                  {/* Shoes planted forward */}
                  <path d="M9 39H16V43H7V41H9Z" fill="#111315" />
                  <path d="M18 39H25V43H16V41H18Z" fill="#111315" />
                  {/* Suit jacket hem over lap */}
                  <path d="M8 25H24V28H8Z" fill={suitColor} />
                  {/* Hands resting on lap */}
                  <path d="M9 27H13V31H9Z" fill={skin} />
                  <path d="M19 27H23V31H19Z" fill={skin} />
                </g>
              ) : (
                <g className={`avatar-legs-front ${isWalking ? "anim-walk-legs" : ""}`}>
                  <path d="M10 29H16V39H9V36H10V29Z" fill="#2d323a" />
                  <path d="M16 29H22V39H16V29Z" fill="#23272e" />
                  <path d="M8 38H15V42H7V40H8ZM17 38H24V42H16V40H17Z" fill="#111315" />
                  <path d="M9 38H15V40H9Z" fill="#3a404a" opacity=".4" />
                </g>
              )}

              {/* Torso / Suit Jacket */}
              <g transform={isSitting ? "translate(0, 2)" : undefined}>
                <path d="M8 19H24V29H8Z" fill={suitColor} />
                <path d="M8 19H11V29H8Z" fill="#000" opacity=".16" />
                <path d="M11 19H21V22H11Z" fill="#fff" opacity=".12" />

                {/* White Shirt Collar & Tie */}
                <path d="M13 18H19V24H13Z" fill="#f5f2eb" />
                <path d="M15 20H17V26H15Z" fill="#1a1c1e" /> {/* Executive dark tie */}
                <path d="M15 21H17V23H15Z" fill="#c7a66e" /> {/* Gold tie pin / clasp */}

                {/* Left Arm / Sleeve */}
                <path d="M5 21H8V29H4V25H5Z" fill={suitColor} />
                <path d="M4 28H8V33H4Z" fill={skin} />

                {/* Right Arm (Waving or Normal) */}
                {isWaving ? (
                  <g className="anim-waving-arm">
                    <path d="M23 15H27V23H23Z" fill={suitColor} />
                    <path d="M24 10H28V15H24Z" fill={skin} />
                  </g>
                ) : (
                  <g>
                    <path d="M24 21H27V29H24Z" fill={suitColor} />
                    <path d="M24 28H28V33H24Z" fill={skin} />
                  </g>
                )}

                {/* Female gold necklace / brooch */}
                {female && (
                  <g>
                    <path d="M13 18H19V20H13Z" fill="#dfc07b" />
                    <circle cx="16" cy="21" r="1.2" fill="#f0d595" />
                  </g>
                )}
              </g>

              {/* Neck & Head */}
              <g transform={isSitting ? "translate(0, 2)" : undefined}>
                <path d="M12 16H20V20H12Z" fill={skin} />
                <path d="M9 5H21V8H24V15H22V18H10V16H7V9H9Z" fill={skin} />

                {/* Hairstyle */}
                {female ? (
                  <g>
                    {/* Female layered hair with elegant bangs */}
                    <path d="M7 3H23V7H25V12H23V6H9V12H7V7H9V4H7Z" fill={hair} />
                    <path d="M8 4H22V8H20V10H18V8H14V10H12V8H8Z" fill={hair} />
                    <path d="M22 8H25V24H22V20H23V14H22Z" fill={hair} /> {/* Side lock / ponytail */}
                    <path d="M9 4H21V6H9Z" fill="#fff" opacity=".18" /> {/* Hair shine */}
                    {/* Rosy cheeks */}
                    <rect x="9" y="14" width="2" height="1.5" fill="#e28c82" opacity=".6" />
                    <rect x="20" y="14" width="2" height="1.5" fill="#e28c82" opacity=".6" />
                    {/* Gold earring */}
                    <circle cx="23.5" cy="14" r="0.9" fill="#e8d5a4" />
                  </g>
                ) : (
                  <g>
                    {/* Male stylish side-part */}
                    <path d="M9 4H20V5H23V9H24V12H21V8H13V10H8V14H6V8H8V5H9Z" fill={hair} />
                    <path d="M10 4H19V6H10Z" fill="#fff" opacity=".18" /> {/* Hair highlight */}
                  </g>
                )}

                {/* Eyes with blinking frame capability */}
                <g className="avatar-eyes">
                  <path d="M10 11H12V13H10ZM18 11H20V13H18Z" fill="#2b2422" />
                  <rect x="11" y="11" width="1" height="1" fill="#ffffff" opacity=".8" />
                  <rect x="19" y="11" width="1" height="1" fill="#ffffff" opacity=".8" />
                </g>

                {/* Nose & Mouth */}
                <path d="M15 13H17V15H15Z" fill="#b98263" opacity=".5" />
                <path d="M14 16H18V17H14Z" fill="#9f664d" />
              </g>
            </g>
          )}
        </g>
      </svg>

      {/* Floating Wave Hand Bubble */}
      {isWaving && <span className="wave-bubble">👋</span>}

      {/* Speaking Indicator */}
      {member.micEnabled && (
        <span className="avatar-speaking-waves" title="Falando">
          <i /><i /><i />
        </span>
      )}

      {/* Seated Badge */}
      {isSitting && <span className="avatar-sitting-indicator" title="Sentado">🪑</span>}
    </span>
  );
}

export function RoomIcon({ kind, size = 18 }: { kind: string; size?: number }) {
  const Icon = ({ reception: Armchair, work: Monitor, meeting: Presentation, lounge: Coffee, private: ShieldCheck })[kind] || Armchair;
  return <Icon size={size} strokeWidth={1.65} />;
}

export function IconButton({
  label,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

export function Modal({
  title,
  eyebrow,
  children,
  onClose,
  wide = false,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
        ) || []
      );
    const timeout = setTimeout(() => focusable()[0]?.focus(), 40);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = focusable();
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      clearTimeout(timeout);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} className={`modal-shell ${wide ? "modal-wide" : ""} ${className}`}>
        <div className="modal-heading">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 id={id}>{title}</h2>
          </div>
          <IconButton label="Fechar janela" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
