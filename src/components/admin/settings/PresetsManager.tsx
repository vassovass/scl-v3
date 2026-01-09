"use client";

import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Layers, Save, Play, Loader2, Star } from "lucide-react";

interface Preset {
  id: string;
  name: string;
  description?: string;
  settings: Record<string, unknown>;
  is_default?: boolean;
  created_at?: string;
}

interface PresetsManagerProps {
  onApplied?: () => void;
}

/**
 * Preset selector and manager for settings page
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export function PresetsManager({ onApplied }: PresetsManagerProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDescription, setNewPresetDescription] = useState("");

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/settings/presets");
      if (!response.ok) throw new Error("Failed to fetch presets");
      const data = await response.json();
      setPresets(data.presets || []);
    } catch (err) {
      console.error("Error fetching presets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = async () => {
    if (!selectedPresetId) return;

    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) return;

    setIsApplying(true);
    try {
      const response = await fetch(`/api/admin/settings/presets/${selectedPresetId}/apply`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to apply preset");

      const data = await response.json();

      toast({
        title: "Preset Applied",
        description: `Applied "${preset.name}" (${data.applied} settings updated)`,
      });

      onApplied?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to apply preset",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a preset name",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPresetName.trim(),
          description: newPresetDescription.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save preset");
      }

      toast({
        title: "Preset Saved",
        description: `Saved current settings as "${newPresetName}"`,
      });

      setShowSaveDialog(false);
      setNewPresetName("");
      setNewPresetDescription("");
      fetchPresets();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save preset",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50 mb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Layers className="h-4 w-4" />
        <span>Presets</span>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select
          value={selectedPresetId}
          onValueChange={setSelectedPresetId}
          disabled={isLoading}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select a preset..." />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                <div className="flex items-center gap-2">
                  {preset.is_default && <Star className="h-3 w-3 text-amber-500" />}
                  <span>{preset.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyPreset}
          disabled={!selectedPresetId || isApplying}
        >
          {isApplying ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          Apply
        </Button>

        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save Current
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Current Settings as Preset</DialogTitle>
              <DialogDescription>
                Create a new preset from the current settings configuration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Name</Label>
                <Input
                  id="preset-name"
                  placeholder="e.g., My Custom Config"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preset-description">Description (optional)</Label>
                <Input
                  id="preset-description"
                  placeholder="Brief description of this preset"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePreset} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Save Preset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedPreset?.description && (
        <p className="text-xs text-muted-foreground w-full sm:w-auto mt-1 sm:mt-0">
          {selectedPreset.description}
        </p>
      )}
    </div>
  );
}
