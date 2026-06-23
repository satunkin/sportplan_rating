import { permanentRedirect } from "next/navigation";

export default function LegacyAdminDirectoriesPage() {
  permanentRedirect("/cabinet/directories");
}
