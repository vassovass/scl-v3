import { redirect } from "next/navigation";

// Redirect /settings to /settings/profile
export default function SettingsPage() {
    redirect("/settings/profile");
}
