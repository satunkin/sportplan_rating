import { permanentRedirect } from "next/navigation";

export default function LegacyAdminLoginPage() {
  permanentRedirect("/cabinet/admin-login");
}
