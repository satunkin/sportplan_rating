import { permanentRedirect } from "next/navigation";

export default function LegacyAdminBroadcastsPage() {
  permanentRedirect("/cabinet/broadcasts");
}
