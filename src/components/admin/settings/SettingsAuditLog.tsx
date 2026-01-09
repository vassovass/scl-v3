"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditEntry {
  id: string;
  setting_key: string;
  old_value: unknown;
  new_value: unknown;
  changed_by: string;
  changed_at: string;
  change_reason?: string;
  user?: { display_name?: string };
}

/**
 * Audit log display for settings changes
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export function SettingsAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expanded && entries.length === 0) {
      fetchAuditLog();
    }
  }, [expanded]);

  const fetchAuditLog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings/audit?limit=20");
      if (!response.ok) throw new Error("Failed to fetch audit log");
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err: any) {
      setError(err.message || "Failed to load audit log");
    } finally {
      setIsLoading(false);
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const formatTime = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="mt-8 border-t border-border pt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Clock className="h-4 w-4" />
        <span>Recent Changes</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {expanded && (
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-muted/30 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : entries.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No changes recorded yet
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {entry.setting_key}
                        </span>
                        {entry.change_reason && (
                          <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                            {entry.change_reason}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{entry.user?.display_name || "Unknown"}</span>
                        <span className="mx-1">•</span>
                        <span>{formatTime(entry.changed_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Value change */}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                      <span className="text-destructive/70 block mb-1">Old</span>
                      <code className="text-destructive break-all">
                        {formatValue(entry.old_value)}
                      </code>
                    </div>
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-emerald-500/70 block mb-1">New</span>
                      <code className="text-emerald-500 break-all">
                        {formatValue(entry.new_value)}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {entries.length > 0 && (
            <button
              onClick={fetchAuditLog}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Refresh
            </button>
          )}
        </div>
      )}
    </div>
  );
}
