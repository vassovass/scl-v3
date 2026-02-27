"use client";

import { useState } from "react";
import { FormInput, FormSelect } from "@/components/ui/form-fields";
import { useRouter } from "next/navigation";

/**
 * B2B Waitlist Signup Form
 *
 * Captures email + optional company info for corporate wellness leads.
 * Minimal friction: only email is required.
 *
 * PRD 34 — B2B Landing Pages
 */

interface WaitlistFormProps {
  source?: string;
}

export function WaitlistForm({ source = "website" }: WaitlistFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      company_name: formData.get("company_name") as string || undefined,
      company_size: formData.get("company_size") as string || undefined,
      role: formData.get("role") as string || undefined,
      source,
    };

    if (!data.email || !data.email.includes("@")) {
      setErrors({ email: "Please enter a valid email address" });
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/teams/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 429) {
        setErrors({ email: "Too many requests. Please try again in a minute." });
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setErrors({ email: errorData.error || "Something went wrong. Please try again." });
        setSubmitting(false);
        return;
      }

      router.push("/teams/waitlist");
    } catch {
      setErrors({ email: "Network error. Please try again." });
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <FormInput
        fieldName="email"
        label="Work Email"
        type="email"
        placeholder="you@company.com"
        required
        error={errors.email}
      />
      <FormInput
        fieldName="company_name"
        label="Company Name"
        placeholder="Acme Corp"
      />
      <div className="grid grid-cols-2 gap-3">
        <FormSelect fieldName="company_size" label="Team Size">
          <option value="">Select size...</option>
          <option value="1-50">1-50</option>
          <option value="51-200">51-200</option>
          <option value="201-500">201-500</option>
          <option value="500+">500+</option>
        </FormSelect>
        <FormSelect fieldName="role" label="Your Role">
          <option value="">Select role...</option>
          <option value="HR">HR</option>
          <option value="Wellness">Wellness</option>
          <option value="Team Lead">Team Lead</option>
          <option value="Other">Other</option>
        </FormSelect>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 px-6 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {submitting ? "Joining..." : "Join the Waitlist"}
      </button>
      <p className="text-xs text-muted-foreground text-center">
        No spam. We'll only email you when Teams launches.
      </p>
    </form>
  );
}
