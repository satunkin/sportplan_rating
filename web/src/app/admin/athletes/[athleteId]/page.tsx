import { permanentRedirect } from "next/navigation";

export default async function LegacyAdminAthletePage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  permanentRedirect(`/cabinet/athletes/${athleteId}`);
}
