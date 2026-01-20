"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { USER_ROLES } from "@/lib/menuConfig";

interface MenuItemData {
  id?: string;
  item_key: string;
  label: string;
  href?: string | null;
  icon?: string | null;
  description?: string | null;
  visible_to?: string[] | null;
  hidden_from?: string[] | null;
  requires_league?: boolean;
  on_click?: string | null;
  external?: boolean;
  divider_before?: boolean;
}

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItemData | null;
  onSave: (data: MenuItemData) => Promise<void>;
  mode: 'create' | 'edit';
}

/**
 * Add/Edit menu item modal form
 */
export function MenuItemForm({ open, onOpenChange, item, onSave, mode }: MenuItemFormProps) {
  const [formData, setFormData] = useState<MenuItemData>({
    item_key: '',
    label: '',
    href: '',
    icon: '',
    description: '',
    visible_to: [],
    hidden_from: [],
    requires_league: false,
    on_click: '',
    external: false,
    divider_before: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load item data when editing
  useEffect(() => {
    if (item && mode === 'edit') {
      setFormData({
        id: item.id,
        item_key: item.item_key,
        label: item.label,
        href: item.href || '',
        icon: item.icon || '',
        description: item.description || '',
        visible_to: item.visible_to || [],
        hidden_from: item.hidden_from || [],
        requires_league: item.requires_league || false,
        on_click: item.on_click || '',
        external: item.external || false,
        divider_before: item.divider_before || false,
      });
    } else {
      // Reset form for create mode
      setFormData({
        item_key: '',
        label: '',
        href: '',
        icon: '',
        description: '',
        visible_to: [],
        hidden_from: [],
        requires_league: false,
        on_click: '',
        external: false,
        divider_before: false,
      });
    }
  }, [item, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Clean up empty strings
      const cleanedData = {
        ...formData,
        href: formData.href || null,
        icon: formData.icon || null,
        description: formData.description || null,
        on_click: formData.on_click || null,
        visible_to: formData.visible_to?.length ? formData.visible_to : null,
        hidden_from: formData.hidden_from?.length ? formData.hidden_from : null,
      };

      await onSave(cleanedData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save menu item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVisibilityRole = (role: string) => {
    const current = formData.visible_to || [];
    const updated = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];
    setFormData({ ...formData, visible_to: updated });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === 'create' ? 'Add Menu Item' : 'Edit Menu Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_key" className="text-foreground">
                Item Key <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item_key"
                value={formData.item_key}
                onChange={(e) => setFormData({ ...formData, item_key: e.target.value })}
                placeholder="e.g., dashboard, league-submit"
                required
                disabled={mode === 'edit'}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label" className="text-foreground">
                Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Dashboard"
                required
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon" className="text-foreground">Icon (emoji)</Label>
              <Input
                id="icon"
                value={formData.icon || ''}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="📊"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="href" className="text-foreground">Href (URL path)</Label>
              <Input
                id="href"
                value={formData.href || ''}
                onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                placeholder="/dashboard or /league/[id]/leaderboard"
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description or subtitle"
              className="bg-background border-border text-foreground"
            />
          </div>

          {/* Behavior */}
          <div className="space-y-2">
            <Label htmlFor="on_click" className="text-foreground">Named Action (onClick)</Label>
            <Input
              id="on_click"
              value={formData.on_click || ''}
              onChange={(e) => setFormData({ ...formData, on_click: e.target.value })}
              placeholder="e.g., signOut, startTour"
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">Use this instead of href for custom actions</p>
          </div>

          {/* Visibility Settings */}
          <div className="space-y-3 border border-border rounded-lg p-4 bg-card">
            <Label className="text-foreground font-medium">Visibility</Label>

            <div className="flex items-center gap-2">
              <Checkbox
                id="requires_league"
                checked={formData.requires_league}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requires_league: checked as boolean })
                }
              />
              <Label htmlFor="requires_league" className="text-sm text-foreground cursor-pointer">
                Only show when user is in a league
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Visible to roles (leave empty for all authenticated):</Label>
              <div className="flex flex-wrap gap-2">
                {USER_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleVisibilityRole(role)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      formData.visible_to?.includes(role)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="external"
                checked={formData.external}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, external: checked as boolean })
                }
              />
              <Label htmlFor="external" className="text-sm text-foreground cursor-pointer">
                External link (opens in new tab)
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="divider_before"
                checked={formData.divider_before}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, divider_before: checked as boolean })
                }
              />
              <Label htmlFor="divider_before" className="text-sm text-foreground cursor-pointer">
                Show separator before this item
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

