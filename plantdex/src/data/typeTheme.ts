import type { PlantType } from "../types/plant";

export interface TypeTheme {
  label: string;
  /** Primary accent color. */
  color: string;
  /** Soft translucent version for fills. */
  soft: string;
  /** Two-stop gradient for headers/cards. */
  gradient: [string, string];
  /** A little emoji glyph used on badges. */
  glyph: string;
}

export const TYPE_THEME: Record<PlantType, TypeTheme> = {
  tree: {
    label: "Tree",
    color: "#3f9b54",
    soft: "rgba(63, 155, 84, 0.18)",
    gradient: ["#2f7a41", "#5bbf6f"],
    glyph: "🌳",
  },
  flower: {
    label: "Flower",
    color: "#e978aa",
    soft: "rgba(233, 120, 170, 0.18)",
    gradient: ["#d65b95", "#ff9ec7"],
    glyph: "🌸",
  },
  herb: {
    label: "Herb",
    color: "#8bbf3f",
    soft: "rgba(139, 191, 63, 0.18)",
    gradient: ["#6f9e2c", "#aede5c"],
    glyph: "🌿",
  },
  houseplant: {
    label: "Houseplant",
    color: "#34b3a0",
    soft: "rgba(52, 179, 160, 0.18)",
    gradient: ["#1f8f7e", "#5fd6c4"],
    glyph: "🪴",
  },
  succulent: {
    label: "Succulent",
    color: "#6fc18a",
    soft: "rgba(111, 193, 138, 0.18)",
    gradient: ["#4e9e6c", "#9be0b0"],
    glyph: "🥬",
  },
  cactus: {
    label: "Cactus",
    color: "#caa64a",
    soft: "rgba(202, 166, 74, 0.18)",
    gradient: ["#a9842f", "#e6c970"],
    glyph: "🌵",
  },
  fern: {
    label: "Fern",
    color: "#4fae6e",
    soft: "rgba(79, 174, 110, 0.18)",
    gradient: ["#357a4d", "#79d394"],
    glyph: "🌾",
  },
  shrub: {
    label: "Shrub",
    color: "#5aa663",
    soft: "rgba(90, 166, 99, 0.18)",
    gradient: ["#41864a", "#82cf8c"],
    glyph: "🍃",
  },
  vine: {
    label: "Vine",
    color: "#7fb24a",
    soft: "rgba(127, 178, 74, 0.18)",
    gradient: ["#5f8f30", "#a6d96f"],
    glyph: "🌱",
  },
};

/** The primary type drives a plant's accent color/theme. */
export function primaryType(types: PlantType[]): PlantType {
  return types[0] ?? "houseplant";
}

export function themeFor(types: PlantType[]): TypeTheme {
  return TYPE_THEME[primaryType(types)];
}
