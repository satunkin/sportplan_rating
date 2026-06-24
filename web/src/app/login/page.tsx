import { permanentRedirect } from "next/navigation";

export default function AthleteLoginPage() {
  permanentRedirect("/cabinet/admin-login");
}
