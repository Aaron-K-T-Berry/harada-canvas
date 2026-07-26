import type { HaradaSquare } from "@/models/harada-square";

export const APP_DATA_VERSION = 1;

export type ThemePreference = "light" | "dark" | "system";

export interface AppPreferences {
  theme: ThemePreference;
  onboardingSeen: boolean;
}

export interface AppData {
  version: number;
  squares: HaradaSquare[];
  preferences: AppPreferences;
}

export interface HaradaCanvasBackup {
  version: number;
  exportedAt: string;
  squares: HaradaSquare[];
  preferences: AppPreferences;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: "system",
  onboardingSeen: false,
};

export function createEmptyAppData(preferences: AppPreferences = DEFAULT_PREFERENCES): AppData {
  return {
    version: APP_DATA_VERSION,
    squares: [],
    preferences,
  };
}
