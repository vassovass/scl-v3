import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";

/**
 * B2B Waitlist API
 *
 * Captures corporate wellness interest from /teams landing page.
 * Public endpoint with rate limiting to prevent spam.
 *
 * PRD 34 — B2B Landing Pages
 */

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  company_name: z.string().max(200).optional(),
  company_size: z.enum(["1-50", "51-200", "201-500", "500+"]).optional(),
  role: z.enum(["HR", "Wellness", "Team Lead", "Other"]).optional(),
  source: z.string().max(100).optional(),
});

export const POST = withApiHandler(
  {
    auth: "none",
    schema: waitlistSchema,
    rateLimit: { maxRequests: 3, windowMs: 60_000 },
  },
  async ({ body, adminClient }) => {
    // Check for existing email
    const { data: existing } = await adminClient
      .from("b2b_waitlist")
      .select("id")
      .eq("email", body.email)
      .single();

    if (existing) {
      return { success: true, message: "You're already on the waitlist!" };
    }

    const { error } = await adminClient.from("b2b_waitlist").insert({
      email: body.email,
      company_name: body.company_name || null,
      company_size: body.company_size || null,
      role: body.role || null,
      source: body.source || "website",
    });

    if (error) {
      throw error;
    }

    return { success: true, message: "Welcome to the waitlist!" };
  }
);
