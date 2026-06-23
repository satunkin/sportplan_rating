import { permanentRedirect } from "next/navigation";

export default function LegacyAdminAthletesPage() {
  permanentRedirect("/cabinet/athletes");
}
