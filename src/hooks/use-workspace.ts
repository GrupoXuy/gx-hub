"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, DEFAULT_ME, DEMO_MEMBERS, ROOM_DATA, type Workspace, type Member } from "@/lib/workspace";
export function useWorkspace() {
  const [data, setData] = useState<Workspace>({ me: DEFAULT_ME, members: [DEFAULT_ME, ...DEMO_MEMBERS], rooms: ROOM_DATA, messages: [], meetings: [] });
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const fetching = useRef(false);
  const mutating = useRef(0);
  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const next = await api<Workspace>("/api/workspace");
      setData(previous => mutating.current ? { ...next, me: previous.me, members: next.members.map(m => m.id === previous.me.id ? previous.me : m) } : next);
      setConnected(true); setError("");
    } catch (err) { setConnected(false); setError(err instanceof Error ? err.message : "Não foi possível conectar ao escritório."); }
    finally { fetching.current = false; }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 4000);
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [refresh]);
  const updateMe = useCallback(async (patch: Partial<Member>) => {
    mutating.current++;
    setData(previous => ({ ...previous, me: { ...previous.me, ...patch }, members: previous.members.map(m => m.id === previous.me.id ? { ...m, ...patch } : m) }));
    try {
      const me = await api<Member>("/api/workspace", { method: "PATCH", body: JSON.stringify(patch) });
      setData(previous => ({ ...previous, me, members: previous.members.map(m => m.id === me.id ? me : m) }));
      return me;
    } finally { mutating.current--; if (mutating.current === 0) void refresh(); }
  }, [refresh]);
  return { data, setData, connected, error, refresh, updateMe };
}
