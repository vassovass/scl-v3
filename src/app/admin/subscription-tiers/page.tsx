"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/components/ui/form-fields";
import {
  SubscriptionTier,
  SubscriptionTierWithCount,
  CreateTierInput,
  formatCents,
  centsToDollars,
  dollarsToCents,
  isContactTier,
} from "@/lib/subscriptions/types";

// ============================================================================
// Types
// ============================================================================

interface TierFormState {
  slug: string;
  name: string;
  description: string;
  monthly_price_dollars: string; // display as dollars, convert on save
  annual_price_dollars: string;
  member_limit: string; // empty string = unlimited
  sort_order: string;
  grace_period_days: string;
  features_raw: string; // JSON string for the JSONB editor
}

const EMPTY_FORM: TierFormState = {
  slug: "",
  name: "",
  description: "",
  monthly_price_dollars: "0.00",
  annual_price_dollars: "0.00",
  member_limit: "",
  sort_order: "0",
  grace_period_days: "7",
  features_raw: "{}",
};

function tierToForm(tier: SubscriptionTier): TierFormState {
  return {
    slug: tier.slug,
    name: tier.name,
    description: tier.description ?? "",
    monthly_price_dollars: centsToDollars(tier.monthly_price_cents),
    annual_price_dollars: centsToDollars(tier.annual_price_cents),
    member_limit: tier.member_limit != null ? String(tier.member_limit) : "",
    sort_order: String(tier.sort_order),
    grace_period_days: String(tier.grace_period_days),
    features_raw: JSON.stringify(tier.features, null, 2),
  };
}

// ============================================================================
// Tier Form Dialog
// ============================================================================

interface TierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: SubscriptionTier | null; // null = create mode
  onSaved: () => void;
}

