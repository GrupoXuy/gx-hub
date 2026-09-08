import type { LucideIcon } from "lucide-react";
import { Layers3, Smartphone, Sprout } from "lucide-react";

export type EcosystemCompany = {
  id: string;
  name: string;
  description: string;
  /** Destino principal do card (abre em nova aba). */
  href: string;
  hrefLabel: string;
  /** Link secundário discreto (somente Senna Cell X). */
  instagram?: string;
  /** Caminho da logomarca oficial em /public. Sem distorção: object-fit contain. */
  logo: string;
  /** Ícone de fallback (Lucide) exibido apenas se o arquivo da logo ainda não existir. */
  icon: LucideIcon;
  iconClass: string;
};

export const ECOSYSTEM_COMPANIES: EcosystemCompany[] = [
  {
    id: "senna-cell-x",
    name: "Senna Cell X",
    description: "Tecnologia, assistência técnica e soluções para dispositivos.",
    href: "https://sennacellxuy.lovable.app",
    hrefLabel: "Abrir site da Senna Cell X em nova aba",
    instagram: "https://www.instagram.com/sennacellx.uy/",
    logo: "/images/ecosystem/senna-cell-x.png",
    icon: Smartphone,
    iconClass: "cell",
  },
  {
    id: "grupo-reis-x",
    name: "Grupo Reis X",
    description: "Negócios, oportunidades e soluções.",
    href: "https://www.instagram.com/gruporeisx/",
    hrefLabel: "Abrir Instagram do Grupo Reis X em nova aba",
    logo: "/images/ecosystem/grupo-reis-x.png",
    icon: Layers3,
    iconClass: "reis",
  },
  {
    id: "primeiro-passo-x",
    name: "Primeiro Passo X",
    description: "Conexões, oportunidades e orientação profissional.",
    href: "https://www.instagram.com/primeiropassox/",
    hrefLabel: "Abrir Instagram do Primeiro Passo X em nova aba",
    logo: "/images/ecosystem/primeiro-passo-x.png",
    icon: Sprout,
    iconClass: "passo",
  },
];

export function ecosystemByName(name?: string): EcosystemCompany | undefined {
  return ECOSYSTEM_COMPANIES.find((company) => company.name === name);
}
