export interface Category {
  id: string;
  name: string;
  color: string;
}

// Maps a US state name (e.g. "California") to the ids of the Categories assigned to it,
// in the order they were painted. States with no entry (or an empty array) are unassigned.
export type Assignments = Record<string, string[]>;

// Sentinel "tool" id for the eraser (clears a state's assignment). Not a real Category.
export const ERASER_TOOL_ID = "__eraser__";

export const CATEGORY_COLOR_PALETTE = [
  "#e63946",
  "#f4a261",
  "#e9c46a",
  "#2a9d8f",
  "#457b9d",
  "#8338ec",
  "#ff006e",
  "#3a86ff",
  "#06d6a0",
  "#fb5607",
];
