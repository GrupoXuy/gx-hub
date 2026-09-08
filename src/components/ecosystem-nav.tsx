"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ECOSYSTEM_COMPANIES, type EcosystemCompany } from "@/lib/ecosystem";

export function InstagramGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EcosystemLogo({ company, size = 40 }: { company: EcosystemCompany; size?: number }) {
  const [failed, setFailed] = useState(false);
  const Icon = company.icon;
  return (
    <span className="ecosystem-logo" style={{ width: size, height: size }}>
      {!failed ? (
        <img src={company.logo} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className={`company-nav-icon ${company.iconClass}`}>
          <Icon size={15} strokeWidth={1.5} />
        </span>
      )}
    </span>
  );
}

export function EcosystemNav({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="ecosystem-nav">
      <span className="nav-group-label">
        NOSSO ECOSSISTEMA<span className="tiny-x">✧</span>
      </span>
      <div className="ecosystem-cards">
        {ECOSYSTEM_COMPANIES.map((company) => (
          <div className="ecosystem-card" key={company.id}>
            <a
              className="ecosystem-card-main"
              href={company.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={company.hrefLabel}
            >
              <EcosystemLogo company={company} />
              <span className="ecosystem-card-text">
                <strong>{company.name}</strong>
                <small>{company.description}</small>
              </span>
              <ArrowUpRight size={13} className="ecosystem-go" />
            </a>
            {company.instagram && (
              <a
                className="ecosystem-instagram"
                href={company.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir Instagram da ${company.name} em nova aba`}
                title="Instagram"
              >
                <InstagramGlyph size={15} />
              </a>
            )}
          </div>
        ))}
      </div>
      <button className="ecosystem-explore" onClick={onExplore}>
        Explorar ecossistema<ArrowRight size={12} />
      </button>
    </div>
  );
}
