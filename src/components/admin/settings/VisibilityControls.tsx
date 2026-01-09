"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Eye, Users } from "lucide-react";

interface VisibilityControlsProps {
  settingKey: string;
  visibleTo: string[];
  editableBy: string[];
  showInLeagueSettings: boolean;
  onUpdate: (updates: {
    visible_to?: string[];
    editable_by?: string[];
    show_in_league_settings?: boolean;
  }) => void;
  disabled?: boolean;
}

const ROLES = [
  { value: "superadmin", label: "SuperAdmin", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "owner", label: "Owner", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "admin", label: "Admin", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "member", label: "Member", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
];

/**
 * Inline badge component for role selection
 */
function RoleBadge({
  children,
  active,
  color,
  disabled,
  onClick
}: {
  children: React.ReactNode;
  active: boolean;
  color: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <span
      onClick={disabled ? undefined : onClick}
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium transition-all cursor-pointer ${active
        ? color
        : "bg-muted/30 text-muted-foreground border-border hover:border-muted-foreground/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </span>
  );
}

/**
 * Visibility controls for a setting
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export function VisibilityControls({
  settingKey,
  visibleTo,
  editableBy,
  showInLeagueSettings,
  onUpdate,
  disabled,
}: VisibilityControlsProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleVisibility = (role: string) => {
    if (disabled) return;
    const newVisibleTo = visibleTo.includes(role)
      ? visibleTo.filter((r) => r !== role)
      : [...visibleTo, role];
    onUpdate({ visible_to: newVisibleTo });
  };

  const toggleEditable = (role: string) => {
    if (disabled) return;
    const newEditableBy = editableBy.includes(role)
      ? editableBy.filter((r) => r !== role)
      : [...editableBy, role];
    onUpdate({ editable_by: newEditableBy });
  };

  const toggleShowInLeague = () => {
    if (disabled) return;
    onUpdate({ show_in_league_settings: !showInLeagueSettings });
  };

  return (
    <div className="border-t border-border/50 pt-3 mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        disabled={disabled}
      >
        <Eye className="h-3 w-3" />
        <span>Visibility Controls</span>
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 pl-5">
          {/* Visible To */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Visible to</Label>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((role) => (
                <RoleBadge
                  key={role.value}
                  active={visibleTo.includes(role.value)}
                  color={role.color}
                  disabled={disabled}
                  onClick={() => toggleVisibility(role.value)}
                >
                  {role.label}
                </RoleBadge>
              ))}
            </div>
          </div>

          {/* Editable By */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Editable by</Label>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.slice(0, 3).map((role) => (
                <RoleBadge
                  key={role.value}
                  active={editableBy.includes(role.value)}
                  color={role.color}
                  disabled={disabled}
                  onClick={() => toggleEditable(role.value)}
                >
                  {role.label}
                </RoleBadge>
              ))}
            </div>
          </div>

          {/* Show in League Settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground cursor-pointer">
                Show in League Settings
              </Label>
            </div>
            <Switch
              checked={showInLeagueSettings}
              onCheckedChange={toggleShowInLeague}
              disabled={disabled}
              className="scale-75"
            />
          </div>
        </div>
      )}
    </div>
  );
}

