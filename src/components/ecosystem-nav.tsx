"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ECOSYSTEM_COMPANIES, type EcosystemCompany } from "@/lib/ecosystem";

export function InstagramGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EcosystemLogo({ company, size = 40 }: { company: EcosystemCompany; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="ecosystem-logo" style={{ width: size, height: size }}>
      {!failed ? <img src={company.logo} alt="" loading="lazy" onError={() => setFailed(true)} /> : <span className={`company-nav-icon ${company.iconClass}`} aria-hidden="true"><company.icon size={Math.max(13, Math.round(size * .42))} strokeWidth={1.5} /></span>}
    </span>
  );
}

export function EcosystemNav({ onCompany, onExplore }: { onCompany: (company: EcosystemCompany) => void; onExplore: () => void }) {
  return (
    <div className="ecosystem-nav">
      <span className="nav-group-label">NOSSO ECOSSISTEMA<span className="tiny-x">✧</span></span>
      <div className="ecosystem-cards">
        {ECOSYSTEM_COMPANIES.map((company) => (
          <div className="ecosystem-card" key={company.id}>
            <button className="ecosystem-nav-item ecosystem-card-main" onClick={() => onCompany(company)} aria-label={`Abrir detalhes de ${company.name}`}>
              <EcosystemLogo company={company} size={25} />
              <span>{company.name}</span>
              <ArrowUpRight size={12} />
            </button>
            <a className="ecosystem-tab-link" href={company.href} target="_blank" rel="noopener noreferrer" aria-label={`Abrir canal principal de ${company.name} em nova aba`} title="Abrir canal oficial">
              <ArrowUpRight size={12} />
            </a>
          </div>
        ))}
      </div>
      <button className="ecosystem-explore" onClick={onExplore}>Explorar ecossistema<ArrowRight size={12} /></button>
    </div>
  );
}
