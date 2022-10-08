import type { Theme } from "@mui/material/styles";
import { lensPath, set, view } from "ramda";

import getOverrides from "./overrides";

export const components = (theme: Theme) => {
  const lens = lensPath(["components"]);
  return set(lens, view(lens, getOverrides(theme)), theme);
};

export const background = (theme: Theme) => {
  const lens = lensPath(["palette", "background"]);
  return set(lens, view(lens, getOverrides(theme)), theme);
};
