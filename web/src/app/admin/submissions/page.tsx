import { permanentRedirect } from "next/navigation";

export default function LegacyAdminSubmissionsPage() {
  permanentRedirect("/cabinet/submissions");
}