function TierFormDialog({ open, onOpenChange, tier, onSaved }: TierFormDialogProps) {
  const isEdit = tier != null;
  const [form, setForm] = useState<TierFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof TierFormState, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(tier ? tierToForm(tier) : EMPTY_FORM);
      setErrors({});
    }
  }, [open, tier]);

  const set = (key: keyof TierFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  function validate(): boolean {
    const errs: Partial<Record<keyof TierFormState, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.slug.trim()) errs.slug = "Slug is required";
    if (!/^[a-z0-9-]+$/.test(form.slug)) errs.slug = "Lowercase letters, numbers, hyphens only";
    const monthly = parseFloat(form.monthly_price_dollars);
    if (isNaN(monthly) || monthly < 0) errs.monthly_price_dollars = "Must be 0 or greater";
    const annual = parseFloat(form.annual_price_dollars);
    if (isNaN(annual) || annual < 0) errs.annual_price_dollars = "Must be 0 or greater";
    if (form.member_limit !== "" && (isNaN(parseInt(form.member_limit)) || parseInt(form.member_limit) < 1)) {
      errs.member_limit = "Must be a positive number or empty for unlimited";
    }
    try {
      JSON.parse(form.features_raw);
    } catch {
      errs.features_raw = "Invalid JSON";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: CreateTierInput = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        monthly_price_cents: dollarsToCents(form.monthly_price_dollars),
        annual_price_cents: dollarsToCents(form.annual_price_dollars),
        member_limit: form.member_limit !== "" ? parseInt(form.member_limit) : null,
        is_active: true,
        sort_order: parseInt(form.sort_order) || 0,
        features: JSON.parse(form.features_raw),
        grace_period_days: parseInt(form.grace_period_days) || 7,
      };

      const url = isEdit
        ? `/api/admin/subscription-tiers/${tier!.id}`
        : "/api/admin/subscription-tiers";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save tier");
      }

      toast.success(isEdit ? "Tier updated" : "Tier created");
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Failed to save tier");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tier" : "Create Tier"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              fieldName="name"
              label="Name"
              value={form.name}
              onChange={set("name")}
              placeholder="Standard"
              error={errors.name}
              required
            />
            <FormInput
              fieldName="slug"
              label="Slug"
              value={form.slug}
              onChange={set("slug")}
              placeholder="standard"
              error={errors.slug}
              required
              disabled={isEdit} // slug is immutable after creation
              hint={isEdit ? "Slug cannot be changed after creation" : undefined}
            />
          </div>

          <FormInput
            fieldName="description"
            label="Description"
            value={form.description}
            onChange={set("description")}
            placeholder="For growing groups who want more members."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              fieldName="monthly_price_dollars"
              label="Monthly Price ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.monthly_price_dollars}
              onChange={set("monthly_price_dollars")}
              error={errors.monthly_price_dollars}
              hint="Stored as cents internally"
            />
            <FormInput
              fieldName="annual_price_dollars"
              label="Annual Price ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.annual_price_dollars}
              onChange={set("annual_price_dollars")}
              error={errors.annual_price_dollars}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormInput
              fieldName="member_limit"
              label="Member Limit"
              type="number"
              min="1"
              value={form.member_limit}
              onChange={set("member_limit")}
              placeholder="Leave empty for unlimited"
              error={errors.member_limit}
              hint="Empty = unlimited"
            />
            <FormInput
              fieldName="sort_order"
              label="Sort Order"
              type="number"
              min="0"
              value={form.sort_order}
              onChange={set("sort_order")}
            />
            <FormInput
              fieldName="grace_period_days"
              label="Grace Period (days)"
              type="number"
              min="0"
              max="90"
              value={form.grace_period_days}
              onChange={set("grace_period_days")}
              hint="Access after failed payment"
            />
          </div>

          {/* Features JSONB editor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Features <span className="text-muted-foreground font-normal">(JSON)</span>
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-y"
              value={form.features_raw}
              onChange={set("features_raw")}
              placeholder='{"analytics": true, "custom_goals": true}'
              spellCheck={false}
            />
            {errors.features_raw && (
              <p className="text-xs text-destructive">{errors.features_raw}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Key-value pairs of feature flags unlocked by this tier.
            </p>
          </div>

          {/* Price preview */}
          {(parseFloat(form.monthly_price_dollars) > 0 || parseFloat(form.annual_price_dollars) > 0) && (
            <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Preview:{" "}
              <span className="text-foreground font-medium">
                {formatCents(dollarsToCents(form.monthly_price_dollars))}/mo
              </span>{" "}
              or{" "}
              <span className="text-foreground font-medium">
                {formatCents(dollarsToCents(form.annual_price_dollars))}/yr
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Tier"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function SubscriptionTiersPage() {
  const { getSetting, getNumericSetting, isFeatureEnabled, updateSetting, isLoading: settingsLoading } = useAppSettings();

  const [tiers, setTiers] = useState<SubscriptionTierWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);

  // Deactivate confirmation
  const [deactivateTarget, setDeactivateTarget] = useState<SubscriptionTierWithCount | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  // Settings saving state
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadTiers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all tiers (admin endpoint includes inactive)
      const res = await fetch("/api/admin/subscription-tiers");
      if (!res.ok) throw new Error("Failed to load tiers");
      const json = await res.json();

      // Enrich each tier with active_league_count via individual GET
      const enriched = await Promise.all(
        (json.tiers as SubscriptionTier[]).map(async (tier) => {
          try {
            const detailRes = await fetch(`/api/admin/subscription-tiers/${tier.id}`);
            if (!detailRes.ok) return { ...tier, active_league_count: 0 };
            const detail = await detailRes.json();
            return detail.tier as SubscriptionTierWithCount;
          } catch {
            return { ...tier, active_league_count: 0 };
          }
        })
      );

      setTiers(enriched);
    } catch (err: any) {
      toast.error(err.message || "Failed to load tiers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  async function handleSettingToggle(key: string, value: boolean) {
    setSavingKey(key);
    try {
      await updateSetting(key, value);
      toast.success("Setting updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update setting");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleFreeLimitChange(value: string) {
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 100) return;
    setSavingKey("free_tier_member_limit");
    try {
      await updateSetting("free_tier_member_limit", num);
      toast.success("Free tier limit updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update setting");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      const res = await fetch(`/api/admin/subscription-tiers/${deactivateTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to deactivate tier");
      }
      toast.success(`"${deactivateTarget.name}" deactivated`);
      setDeactivateTarget(null);
      await loadTiers();
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate tier");
    } finally {
      setDeactivating(false);
    }
  }

  async function handleActivate(tier: SubscriptionTier) {
    try {
      const res = await fetch(`/api/admin/subscription-tiers/${tier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      if (!res.ok) throw new Error("Failed to activate tier");
      toast.success(`"${tier.name}" activated`);
      await loadTiers();
    } catch (err: any) {
      toast.error(err.message || "Failed to activate tier");
    }
  }

  const payGateEnabled = isFeatureEnabled("feature_pay_gate");
  const payGateGlobal = isFeatureEnabled("pay_gate_global");
  const freeTierLimit = getNumericSetting("free_tier_member_limit", 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription Tiers</h1>
          <p className="text-muted-foreground mt-1">
            Manage pricing tiers and pay gate configuration. All values are configurable — no code deploys needed.
          </p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Pay Gate Controls */}
        {/* ------------------------------------------------------------------ */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Pay Gate Controls</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Control when the paywall is active. The master switch must be on before the global toggle takes effect.
            </p>
          </div>

          <div className="space-y-4">
            {/* Master switch */}
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3">
              <div>
                <Label htmlFor="feature_pay_gate" className="font-medium text-foreground">
                  Pay Gate Feature
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Master switch — enables the entire billing system. Off = all leagues behave as free.
                </p>
              </div>
              <Switch
                id="feature_pay_gate"
                checked={settingsLoading ? false : payGateEnabled}
                disabled={settingsLoading || savingKey === "feature_pay_gate"}
                onCheckedChange={(checked) => handleSettingToggle("feature_pay_gate", checked)}
              />
            </div>

            {/* Global enforcement */}
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3">
              <div>
                <Label htmlFor="pay_gate_global" className="font-medium text-foreground">
                  Global Pay Gate
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enforce pay gate across all leagues. Per-league overrides take precedence.
                  {!payGateEnabled && (
                    <span className="text-amber-500 ml-1">(Requires master switch to be on)</span>
                  )}
                </p>
              </div>
              <Switch
                id="pay_gate_global"
                checked={settingsLoading ? false : payGateGlobal}
                disabled={settingsLoading || savingKey === "pay_gate_global" || !payGateEnabled}
                onCheckedChange={(checked) => handleSettingToggle("pay_gate_global", checked)}
              />
            </div>

            {/* Free tier member limit */}
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex-1">
                <Label className="font-medium text-foreground">Free Tier Member Limit</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Leagues at or above this member count trigger the pay gate.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={freeTierLimit}
                  key={freeTierLimit} // re-mount when value changes externally
                  disabled={settingsLoading || savingKey === "free_tier_member_limit"}
                  onBlur={(e) => handleFreeLimitChange(e.target.value)}
                  className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <span className="text-sm text-muted-foreground">members</span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Tier Table */}
        {/* ------------------------------------------------------------------ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Tiers</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {tiers.length} tier{tiers.length !== 1 ? "s" : ""} configured
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setEditingTier(null); setFormOpen(true); }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              + Add Tier
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
              Loading tiers…
            </div>
          ) : tiers.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
              No tiers found.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monthly</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Annual</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Members</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Leagues</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tiers.map((tier) => (
                      <tr key={tier.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{tier.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tier.slug}</td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {isContactTier(tier) ? "—" : formatCents(tier.monthly_price_cents)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {isContactTier(tier) ? "Contact" : formatCents(tier.annual_price_cents)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {tier.member_limit != null ? tier.member_limit : "∞"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {tier.active_league_count}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            tier.is_active
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {tier.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => { setEditingTier(tier); setFormOpen(true); }}
                              className="text-xs text-muted-foreground hover:text-foreground transition"
                            >
                              Edit
                            </button>
                            {tier.is_active ? (
                              <button
                                type="button"
                                onClick={() => setDeactivateTarget(tier)}
                                className="text-xs text-rose-500 hover:text-rose-400 transition"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleActivate(tier)}
                                className="text-xs text-emerald-500 hover:text-emerald-400 transition"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {tiers.map((tier) => (
                  <div key={tier.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{tier.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{tier.slug}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
                        tier.is_active
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {tier.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>
                        {isContactTier(tier) ? "Contact us" : `${formatCents(tier.monthly_price_cents)}/mo`}
                      </span>
                      <span>{tier.member_limit != null ? `${tier.member_limit} members` : "Unlimited"}</span>
                      <span>{tier.active_league_count} leagues</span>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => { setEditingTier(tier); setFormOpen(true); }}
                        className="text-xs text-muted-foreground hover:text-foreground transition"
                      >
                        Edit
                      </button>
                      {tier.is_active ? (
                        <button
                          type="button"
                          onClick={() => setDeactivateTarget(tier)}
                          className="text-xs text-rose-500 hover:text-rose-400 transition"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleActivate(tier)}
                          className="text-xs text-emerald-500 hover:text-emerald-400 transition"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Info note for PRD 75 */}
        <p className="text-xs text-muted-foreground">
          Per-league pay gate overrides are managed from each league's settings page (PRD 75).
          Leagues without a subscription row are treated as free tier — no backfill migration needed.
        </p>
      </div>

      {/* Tier Create/Edit Dialog */}
      <TierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        tier={editingTier}
        onSaved={loadTiers}
      />

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        open={deactivateTarget != null}
        onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}
        title={`Deactivate "${deactivateTarget?.name}"?`}
        description={
          deactivateTarget
            ? deactivateTarget.active_league_count > 0
              ? `${deactivateTarget.active_league_count} league${deactivateTarget.active_league_count !== 1 ? "s are" : " is"} currently on this tier. They will retain access until their billing period ends. The tier will be hidden from the public pricing page.`
              : "This tier has no active leagues. It will be hidden from the public pricing page immediately."
            : undefined
        }
        confirmText="Deactivate"
        variant="destructive"
        onConfirm={handleDeactivate}
        isLoading={deactivating}
      />
    </div>
  );
}
