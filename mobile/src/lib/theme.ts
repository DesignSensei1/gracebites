import { useColorScheme } from "react-native";

// Same sky blue and white palette as the website (src/app/globals.css).
const light = {
  bg: "#ffffff",
  surface: "#f0f9ff",
  surfaceStrong: "#e0f2fe",
  card: "#ffffff",
  border: "#bae6fd",
  text: "#0c4a6e",
  muted: "#3b7aa0",
  primary: "#0ea5e9",
  primaryPressed: "#0284c7",
  primaryFg: "#ffffff",
  danger: "#dc2626",
};

const dark: typeof light = {
  bg: "#07131f",
  surface: "#0d2135",
  surfaceStrong: "#123150",
  card: "#0b1b2c",
  border: "#1d4466",
  text: "#e0f2fe",
  muted: "#8cc4e3",
  primary: "#38bdf8",
  primaryPressed: "#7dd3fc",
  primaryFg: "#04213a",
  danger: "#f87171",
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
