export type View = "office" | "rooms" | "team" | "agenda" | "director";
export type Member = {
  id: string; name: string; role: string; company: string; avatar: string; color: string;
  roomId: string; status: string; x: number; y: number; isDemo: boolean; isAdmin: boolean;
  canAccessGroupSystem: boolean; gender?: string | null; email?: string | null; accessToken?: string | null; handRaised: boolean;
  callRoom: string | null; micEnabled: boolean; cameraEnabled: boolean; lastSeen?: string;
};
export const GENDER_OPTIONS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
];
export type RosterEntry = {
  id: string; name: string; role: string; company: string; avatar: string; color: string;
  isAdmin: boolean; online: boolean;
};
export type Room = { id: string; name: string; description: string; kind: string; capacity: number; color: string };
export type Message = { id: string; senderId: string; roomId: string; content: string; createdAt: string; sender: Member };
export type Meeting = { id: string; title: string; description: string; roomId: string; startsAt: string; duration: number; organizerId: string };
export type Workspace = { me: Member; members: Member[]; team: Member[]; rooms: Room[]; messages: Message[]; meetings: Meeting[] };
export type AuthNeeded = { needsAuth: true; users: RosterEntry[]; inviteRequired: boolean };
export const ROOM_DATA: Room[] = [
  { id: "recepcao", name: "Recepção", description: "O começo de todas as boas conexões. Chegue, encontre a equipe e sinta-se em casa.", kind: "reception", capacity: 20, color: "#c7a66e" },
  { id: "coworking", name: "Coworking", description: "Ideias lado a lado. Seu espaço para trabalhar, colaborar e fazer acontecer.", kind: "work", capacity: 12, color: "#8faaa0" },
  { id: "estrategia", name: "Sala de estratégia", description: "Grandes decisões merecem um lugar à altura. Alinhe os próximos passos da sua empresa.", kind: "meeting", capacity: 8, color: "#c7a66e" },
  { id: "lounge", name: "Lounge & café", description: "Uma pausa, um café, uma nova ideia. Aqui, a conversa flui sem pauta.", kind: "lounge", capacity: 10, color: "#ba947b" },
  { id: "diretoria", name: "Sala da diretoria", description: "Foco no que importa. Um ambiente reservado para as conversas que transformam.", kind: "private", capacity: 6, color: "#9c93b5" },
];
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=96&h=96&q=80`;
export const DEFAULT_ME: Member = {
  id: "local", name: "Henrique Senna", role: "Fundador & CEO", company: "Grupo X",
  avatar: photo("photo-1472099645785-5658abf4ff4e"), color: "#c7a66e", roomId: "recepcao",
  status: "available", x: 61, y: 73, isDemo: false, isAdmin: false, canAccessGroupSystem: true, accessToken: null,
  handRaised: false, callRoom: null, micEnabled: false, cameraEnabled: false,
};
export const AVATAR_COLORS = [
  { value: "#c7a66e", name: "Dourado Grupo X" },
  { value: "#839c83", name: "Verde sálvia" },
  { value: "#7295a1", name: "Azul oceano" },
  { value: "#b29bc3", name: "Lilás" },
  { value: "#c58b77", name: "Terracota" },
  { value: "#c4c9ca", name: "Prata" },
];
export const ROOM_POSITIONS: Record<string, { x: number; y: number }> = {
  recepcao: { x: 61, y: 73 }, coworking: { x: 61, y: 47 }, estrategia: { x: 42, y: 48 }, lounge: { x: 36, y: 68 }, diretoria: { x: 48, y: 39 },
};
export const COMPANY_DATA = [
  { name: "Grupo X", category: "Ecossistema empresarial", description: "Construindo empresas. Desenvolvendo empresários. Criando oportunidades.", color: "#c7a66e" },
  { name: "Senna Cell X", category: "Tecnologia & inovação", description: "Tecnologia aplicada para conectar pessoas, empresas e inovação. Soluções de varejo, serviços e conectividade.", color: "#aeb9c2" },
  { name: "Grupo Reis X", category: "Serviços empresariais", description: "Excelência operacional com foco em eficiência, organização e execução consistente.", color: "#87a195" },
  { name: "Primeiro Passo X", category: "Desenvolvimento humano", description: "Recrutamento e desenvolvimento humano para preparar profissionais e conectar talentos a oportunidades globais.", color: "#9c95b4" },
  { name: "Mazari Trading X", category: "Mercado financeiro", description: "Informação e inteligência de mercado para quem investe no próximo capítulo.", color: "#9bacba" },
];
export const STATUS_LABELS: Record<string, string> = { available: "Disponível", busy: "Em foco", away: "Ausente" };
export function initials(name: string) { return name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join(""); }
export function timeLabel(date: string | Date) { return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
export function dayLabel(date: string | Date) { return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }); }
export function isOnline(lastSeen?: string | Date | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 60000;
}
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || "Não foi possível concluir. Tente novamente.") as Error & { status?: number; data?: unknown };
    error.status = response.status; error.data = body;
    throw error;
  }
  return body as T;
}
