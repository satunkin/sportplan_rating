import { permanentRedirect } from "next/navigation";

export default async function LegacyAdminCompetitionEditPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  permanentRedirect(`/cabinet/competitions/${eventId}/edit`);
}
