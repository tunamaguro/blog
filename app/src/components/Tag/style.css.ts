import { colors } from "src/styles/theme.css.ts";

import { style } from "@vanilla-extract/css";
export const tag = style({
  ":hover": {
    backgroundColor: colors.color.primary,
    color: colors.color.primaryContent,
    borderColor: "transparent",
  },
  borderColor: colors.surface.baseContent,
});
