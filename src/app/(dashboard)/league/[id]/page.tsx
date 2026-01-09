import { redirect } from "next/navigation";

/**
 * League Root Page - Redirects to overview
 * 
 * Using redirect pattern for flexibility:
 * - If we want to change the default page later, we update one line
 * - No need to refactor content - the hub lives at /league/[id]/overview
 */
export default function LeaguePage({ params }: { params: { id: string } }) {
  redirect(`/league/${params.id}/overview`);
}
