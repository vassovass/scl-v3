export type ThemeMode = "dark" | "light" | "system";

export interface ThemeSettings {
  defaultMode: ThemeMode;
  allowedModes: ThemeMode[];
}

export const THEME_MODE_OPTIONS: Array<{ value: ThemeMode; label: string; description: string }> = [
  { value: "dark", label: "Dark", description: "Dark theme" },
  { value: "light", label: "Light", description: "Light theme" },
  { value: "system", label: "System", description: "Follow system preference" },
];

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  defaultMode: "system",
  allowedModes: ["dark", "light", "system"],
};

const THEME_MODE_SET = new Set<ThemeMode>(["dark", "light", "system"]);

function normalizeThemeMode(value: unknown): ThemeMode | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/^"|"$/g, "");
  if (THEME_MODE_SET.has(normalized as ThemeMode)) {
    return normalized as ThemeMode;
  }
  return undefined;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.replace(/^"|"$/g, "").toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

export function buildAllowedModes(config: {
  allowDark?: unknown;
  allowLight?: unknown;
  allowSystem?: unknown;
}): ThemeMode[] {
  const allowDark = normalizeBoolean(config.allowDark, true);
  const allowLight = normalizeBoolean(config.allowLight, true);
  const allowSystem = normalizeBoolean(config.allowSystem, true);

  const allowed: ThemeMode[] = [];
  if (allowDark) allowed.push("dark");
  if (allowLight) allowed.push("light");
  if (allowSystem) allowed.push("system");

  return allowed.length > 0 ? allowed : ["dark"];
}

export function resolveDefaultThemeMode(value: unknown, allowedModes: ThemeMode[]): ThemeMode {
  const normalized = normalizeThemeMode(value);
  if (normalized && allowedModes.includes(normalized)) {
    return normalized;
  }
  return allowedModes[0] ?? DEFAULT_THEME_SETTINGS.defaultMode;
}

export function getThemeSettingsFromValues(values: {
  defaultMode?: unknown;
  allowDark?: unknown;
  allowLight?: unknown;
  allowSystem?: unknown;
}): ThemeSettings {
  const allowedModes = buildAllowedModes({
    allowDark: values.allowDark,
    allowLight: values.allowLight,
    allowSystem: values.allowSystem,
  });

  return {
    allowedModes,
    defaultMode: resolveDefaultThemeMode(values.defaultMode, allowedModes),
  };
}
