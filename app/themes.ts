export type ThemeId =
  | "tokyo" | "nord" | "catppuccin" | "gruvbox" | "synthwave"
  | "phosphor" | "blueprint" | "solarized" | "swiss" | "daylight";

export type ScenePalette = {
  stage: number;
  floor: number;
  grid: [number, number];
  cubeBase: number;
  cubeEdge: number;
  emissive: number;
  pending: number;
  active: number;
  settled: number;
  dimmed: number;
  link: number;
  linkActive: number;
  hemi: [number, number];
  spot: number;
  rim: number;
  labelBg: string;
  labelText: string;
};

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  dot: [string, string];
  scene: ScenePalette;
};

export const defaultThemeId: ThemeId = "tokyo";

export const themes: ThemeDefinition[] = [
  {
    id: "tokyo", label: "Tokyo Night", dot: ["#1a1b26", "#7aa2f7"],
    scene: {
      stage: 0x15161e, floor: 0x1a1b26, grid: [0x414868, 0x24283b],
      cubeBase: 0x414868, cubeEdge: 0x7aa2f7, emissive: 0x15161e,
      pending: 0x7aa2f7, active: 0xe0af68, settled: 0x9ece6a, dimmed: 0x292e42,
      link: 0x414868, linkActive: 0x7dcfff, hemi: [0x7dcfff, 0x15161e],
      spot: 0x7aa2f7, rim: 0xbb9af7, labelBg: "rgba(21,22,30,.9)", labelText: "#c0caf5",
    },
  },
  {
    id: "nord", label: "Nord Observatory", dot: ["#2e3440", "#88c0d0"],
    scene: {
      stage: 0x272c36, floor: 0x2e3440, grid: [0x4c566a, 0x3b4252],
      cubeBase: 0x4c566a, cubeEdge: 0x88c0d0, emissive: 0x272c36,
      pending: 0x5e81ac, active: 0xebcb8b, settled: 0xa3be8c, dimmed: 0x343b49,
      link: 0x4c566a, linkActive: 0x88c0d0, hemi: [0x88c0d0, 0x272c36],
      spot: 0x81a1c1, rim: 0xb48ead, labelBg: "rgba(39,44,54,.9)", labelText: "#eceff4",
    },
  },
  {
    id: "catppuccin", label: "Catppuccin Play", dot: ["#1e1e2e", "#cba6f7"],
    scene: {
      stage: 0x181825, floor: 0x1e1e2e, grid: [0x45475a, 0x313244],
      cubeBase: 0x45475a, cubeEdge: 0xcba6f7, emissive: 0x181825,
      pending: 0x89b4fa, active: 0xf9e2af, settled: 0xa6e3a1, dimmed: 0x2a2a3c,
      link: 0x45475a, linkActive: 0xf5c2e7, hemi: [0xcba6f7, 0x181825],
      spot: 0x89b4fa, rim: 0xf5c2e7, labelBg: "rgba(24,24,37,.9)", labelText: "#cdd6f4",
    },
  },
  {
    id: "gruvbox", label: "Gruvbox Workshop", dot: ["#282828", "#fe8019"],
    scene: {
      stage: 0x1d2021, floor: 0x282828, grid: [0x504945, 0x3c3836],
      cubeBase: 0x504945, cubeEdge: 0xfe8019, emissive: 0x1d2021,
      pending: 0x83a598, active: 0xfabd2f, settled: 0xb8bb26, dimmed: 0x32302f,
      link: 0x504945, linkActive: 0xfe8019, hemi: [0xfbf1c7, 0x1d2021],
      spot: 0xfe8019, rim: 0xd3869b, labelBg: "rgba(29,32,33,.9)", labelText: "#ebdbb2",
    },
  },
  {
    id: "synthwave", label: "Synthwave '84", dot: ["#241b2f", "#ff7edb"],
    scene: {
      stage: 0x1a1425, floor: 0x241b2f, grid: [0x495495, 0x34294f],
      cubeBase: 0x3b2d55, cubeEdge: 0xff7edb, emissive: 0x1a1425,
      pending: 0xc792ea, active: 0xfede5d, settled: 0x72f1b8, dimmed: 0x2b2140,
      link: 0x495495, linkActive: 0x36f9f6, hemi: [0x36f9f6, 0x1a1425],
      spot: 0xff7edb, rim: 0x36f9f6, labelBg: "rgba(26,20,37,.9)", labelText: "#f4eee4",
    },
  },
  {
    id: "phosphor", label: "Phosphor Terminal", dot: ["#0a0f0a", "#39ff7c"],
    scene: {
      stage: 0x060906, floor: 0x0a0f0a, grid: [0x1e3320, 0x122414],
      cubeBase: 0x0f2415, cubeEdge: 0x39ff7c, emissive: 0x061407,
      pending: 0x2e8f57, active: 0xd7ff5e, settled: 0x39ff7c, dimmed: 0x102418,
      link: 0x1e3320, linkActive: 0x39ff7c, hemi: [0x39ff7c, 0x060906],
      spot: 0x39ff7c, rim: 0x8dff9e, labelBg: "rgba(6,9,6,.9)", labelText: "#8dff9e",
    },
  },
  {
    id: "blueprint", label: "Blueprint", dot: ["#0f3564", "#ffffff"],
    scene: {
      stage: 0x0c2f5a, floor: 0x0f3564, grid: [0x2c5a94, 0x1a4478],
      cubeBase: 0x1a4c86, cubeEdge: 0xcfe2ff, emissive: 0x0c2f5a,
      pending: 0x7fb3e8, active: 0xffd166, settled: 0x7ee8a2, dimmed: 0x123c6e,
      link: 0x4d79ad, linkActive: 0xffffff, hemi: [0x9fd0ff, 0x0c2f5a],
      spot: 0xffffff, rim: 0x9fd0ff, labelBg: "rgba(12,47,90,.9)", labelText: "#eaf2ff",
    },
  },
  {
    id: "solarized", label: "Solarized Study", dot: ["#fdf6e3", "#268bd2"],
    scene: {
      stage: 0xeee8d5, floor: 0xe6dfc8, grid: [0xd6cdb2, 0xe0d8bf],
      cubeBase: 0x93a1a1, cubeEdge: 0x268bd2, emissive: 0x000000,
      pending: 0x268bd2, active: 0xb58900, settled: 0x859900, dimmed: 0xd9d2b9,
      link: 0xc9c0a4, linkActive: 0x268bd2, hemi: [0xffffff, 0xeee8d5],
      spot: 0xffffff, rim: 0x6c71c4, labelBg: "rgba(253,246,227,.92)", labelText: "#073642",
    },
  },
  {
    id: "swiss", label: "Swiss Studio", dot: ["#ffffff", "#e02d21"],
    scene: {
      stage: 0xf5f5f4, floor: 0xebebe9, grid: [0xdcdcda, 0xe6e6e4],
      cubeBase: 0xffffff, cubeEdge: 0x141414, emissive: 0x000000,
      pending: 0xffffff, active: 0xe02d21, settled: 0x141414, dimmed: 0xe7e7e5,
      link: 0xbcbcba, linkActive: 0xe02d21, hemi: [0xffffff, 0xe8e8e6],
      spot: 0xffffff, rim: 0xffffff, labelBg: "rgba(255,255,255,.95)", labelText: "#141414",
    },
  },
  {
    id: "daylight", label: "Daylight SaaS", dot: ["#f7f8fc", "#5468ff"],
    scene: {
      stage: 0xeef1f8, floor: 0xe2e7f3, grid: [0xcdd5ea, 0xdde3f2],
      cubeBase: 0xb9c3ea, cubeEdge: 0x5468ff, emissive: 0x000000,
      pending: 0x5468ff, active: 0xf59e0b, settled: 0x10b981, dimmed: 0xd8ddeb,
      link: 0xb7c1dd, linkActive: 0x5468ff, hemi: [0xffffff, 0xdde3f2],
      spot: 0xffffff, rim: 0x7c5cff, labelBg: "rgba(255,255,255,.92)", labelText: "#1a1f36",
    },
  },
];

export const themeById = Object.fromEntries(themes.map(theme => [theme.id, theme])) as Record<ThemeId, ThemeDefinition>;

export function isThemeId(value: string): value is ThemeId {
  return value in themeById;
}
