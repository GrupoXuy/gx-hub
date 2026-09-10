"use client";
import { useEffect, useId, useRef, type ReactNode, type ButtonHTMLAttributes } from "react";
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
  const skins = ["#e8bc94", "#c99574", "#dda888"];
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
      className={`pixel-avatar-wrapper ${own ? "is-own" : ""} ${isSitting ? "is-sitting" : ""} ${isWalking ? "is-walking" : "is-idle"} ${isWaving ? "is-waving" : ""}`}
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
        <defs>
          {/* Subtle linear lighting gradients matching 3D isometric room lights */}
          <linearGradient id="suitLight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="skinLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {/* Soft realistic isometric ambient ground shadow */}
        <ellipse
          cx="16"
          cy={isSitting ? "41.5" : "42.5"}
          rx={isSitting ? "13.5" : "11"}
          ry={isSitting ? "4.5" : "3.6"}
          fill={own ? "#dfbe7a" : "#080a0a"}
          opacity={own ? 0.46 : 0.38}
          className="avatar-ground-shadow"
        />

        {/* Character container (supports 4-direction isometric facing) */}
        <g transform={isFlipped ? "translate(32, 0) scale(-1, 1)" : undefined}>
          {isBack ? (
            /* ============================================================
               ISOMETRIC BACK SPRITE (ul / ur)
               ============================================================ */
            <g className="avatar-body-group">
              {/* Lower Body */}
              {isSitting ? (
                <g className="avatar-legs-seated-back">
                  <path d="M8 27H24V34H8Z" fill="#24282f" />
                  <path d="M9 34H15V41H9Z" fill="#191c21" />
                  <path d="M17 34H23V41H17Z" fill="#14171b" />
                  <path d="M8 39H15V43H8Z" fill="#0c0e10" />
                  <path d="M16 39H23V43H16Z" fill="#0c0e10" />
                </g>
              ) : (
                <g className={`avatar-legs-back ${isWalking ? "anim-walk-legs" : ""}`}>
                  <path d="M10 28H15V40H9V35H10V28Z" fill="#262b32" />
                  <path d="M17 28H22V40H16V35H17V28Z" fill="#1c2026" />
                  <path d="M8 38H15V42H8Z" fill="#101214" />
                  <path d="M16 38H23V42H16Z" fill="#0a0c0e" />
                </g>
              )}

              {/* Back Torso / Suit Jacket */}
              <g transform={isSitting ? "translate(0, 2)" : undefined} className="avatar-torso-breathe">
                <path d="M8 18H24V29H8Z" fill={suitColor} />
                <path d="M8 18H24V29H8Z" fill="url(#suitLight)" />
                <path d="M15 20H17V29H15Z" fill="#000" opacity=".22" /> {/* Center back vent */}
                <path d="M5 20H8V28H5Z" fill={suitColor} />
                <path d="M24 20H27V28H24Z" fill={suitColor} />
                <path d="M5 28H8V32H5Z" fill={skin} />
                <path d="M24 28H27V32H24Z" fill={skin} />

                {/* Shirt Collar back */}
                <path d="M12 16H20V19H12Z" fill="#f4f1ea" />

                {/* Head / Hair Back */}
                <path d="M8 4H24V18H8Z" fill={hair} />
                <path d="M6 7H9V16H6Z" fill={hair} />
                <path d="M23 7H26V16H23Z" fill={hair} />
                <path d="M9 4H23V6H9Z" fill="#ffffff" opacity=".16" />

                {/* Female layered hair back */}
                {female && (
                  <g>
                    <path d="M10 15H22V26H10Z" fill={hair} />
                    <path d="M12 26H20V29H12Z" fill={hair} />
                    <path d="M14 15H18V17H14Z" fill="#d9b66c" /> {/* Gold accessory tie */}
                  </g>
                )}
              </g>
            </g>
          ) : (
            /* ============================================================
               ISOMETRIC FRONT SPRITE (dl / dr)
               ============================================================ */
            <g className="avatar-body-group">
              {/* Lower Body */}
              {isSitting ? (
                <g className="avatar-legs-seated-front">
                  {/* Seated Thighs on Chair */}
                  <path d="M8 25H24V31H8Z" fill="#2d333c" />
                  <path d="M8 25H24V27H8Z" fill="#3c434f" />
                  {/* Calves hanging down */}
                  <path d="M10 31H15V39H10Z" fill="#23272e" />
                  <path d="M17 31H22V39H17Z" fill="#1b1f24" />
                  {/* Shoes planted flat */}
                  <path d="M8 38H15V42H7V40H8Z" fill="#0f1113" />
                  <path d="M17 38H24V42H16V40H17Z" fill="#090a0c" />
                  {/* Jacket Lap overlay */}
                  <path d="M8 24H24V27H8Z" fill={suitColor} />
                  {/* Hands resting on lap */}
                  <path d="M9 26H13V30H9Z" fill={skin} />
                  <path d="M19 26H23V30H19Z" fill={skin} />
                </g>
              ) : (
                <g className={`avatar-legs-front ${isWalking ? "anim-walk-legs" : ""}`}>
                  <path d="M10 28H16V38H9V35H10V28Z" fill="#2c323a" />
                  <path d="M16 28H22V38H16V28Z" fill="#21262d" />
                  <path d="M8 37H15V41H7V39H8ZM17 37H24V41H16V39H17Z" fill="#0f1113" />
                  <path d="M9 37H15V39H9Z" fill="#383e48" opacity=".4" />
                </g>
              )}

              {/* Torso & Upper Body with gentle breathing */}
              <g transform={isSitting ? "translate(0, 2)" : undefined} className="avatar-torso-breathe">
                {/* Suit Jacket */}
                <path d="M8 18H24V28H8Z" fill={suitColor} />
                <path d="M8 18H24V28H8Z" fill="url(#suitLight)" />
                <path d="M8 18H11V28H8Z" fill="#000" opacity=".18" />

                {/* White Shirt Collar & Executive Tie */}
                <path d="M13 17H19V23H13Z" fill="#f8f5ee" />
                <path d="M15 19H17V25H15Z" fill="#1a1c1e" />
                <path d="M15 20H17V22H15Z" fill="#c7a66e" /> {/* Gold tie accent */}

                {/* Left Arm */}
                <path d="M5 20H8V28H5Z" fill={suitColor} />
                <path d="M4 27H8V32H4Z" fill={skin} />

                {/* Right Arm (Normal or Animated Wave) */}
                {isWaving ? (
                  <g className="anim-waving-arm">
                    <path d="M23 14H27V22H23Z" fill={suitColor} />
                    <path d="M24 9H28V14H24Z" fill={skin} />
                  </g>
                ) : (
                  <g>
                    <path d="M24 20H27V28H24Z" fill={suitColor} />
                    <path d="M24 27H28V32H24Z" fill={skin} />
                  </g>
                )}

                {/* Female gold necklace accent */}
                {female && (
                  <g>
                    <path d="M13 17H19V19H13Z" fill="#dfc07b" />
                    <circle cx="16" cy="20" r="1.1" fill="#f3da9e" />
                  </g>
                )}
              </g>

              {/* Neck & Head */}
              <g transform={isSitting ? "translate(0, 2)" : undefined} className="avatar-head-group">
                <path d="M12 15H20V19H12Z" fill={skin} />
                <path d="M9 4H21V7H24V14H22V17H10V15H7V8H9Z" fill={skin} />
                <path d="M9 4H21V7H24V14H22V17H10V15H7V8H9Z" fill="url(#skinLight)" />

                {/* Hairstyle */}
                {female ? (
                  <g>
                    {/* Layered chic female hairstyle */}
                    <path d="M7 2H23V6H25V11H23V5H9V11H7V6H9V3H7Z" fill={hair} />
                    <path d="M8 3H22V7H20V9H18V7H14V9H12V7H8Z" fill={hair} />
                    <path d="M22 7H25V23H22V19H23V13H22Z" fill={hair} />
                    <path d="M9 3H21V5H9Z" fill="#ffffff" opacity=".2" />
                    {/* Rosy cheeks */}
                    <rect x="9" y="13" width="2" height="1.5" fill="#e4877c" opacity=".6" />
                    <rect x="20" y="13" width="2" height="1.5" fill="#e4877c" opacity=".6" />
                    <circle cx="23.5" cy="13" r="0.9" fill="#e8d5a4" />
                  </g>
                ) : (
                  <g>
                    {/* Polished executive male side-part */}
                    <path d="M9 3H20V4H23V8H24V11H21V7H13V9H8V13H6V7H8V4H9Z" fill={hair} />
                    <path d="M10 3H19V5H10Z" fill="#ffffff" opacity=".2" />
                  </g>
                )}

                {/* Realistic Eyes with Natural Blinking Animation */}
                <g className="avatar-eyes">
                  <path d="M10 10H12V12H10ZM18 10H20V12H18Z" fill="#282220" />
                  <rect x="11" y="10" width="1" height="1" fill="#ffffff" opacity=".85" />
                  <rect x="19" y="10" width="1" height="1" fill="#ffffff" opacity=".85" />
                </g>

                {/* Nose & Mouth */}
                <path d="M15 12H17V14H15Z" fill="#b98263" opacity=".45" />
                <path d="M14 15H18V16H14Z" fill="#a1664e" />
              </g>
            </g>
          )}
        </g>
      </svg>

      {/* Floating Hand Wave Bubble */}
      {isWaving && <span className="wave-bubble">👋</span>}

      {/* Live Speaking Indicator Waves */}
      {member.micEnabled && (
        <span className="avatar-speaking-waves" title="Falando">
          <i /><i /><i />
        </span>
      )}

      {/* Seated Subtle Badge */}
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
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
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
