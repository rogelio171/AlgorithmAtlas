export type ThemeId =
  | "tokyo" | "nord" | "catppuccin" | "gruvbox" | "synthwave"
  | "phosphor" | "blueprint" | "solarized" | "swiss" | "daylight";

// Colors live in app/globals.css as [data-theme] token blocks — the simulation
// stage reads the same tokens as the rest of the UI. `dot` only feeds the
// two-tone swatch in the picker.
export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  dot: [string, string];
};

export const defaultThemeId: ThemeId = "tokyo";

export const themes: ThemeDefinition[] = [
  { id: "tokyo", label: "Tokyo Night", dot: ["#1a1b26", "#7aa2f7"] },
  { id: "nord", label: "Nord Observatory", dot: ["#2e3440", "#88c0d0"] },
  { id: "catppuccin", label: "Catppuccin Play", dot: ["#1e1e2e", "#cba6f7"] },
  { id: "gruvbox", label: "Gruvbox Workshop", dot: ["#282828", "#fe8019"] },
  { id: "synthwave", label: "Synthwave '84", dot: ["#241b2f", "#ff7edb"] },
  { id: "phosphor", label: "Phosphor Terminal", dot: ["#0a0f0a", "#39ff7c"] },
  { id: "blueprint", label: "Blueprint", dot: ["#0f3564", "#ffffff"] },
  { id: "solarized", label: "Solarized Study", dot: ["#fdf6e3", "#268bd2"] },
  { id: "swiss", label: "Swiss Studio", dot: ["#ffffff", "#e02d21"] },
  { id: "daylight", label: "Daylight SaaS", dot: ["#f7f8fc", "#5468ff"] },
];

export const themeById = Object.fromEntries(themes.map(theme => [theme.id, theme])) as Record<ThemeId, ThemeDefinition>;

export function isThemeId(value: string): value is ThemeId {
  return value in themeById;
}
