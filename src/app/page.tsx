import WorkspaceApp from "@/components/workspace-app";
import ClientMeetingPage from "@/components/client-meeting-page";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const params = await searchParams;
  if (params.cliente) return <ClientMeetingPage token={params.cliente} />;
  return <WorkspaceApp />;
}
