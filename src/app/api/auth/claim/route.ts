export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json(
    { error: "Links individuais foram desativados. Entre com seu email e senha pessoais." },
    { status: 410 }
  );
}
