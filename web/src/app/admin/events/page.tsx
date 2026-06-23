import { permanentRedirect } from "next/navigation";

export default function LegacyAdminEventsPage() {
  permanentRedirect("/cabinet/competitions");
}
