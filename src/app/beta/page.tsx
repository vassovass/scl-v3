import { redirect } from "next/navigation";

export default function BetaNoticePage() {
    // Redirect to the new stage-info page
    redirect("/stage-info");
}
